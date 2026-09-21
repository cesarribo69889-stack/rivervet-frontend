import api, { desempaquetar } from './api'

// Endpoints de /api/clientes (ClientesController.cs).
export default {
  /** GET /api/clientes?pagina=&limite= → { items, paginacion }. Personal. */
  async listar(paginacion = {}) {
    return desempaquetar(await api.get('/clientes', { params: paginacion }))
  },

  /**
   * POST /api/clientes/buscar — la búsqueda va en el body, no en la URL:
   * el texto puede ser un DNI y las URLs quedan en logs e historial.
   */
  async buscar(busqueda) {
    return desempaquetar(await api.post('/clientes/buscar', busqueda))
  },

  /** GET /api/clientes/yo — datos del cliente que inició sesión. */
  async yo() {
    return desempaquetar(await api.get('/clientes/yo'))
  },

  async obtener(id) {
    return desempaquetar(await api.get(`/clientes/${id}`))
  },

  async crear(datos) {
    return desempaquetar(await api.post('/clientes', datos))
  },

  async actualizar(id, datos) {
    return desempaquetar(await api.put(`/clientes/${id}`, datos))
  },

  /** DELETE /api/clientes/{id} — solo admin. */
  async eliminar(id) {
    await api.delete(`/clientes/${id}`)
  },

  async mascotas(id, paginacion = {}) {
    return desempaquetar(await api.get(`/clientes/${id}/mascotas`, { params: paginacion }))
  },

  /** GET /api/clientes/yo/exportar — datos personales del propio cliente. */
  async exportarMisDatos() {
    return desempaquetar(await api.get('/clientes/yo/exportar'))
  }
}
