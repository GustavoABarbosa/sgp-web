import { reactive, ref, watch } from 'vue'
import type { ZodError, ZodType } from 'zod'

export function getZodFieldErrors(error: ZodError): Partial<Record<string, string>> {
  const fieldErrors: Partial<Record<string, string>> = {}

  for (const issue of error.issues) {
    const key = String(issue.path[0])
    if (key && !fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }

  return fieldErrors
}

export function useZodForm<T extends Record<string, unknown>>(schema: ZodType<T>, initial: T) {
  const fields = reactive({ ...initial }) as T
  const fieldErrors = ref<Partial<Record<keyof T & string, string>>>({})
  const hasValidated = ref(false)

  function applyValidationResult(result: ReturnType<ZodType<T>['safeParse']>): T | null {
    if (result.success) {
      fieldErrors.value = {}
      return result.data
    }

    fieldErrors.value = getZodFieldErrors(result.error) as Partial<Record<keyof T & string, string>>
    return null
  }

  function validate(): T | null {
    hasValidated.value = true
    return applyValidationResult(schema.safeParse(fields))
  }

  function errorFor(key: keyof T & string): string {
    return fieldErrors.value[key] ?? ''
  }

  function clearErrors() {
    fieldErrors.value = {}
    hasValidated.value = false
  }

  watch(
    fields,
    () => {
      if (!hasValidated.value) return
      applyValidationResult(schema.safeParse(fields))
    },
    { deep: true },
  )

  return { fields, fieldErrors, validate, errorFor, clearErrors }
}
