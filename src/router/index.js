import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    // Lazy loading: este chunk se descarga solo al visitar la ruta.
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Guard global: se ejecuta antes de cada navegación.
// (`_from` no se usa, pero `next` es el tercer parámetro y no se puede omitir.)
router.beforeEach((to, _from, next) => {
  // useAuthStore() se llama aquí dentro, no arriba del archivo: al evaluarse
  // el módulo, Pinia todavía no está instalada en la app.
  const auth = useAuthStore()

  // `isAuthenticated` ya comprueba que el token exista Y no haya expirado
  // (ver utils/jwt.js).
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Si había un token pero venció, lo limpiamos antes de redirigir:
    // si no, quedaría basura en localStorage y el nav seguiría confundido.
    if (auth.token) {
      auth.logout()
    }

    // Guardamos el destino para volver ahí tras el login.
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
