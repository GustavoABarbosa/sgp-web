<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import {
  EMAIL_DOMAINS,
  STUDENT_EMAIL_DOMAIN,
  TEACHER_EMAIL_DOMAIN,
} from '@/shared/validation'

const props = withDefaults(
  defineProps<{
    label?: string
    error?: string
    id?: string
    domain?: string
    domains?: readonly string[]
    placeholder?: string
    autocomplete?: string
  }>(),
  {
    label: '',
    error: '',
    placeholder: 'nome.sobrenome',
    autocomplete: 'email',
  },
)

const model = defineModel<string>({ required: true })
const emit = defineEmits<{ enter: [] }>()
const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
const hasError = computed(() => Boolean(props.error))
const errorId = computed(() => `${fieldId.value}-error`)

const selectableDomains = computed(
  () => props.domains ?? (props.domain ? [props.domain] : [...EMAIL_DOMAINS]),
)
const canSelectDomain = computed(() => selectableDomains.value.length > 1)

const localPart = ref('')
const selectedDomain = ref(selectableDomains.value[0] ?? STUDENT_EMAIL_DOMAIN)

function parseEmail(email: string) {
  const at = email.lastIndexOf('@')
  if (at <= 0) {
    return { local: email.replace(/@/g, ''), domain: selectedDomain.value }
  }
  const domain = email.slice(at)
  const known = selectableDomains.value.includes(domain)
  return {
    local: email.slice(0, at),
    domain: known ? domain : selectedDomain.value,
  }
}

function syncFromModel(email: string) {
  const parsed = parseEmail(email)
  localPart.value = parsed.local
  if (selectableDomains.value.includes(parsed.domain)) {
    selectedDomain.value = parsed.domain
  }
}

function emitEmail() {
  const local = localPart.value.trim().toLowerCase().replace(/@.*$/, '').replace(/\s+/g, '')
  localPart.value = local
  model.value = local ? `${local}${selectedDomain.value}` : ''
}

watch(
  model,
  (email) => {
    const current = localPart.value
      ? `${localPart.value}${selectedDomain.value}`
      : ''
    if (email !== current) syncFromModel(email)
  },
  { immediate: true },
)

watch(selectedDomain, emitEmail)

watch(
  () => props.domain,
  (domain) => {
    if (!domain) return
    selectedDomain.value = domain
    emitEmail()
  },
)

const domainLabel = computed(() => {
  if (selectedDomain.value === TEACHER_EMAIL_DOMAIN) return 'Professor'
  if (selectedDomain.value === STUDENT_EMAIL_DOMAIN) return 'Aluno'
  return selectedDomain.value
})
</script>

<template>
  <div class="mb-4 w-full">
    <label
      v-if="label"
      :for="fieldId"
      :class="['mb-1.5 block text-sm font-medium', hasError ? 'text-danger' : '']"
    >
      {{ label }}
    </label>

    <div class="flex items-stretch gap-2">
      <div
        class="flex min-w-0 flex-1 overflow-hidden rounded-lg bg-white focus-within:ring-2 focus-within:ring-primary/30"
        :class="hasError ? 'border border-danger' : 'border border-border'"
      >
        <input
          :id="fieldId"
          v-model="localPart"
          type="text"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :aria-invalid="hasError || undefined"
          :aria-describedby="hasError ? errorId : undefined"
          class="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 outline-none focus-visible:ring-0"
          @input="emitEmail"
          @blur="emitEmail"
          @keydown.enter="emit('enter')"
        />
        <select
          v-if="canSelectDomain"
          v-model="selectedDomain"
          class="max-w-[11.5rem] shrink-0 appearance-none border-l border-border bg-page py-2 pl-2 pr-7 text-sm font-semibold text-text/80 outline-none focus-visible:ring-0"
          :aria-label="`Domínio (${domainLabel})`"
        >
          <option v-for="d in selectableDomains" :key="d" :value="d">{{ d }}</option>
        </select>
        <span
          v-else
          class="inline-flex shrink-0 items-center border-l border-border bg-page px-3 text-sm font-semibold text-text/80"
        >
          {{ selectedDomain }}
        </span>
      </div>
      <slot name="action" />
    </div>

    <p v-if="error" :id="errorId" class="mt-0.5 text-xs font-medium text-danger">{{ error }}</p>
  </div>
</template>
