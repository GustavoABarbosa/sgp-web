import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import Icon from './components/Icon.vue'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.component('Icon', Icon)

const auth = useAuthStore()
auth.init().finally(() => {
  app.mount('#app')
})
