import type { InjectionKey } from 'vue'

export const dropdownCloseKey: InjectionKey<() => void> = Symbol('dropdown-close')
