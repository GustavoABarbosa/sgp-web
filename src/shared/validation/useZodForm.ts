import { reactive, ref } from 'vue'
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

  function validate(): T | null {
    fieldErrors.value = {}
    const result = schema.safeParse(fields)

    if (result.success) return result.data

    fieldErrors.value = getZodFieldErrors(result.error) as Partial<Record<keyof T & string, string>>
    return null
  }

  function errorFor(key: keyof T & string): string {
    return fieldErrors.value[key] ?? ''
  }

  function clearErrors() {
    fieldErrors.value = {}
  }

  return { fields, fieldErrors, validate, errorFor, clearErrors }
}
