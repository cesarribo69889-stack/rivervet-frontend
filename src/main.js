import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/styles/main.scss'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// Pinia antes que el router: el guard del router usa el store de sesión.
app.use(createPinia())
app.use(router)

app.mount('#app')
