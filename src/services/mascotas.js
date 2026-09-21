import api, { desempaquetar } from './api'

// Endpoints de /api/mascotas (MascotasController.cs y AtencionController.cs).
export default {
  async listar(paginacion = {}) {
    return desempaquetar(await api.get('/mascotas', { params: paginacion }))
  },

  async buscar(busqueda) {
    return desempaquetar(await api.post('/mascotas/buscar', busqueda))
  },

  async obtener(id) {
    return desempaquetar(await api.get(`/mascotas/${id}`))
  },

  async crear(datos) {
    return desempaquetar(await api.post('/mascotas', datos))
  },

  async actualizar(id, datos) {
    return desempaquetar(await api.put(`/mascotas/${id}`, datos))
  },

  async eliminar(id) {
    await api.delete(`/mascotas/${id}`)
  },

  /** GET /api/mascotas/{id}/historial — historial clínico. */
  async historial(id, paginacion = {}) {
    return desempaquetar(await api.get(`/mascotas/${id}/historial`, { params: paginacion }))
  },

  /** POST /api/mascotas/{id}/historial — solo veterinario. */
  async registrarAtencion(id, datos) {
    return desempaquetar(await api.post(`/mascotas/${id}/historial`, datos))
  },

  async vacunas(id) {
    return desempaquetar(await api.get(`/mascotas/${id}/vacunas`))
  },

  /** POST /api/mascotas/{id}/vacunas — solo veterinario. */
  async registrarVacuna(id, datos) {
    return desempaquetar(await api.post(`/mascotas/${id}/vacunas`, datos))
  }
}
