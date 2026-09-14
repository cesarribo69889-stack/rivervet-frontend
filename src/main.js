import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// Pinia antes que el router: si un guard usa un store, Pinia ya debe estar instalada.
app.use(createPinia())
app.use(router)

app.mount('#app')
