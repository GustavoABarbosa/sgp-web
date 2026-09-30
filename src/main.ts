import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setUnauthorizedHandler } from './shared/api/client'
import { MOCKS_ENABLED } from './shared/env'
import Icon from './components/Icon.vue'
import './assets/main.css'

async function bootstrap() {
  if (MOCKS_ENABLED) {
    const { worker } = await import('./mock/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  }

  const app = createApp(App)
  app.use(createPinia())

  const auth = useAuthStore()
  setUnauthorizedHandler(() => {
    auth.clear()
    const redirect = router.currentRoute.value.fullPath
    router.push({ name: 'login', query: redirect.startsWith('/login') ? {} : { redirect } })
  })
  await auth.init()

  app.use(router)
  app.component('Icon', Icon)
  app.mount('#app')
}

bootstrap()
