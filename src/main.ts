import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import i18n from './i18n'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
