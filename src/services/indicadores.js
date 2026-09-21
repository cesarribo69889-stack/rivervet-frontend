import api, { desempaquetar } from './api'

// GET /api/indicadores — panel del negocio (HU-018). Solo admin.
// Sin fechas, el backend usa del día 1 del mes hasta hoy (hora de Lima).
export default {
  async obtener(periodo = {}) {
    return desempaquetar(await api.get('/indicadores', { params: periodo }))
  }
}
