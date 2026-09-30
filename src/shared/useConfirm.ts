import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

interface ConfirmState {
  open: boolean
  options: ConfirmOptions
  resolve: ((value: boolean) => void) | null
}

export const confirmState = reactive<ConfirmState>({
  open: false,
  options: { title: '', message: '' },
  resolve: null,
})

export function settleConfirm(value: boolean) {
  confirmState.resolve?.(value)
  confirmState.resolve = null
  confirmState.open = false
}

export function useConfirm() {
  return (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      confirmState.resolve?.(false)
      confirmState.options = options
      confirmState.resolve = resolve
      confirmState.open = true
    })
}
