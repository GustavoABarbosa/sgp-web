<script setup lang="ts">
import { computed, nextTick, provide, ref, useId } from "vue";
import { onClickOutside, useElementBounding, useWindowSize } from "@vueuse/core";
import { dropdownCloseKey } from "./dropdown";

const props = withDefaults(
  defineProps<{
    label?: string;
    /** A panel holds form controls instead of menu items, so arrow keys are left to the controls. */
    panel?: boolean;
    menuClass?: string;
    /** Gap in pixels between the trigger and the menu. */
    offset?: number;
  }>(),
  {
    label: "Ações",
    menuClass: "min-w-36",
    offset: 4,
  },
);

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const menuId = useId();

// The menu is fixed to the viewport so scroll containers (tables, modals, slideovers) cannot clip it.
const trigger = useElementBounding(root);
const { height: menuHeight } = useElementBounding(menu);
const viewport = useWindowSize();
const menuStyle = computed(() => {
  const right = `${viewport.width.value - trigger.right.value}px`;
  const fitsBelow = trigger.bottom.value + props.offset + menuHeight.value <= viewport.height.value;
  const fitsAbove = trigger.top.value - props.offset - menuHeight.value >= 0;
  return fitsBelow || !fitsAbove
    ? { top: `${trigger.bottom.value + props.offset}px`, right }
    : { bottom: `${viewport.height.value - trigger.top.value + props.offset}px`, right };
});

const triggerAttrs = computed(() => ({
  "aria-expanded": open.value,
  "aria-haspopup": props.panel ? ("dialog" as const) : ("menu" as const),
  "aria-controls": open.value ? menuId : undefined,
  "data-dropdown-trigger": "",
  onClick: (event: MouseEvent) => {
    event.stopPropagation();
    toggle();
  },
  onKeydown: onTriggerKeydown,
}));

function items() {
  return [...(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
}

function focusItem(index: number) {
  const list = items();
  if (!list.length) return;
  list[(index + list.length) % list.length]!.focus();
}

async function show(focus: "first" | "last" = "first") {
  trigger.update();
  open.value = true;
  await nextTick();
  if (props.panel) {
    menu.value?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
  } else {
    focusItem(focus === "first" ? 0 : -1);
  }
}

function close(restoreFocus = false) {
  open.value = false;
  if (restoreFocus) root.value?.querySelector<HTMLElement>("[data-dropdown-trigger]")?.focus();
}

function toggle() {
  if (open.value) close();
  else show();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.panel) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    show(event.key === "ArrowDown" ? "first" : "last");
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    close(true);
    return;
  }
  if (event.key === "Tab") {
    close();
    return;
  }
  if (props.panel) return;

  const list = items();
  const current = list.indexOf(document.activeElement as HTMLElement);
  const moves: Record<string, number> = {
    ArrowDown: current + 1,
    ArrowUp: current - 1,
    Home: 0,
    End: list.length - 1,
  };
  if (event.key in moves) {
    event.preventDefault();
    focusItem(moves[event.key]!);
  }
}

onClickOutside(root, () => close());
provide(dropdownCloseKey, () => close(true));
</script>

<template>
  <div ref="root" class="relative">
    <slot name="trigger" :open="open" :trigger-attrs="triggerAttrs">
      <button
        type="button"
        class="rounded-full border border-border p-1.5 text-text bg-white hover:border-neutral-400"
        :aria-label="label"
        :title="label"
        v-bind="triggerAttrs"
      >
        <Icon name="ph:dots-three-bold" :class="['size-5 transition-all duration-200', open ? 'rotate-90' : '']" />
      </button>
    </slot>

    <div
      v-if="open"
      :id="menuId"
      ref="menu"
      :role="panel ? 'dialog' : 'menu'"
      :aria-label="label"
      class="fixed z-60 max-h-[calc(100vh-1rem)] overflow-y-auto rounded-lg border border-border bg-surface py-1 text-text shadow-lg"
      :class="menuClass"
      :style="menuStyle"
      @keydown="onMenuKeydown"
    >
      <slot :close="close" />
    </div>
  </div>
</template>
