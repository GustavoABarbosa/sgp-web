<script setup lang="ts" generic="T">
import { useRouter, type RouteLocationRaw } from 'vue-router'

export interface Column {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  /** Keeps the header for screen readers only, e.g. for action columns. */
  hideLabel?: boolean
  class?: string
}

const props = defineProps<{
  columns: Column[]
  rows: T[]
  rowKey: (row: T) => string
  rowTo?: (row: T) => RouteLocationRaw
  /** Emits `rowClick` for mouse users; keyboard users need an equivalent control inside the row. */
  clickable?: boolean
  empty?: string
}>()

const emit = defineEmits<{ rowClick: [row: T] }>()

defineSlots<{
  [key: `cell-${string}`]: (props: { row: T }) => unknown
}>()

const router = useRouter()

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' }

function onRowClick(row: T, event: MouseEvent) {
  if ((event.target as HTMLElement).closest('a, button, input, select, textarea, label, [role="menu"]')) return
  if (props.rowTo) router.push(props.rowTo(row))
  else if (props.clickable) emit('rowClick', row)
}

function cellValue(row: T, key: string) {
  return (row as Record<string, unknown>)[key]
}
</script>

<template>
  <p v-if="!rows.length" class="text-sm text-muted">{{ empty ?? 'Nenhum registro encontrado' }}</p>
  <div v-else class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            class="border-b border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted"
            :class="ALIGN[col.align ?? 'left']"
          >
            <span :class="{ 'sr-only': col.hideLabel }">{{ col.label }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="rowKey(row)"
          :class="(rowTo || clickable) && 'cursor-pointer transition-colors duration-200 hover:bg-page'"
          @click="onRowClick(row, $event)"
        >
          <td
            v-for="(col, index) in columns"
            :key="col.key"
            class="border-b border-border px-3 py-2.5 align-middle"
            :class="[ALIGN[col.align ?? 'left'], col.class]"
          >
            <RouterLink v-if="index === 0 && rowTo" :to="rowTo(row)" class="text-text no-underline">
              <slot :name="`cell-${col.key}`" :row="row">{{ cellValue(row, col.key) }}</slot>
            </RouterLink>
            <slot v-else :name="`cell-${col.key}`" :row="row">{{ cellValue(row, col.key) }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
