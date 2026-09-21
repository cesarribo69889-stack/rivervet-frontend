import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import servicioAuth from '../services/auth'
import { alCambiarToken, guardarToken, haySesionPrevia, limpiarToken, obtenerToken } from '../services/sesion'
import { GRUPOS, ROLES } from '../constantes'

// ═══════════════════════════════════════════════════════════════════
//  Estado de la sesión.
//
//  El access token NO se guarda en localStorage (ver services/sesion.js):
//  vive en memoria y dura 15 minutos. Al recargar la página se recupera la
//  sesión con POST /api/auth/refresh, que se autentica con la cookie
//  httpOnly rv_refresh.
// ═══════════════════════════════════════════════════════════════════
export const useAuthStore = defineStore('auth', () => {
  const token = ref(obtenerToken())
  const usuario = ref(null)
  const inicializando = ref(false)

  // Si el interceptor de api.js refresca o limpia el token, el store se entera.
  alCambiarToken((nuevo) => {
    token.value = nuevo
    if (!nuevo) {
      usuario.value = null
    }
  })

  const estaAutenticado = computed(() => Boolean(token.value) && Boolean(usuario.value))
  const rol = computed(() => usuario.value?.rol ?? null)
  const nombre = computed(() => usuario.value?.nombre ?? '')
  const esAdmin = computed(() => rol.value === ROLES.ADMIN)
  const esVeterinario = computed(() => rol.value === ROLES.VETERINARIO)
  const esCliente = computed(() => rol.value === ROLES.CLIENTE)
  const esPersonal = computed(() => GRUPOS.PERSONAL.includes(rol.value))

  /** ¿El rol actual está entre los permitidos? Sin lista, basta con tener sesión. */
  function puede(roles) {
    if (!roles || roles.length === 0) return estaAutenticado.value
    return estaAutenticado.value && roles.includes(rol.value)
  }

  // ── Refresco preventivo ──
  // El token dura `expiraEn` segundos. Lo renovamos un minuto antes para que
  // nadie se quede a medias de un formulario por un 401.
  let temporizador = null

  function programarRefresco(expiraEn) {
    cancelarRefresco()
    const margen = Math.max((expiraEn ?? 900) - 60, 30) * 1000
    temporizador = setTimeout(async () => {
      try {
        const sesion = await servicioAuth.refrescar()
        aplicarSesion(sesion)
      } catch {
        // El refresh venció o fue revocado: el siguiente 401 llevará al login.
        limpiarSesionLocal()
      }
    }, margen)
  }

  function cancelarRefresco() {
    if (temporizador) {
      clearTimeout(temporizador)
      temporizador = null
    }
  }

  function aplicarSesion(sesion) {
    guardarToken(sesion.accessToken)
    usuario.value = sesion.usuario
    programarRefresco(sesion.expiraEn)
  }

  function limpiarSesionLocal() {
    cancelarRefresco()
    limpiarToken()
    usuario.value = null
  }

  // ── Acciones ──

  async function login(credenciales) {
    const sesion = await servicioAuth.login(credenciales)
    aplicarSesion(sesion)
    return sesion
  }

  async function logout() {
    try {
      // Revoca el refresh token en el servidor y borra las cookies.
      await servicioAuth.logout()
    } catch {
      // Aunque falle (sin red, cookie vencida), localmente cerramos igual.
    } finally {
      limpiarSesionLocal()
    }
  }

  /**
   * Se llama una sola vez al arrancar la app (y antes de la primera
   * navegación). Si quedó una cookie de sesión, intenta recuperarla.
   */
  let arranque = null

  function inicializar() {
    arranque ??= (async () => {
      if (!haySesionPrevia()) return null

      inicializando.value = true
      try {
        const sesion = await servicioAuth.refrescar()
        aplicarSesion(sesion)
        return sesion
      } catch {
        limpiarSesionLocal()
        return null
      } finally {
        inicializando.value = false
      }
    })()

    return arranque
  }

  /** Vuelve a leer el perfil (tras cambiar datos o el rol desde otra sesión). */
  async function recargarUsuario() {
    usuario.value = await servicioAuth.yo()
    return usuario.value
  }

  async function cambiarPassword(datos) {
    const resultado = await servicioAuth.cambiarPassword(datos)
    // El backend cierra TODAS las sesiones al cambiar la contraseña.
    limpiarSesionLocal()
    return resultado
  }

  return {
    token,
    usuario,
    inicializando,
    estaAutenticado,
    rol,
    nombre,
    esAdmin,
    esVeterinario,
    esCliente,
    esPersonal,
    puede,
    login,
    logout,
    inicializar,
    recargarUsuario,
    cambiarPassword
  }
})
