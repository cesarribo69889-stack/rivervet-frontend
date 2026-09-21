import api, { desempaquetar } from './api'

// Endpoints de /api/productos y /api/categorias (ProductosController.cs).
// El catálogo y las categorías son públicos; el inventario no.
export default {
  async catalogo(filtros = {}) {
    return desempaquetar(await api.get('/productos', { params: filtros }))
  },

  async obtener(id) {
    return desempaquetar(await api.get(`/productos/${id}`))
  },

  /** GET /api/productos/inventario — admin y recepción. */
  async inventario(filtros = {}) {
    return desempaquetar(await api.get('/productos/inventario', { params: filtros }))
  },

  async crear(datos) {
    return desempaquetar(await api.post('/productos', datos))
  },

  async actualizar(id, datos) {
    return desempaquetar(await api.put(`/productos/${id}`, datos))
  },

  /** POST /api/productos/{id}/stock — entrada/salida de inventario (admin). */
  async ajustarStock(id, datos) {
    return desempaquetar(await api.post(`/productos/${id}/stock`, datos))
  },

  async eliminar(id) {
    await api.delete(`/productos/${id}`)
  },

  async categorias() {
    return desempaquetar(await api.get('/categorias'))
  }
}
