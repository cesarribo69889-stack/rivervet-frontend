import api, { desempaquetar } from './api'

// GET /api/health — público y fuera del rate limit. Lo usamos para avisar en
// la pantalla de login si la API o la base de datos no están levantadas.
export default {
  async verificar() {
    return desempaquetar(await api.get('/health'))
  }
}
