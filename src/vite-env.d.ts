/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCKS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    Icon: typeof import('./components/Icon.vue')['default']
  }
}

export {}
