import axios from 'axios'
import {
  CABECERA_CSRF,
  COOKIE_CSRF,
  guardarToken,
  leerCookie,
  limpiarToken,
  obtenerToken
} from './sesion'

// ═══════════════════════════════════════════════════════════════════
//  Cliente HTTP de la API RiverVet (.NET 10).
//
//  · baseURL: http://localhost:3000/api en desarrollo (ver .env.development).
//    El CORS del backend solo acepta http://localhost:5173 como origen.
//  · withCredentials: imprescindible. Sin esto el navegador no envía las
//    cookies rv_refresh / rv_csrf y refresh y logout devolverían 401/403.
//  · Toda respuesta correcta tiene la forma { success: true, data: ... } y
//    toda respuesta de error { success: false, message, errors, traceId }.
// ═══════════════════════════════════════════════════════════════════

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Cliente sin interceptor de 401: lo usa el propio refresh, que si falla no
// debe volver a intentar refrescarse (sería un bucle infinito).
const apiSinReintento = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

/** Saca el payload de { success, data }. */
export function desempaquetar(respuesta) {
  return respuesta.data?.data ?? respuesta.data
}

function cabeceraCsrf() {
  const token = leerCookie(COOKIE_CSRF)
  return token ? { [CABECERA_CSRF]: token } : {}
}

// ── Petición: Bearer + CSRF ──
api.interceptors.request.use((config) => {
  const token = obtenerToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // /auth/refresh y /auth/logout lo exigen (patrón double-submit cookie).
  // En el resto de rutas es inofensivo: el backend lo ignora.
  Object.assign(config.headers, cabeceraCsrf())

  return config
})

// ── Refresco de sesión ──
// Una sola petición de refresh aunque caduquen a la vez varias llamadas:
// si no, cada una rotaría el refresh token y el backend revocaría la familia
// entera por reutilización.
let refrescoEnCurso = null

export function refrescarSesion() {
  refrescoEnCurso ??= apiSinReintento
    .post('/auth/refresh', null, { headers: cabeceraCsrf() })
    .then((respuesta) => {
      const sesion = desempaquetar(respuesta)
      guardarToken(sesion.accessToken)
      return sesion
    })
    .finally(() => {
      refrescoEnCurso = null
    })

  return refrescoEnCurso
}

// ── Respuesta: 401 → intentar refrescar una vez y reintentar ──
api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const original = error.config
    const estado = error.response?.status
    const ruta = original?.url ?? ''

    // Un 401 del login son credenciales incorrectas, no sesión vencida:
    // ese error lo muestra el formulario. Y un 401 de refresh/logout
    // significa que ya no hay sesión que recuperar.
    const esRutaDeSesion =
      ruta.includes('/auth/login') ||
      ruta.includes('/auth/refresh') ||
      ruta.includes('/auth/logout')

    if (estado !== 401 || esRutaDeSesion || original?._reintentado) {
      return Promise.reject(error)
    }

    original._reintentado = true

    try {
      await refrescarSesion()
      return api(original)
    } catch {
      limpiarToken()
      await irAlLogin()
      return Promise.reject(error)
    }
  }
)

// Import dinámico a propósito: importar el router arriba crearía el ciclo
// router -> stores/auth -> services/api -> router.
async function irAlLogin() {
  const { default: router } = await import('../router')
  const actual = router.currentRoute.value

  if (actual.name !== 'login' && actual.name !== 'inicio') {
    await router.push({ name: 'login', query: { redirect: actual.fullPath } })
  }
}

export default api
