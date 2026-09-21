// ═══════════════════════════════════════════════════════════════════
//  Token de acceso en MEMORIA (no en localStorage).
//
//  Así lo pide el backend (ver AuthController): el access token viaja en el
//  body y dura 15 minutos; el refresh token vive en la cookie httpOnly
//  rv_refresh, que JavaScript no puede leer. Guardar el access token en
//  localStorage sería regalárselo a cualquier XSS; en memoria se pierde al
//  recargar la página, y eso no importa porque la sesión se recupera sola
//  llamando a POST /api/auth/refresh.
//
//  Este módulo existe aparte del store de Pinia para que services/api.js
//  pueda leer el token sin importar el store (evita un ciclo de imports).
// ═══════════════════════════════════════════════════════════════════

let accessToken = null
const oyentes = new Set()

export function obtenerToken() {
  return accessToken
}

export function guardarToken(token) {
  accessToken = token ?? null
  for (const oyente of oyentes) {
    oyente(accessToken)
  }
}

export function limpiarToken() {
  guardarToken(null)
}

/** Avisa cuando el token cambia (lo usa el store para mantenerse en sincronía). */
export function alCambiarToken(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** Lee una cookie por nombre. Solo sirve para rv_csrf: las demás son httpOnly. */
export function leerCookie(nombre) {
  const prefijo = `${nombre}=`
  const cruda = document.cookie
    .split('; ')
    .find((parte) => parte.startsWith(prefijo))

  return cruda ? decodeURIComponent(cruda.slice(prefijo.length)) : null
}

export const COOKIE_CSRF = 'rv_csrf'
export const CABECERA_CSRF = 'X-CSRF-Token'

/** ¿Hay indicios de una sesión anterior que valga la pena intentar refrescar? */
export function haySesionPrevia() {
  return Boolean(leerCookie(COOKIE_CSRF))
}
