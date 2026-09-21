import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { GRUPOS } from '../constantes'
import LayoutPublico from '../layouts/LayoutPublico.vue'
import LayoutApp from '../layouts/LayoutApp.vue'
import HomeView from '../views/HomeView.vue'

// meta.roles = roles que pueden entrar. Es un espejo de los [Authorize] del
// backend: aquí solo sirve para no mostrar pantallas que van a dar 403; quien
// manda de verdad es la API.
const routes = [
  {
    path: '/',
    component: LayoutPublico,
    children: [
      { path: '', name: 'inicio', component: HomeView },
      {
        path: 'tienda',
        name: 'tienda',
        component: () => import('../views/CatalogoView.vue')
      }
    ]
  },
  {
    // Pantalla propia, sin la cabecera pública.
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { soloInvitados: true }
  },
  {
    path: '/',
    component: LayoutApp,
    meta: { requiereSesion: true },
    children: [
      {
        path: 'panel',
        name: 'panel',
        component: () => import('../views/PanelView.vue'),
        meta: { titulo: 'Panel', roles: GRUPOS.TODOS }
      },
      {
        path: 'citas',
        name: 'citas',
        component: () => import('../views/CitasView.vue'),
        meta: { titulo: 'Citas', roles: GRUPOS.TODOS }
      },
      {
        path: 'mascotas',
        name: 'mascotas',
        component: () => import('../views/MascotasView.vue'),
        meta: { titulo: 'Mascotas', roles: GRUPOS.TODOS }
      },
      {
        path: 'clientes',
        name: 'clientes',
        component: () => import('../views/ClientesView.vue'),
        meta: { titulo: 'Clientes', roles: GRUPOS.PERSONAL }
      },
      {
        path: 'inventario',
        name: 'inventario',
        component: () => import('../views/InventarioView.vue'),
        meta: { titulo: 'Inventario', roles: GRUPOS.ADMIN_O_RECEPCION }
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('../views/PerfilView.vue'),
        meta: { titulo: 'Mi cuenta', roles: GRUPOS.TODOS }
      }
    ]
  },
  {
    path: '/sin-permiso',
    name: 'sin-permiso',
    component: () => import('../views/SinPermisoView.vue')
  },
  {
    path: '/:ruta(.*)*',
    name: 'no-encontrado',
    component: () => import('../views/NoEncontradoView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_a, _b, guardada) => guardada ?? { top: 0 }
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Al recargar la página el token (que vive en memoria) se pierde. Antes de
  // decidir nada, intentamos recuperar la sesión con la cookie de refresh.
  // `inicializar` solo hace el trabajo la primera vez.
  await auth.inicializar()

  const requiereSesion = to.matched.some((r) => r.meta.requiereSesion)

  if (requiereSesion && !auth.estaAutenticado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Ya con sesión, /login no tiene sentido.
  if (to.meta.soloInvitados && auth.estaAutenticado) {
    return { name: 'panel' }
  }

  const roles = to.meta.roles
  if (requiereSesion && roles && !roles.includes(auth.rol)) {
    return { name: 'sin-permiso' }
  }

  return true
})

// Título de la pestaña acorde a la pantalla.
router.afterEach((to) => {
  const titulo = to.meta.titulo
  document.title = titulo ? `${titulo} · Rivervet` : 'Rivervet — Centro Veterinario'
})

export default router
