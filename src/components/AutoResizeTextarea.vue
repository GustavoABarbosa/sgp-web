<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    minRows?: number
    maxRows?: number
  }>(),
  {
    minRows: 1,
    maxRows: 6,
  },
)

const model = defineModel<string>({ required: true })
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function resize() {
  const el = textareaRef.value
  if (!el) return

  const style = getComputedStyle(el)
  const lineHeight = Number.parseFloat(style.lineHeight) || 20
  const verticalExtras =
    Number.parseFloat(style.paddingTop) +
    Number.parseFloat(style.paddingBottom) +
    Number.parseFloat(style.borderTopWidth) +
    Number.parseFloat(style.borderBottomWidth)

  const minHeight = lineHeight * props.minRows + verticalExtras
  const maxAutoHeight = lineHeight * props.maxRows + verticalExtras
  const previousHeight = el.getBoundingClientRect().height

  el.style.height = 'auto'
  const contentHeight = el.scrollHeight
  const autoHeight = Math.min(Math.max(contentHeight, minHeight), maxAutoHeight)
  const nextHeight = Math.max(autoHeight, previousHeight)

  el.style.height = `${nextHeight}px`
  el.style.overflowY = contentHeight > nextHeight ? 'auto' : 'hidden'
}

watch(model, () => nextTick(resize))
onMounted(() => nextTick(resize))
</script>

<template>
  <textarea
    ref="textareaRef"
    v-model="model"
    :rows="minRows"
    class="w-full resize-y leading-normal"
    v-bind="$attrs"
    @input="resize"
  />
</template>
