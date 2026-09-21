import api, { desempaquetar, refrescarSesion } from './api'

// Endpoints de /api/auth (AuthController.cs).
export default {
  /** POST /api/auth/login → { accessToken, expiraEn, usuario } */
  async login(credenciales) {
    const respuesta = await api.post('/auth/login', credenciales)
    return desempaquetar(respuesta)
  },

  /** POST /api/auth/refresh (usa la cookie rv_refresh + cabecera CSRF). */
  refrescar: refrescarSesion,

  /** POST /api/auth/logout — revoca el refresh token y borra las cookies. */
  async logout() {
    await api.post('/auth/logout')
  },

  /** GET /api/auth/yo → { id, nombre, email, rol, clienteId } */
  async yo() {
    return desempaquetar(await api.get('/auth/yo'))
  },

  /** PUT /api/auth/password — al cambiarla se cierran TODAS las sesiones. */
  async cambiarPassword(datos) {
    return desempaquetar(await api.put('/auth/password', datos))
  }
}
