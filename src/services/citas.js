import api, { desempaquetar } from './api'

// Endpoints de /api/citas y /api/veterinarios (CitasController.cs).
// Las fechas se envían como texto en hora de Lima: 'AAAA-MM-DDTHH:mm'.
export default {
  /** GET /api/citas?desde=&hasta=&veterinarioId=&estado= (rango máx. 93 días). */
  async listar(filtros = {}) {
    return desempaquetar(await api.get('/citas', { params: filtros }))
  },

  /** GET /api/citas/disponibilidad?veterinarioId=&fecha= → bloques de 30 min. */
  async disponibilidad(veterinarioId, fecha) {
    return desempaquetar(
      await api.get('/citas/disponibilidad', { params: { veterinarioId, fecha } })
    )
  },

  async obtener(id) {
    return desempaquetar(await api.get(`/citas/${id}`))
  },

  /** POST /api/citas — admin y recepción. */
  async agendar(datos) {
    return desempaquetar(await api.post('/citas', datos))
  },

  /** PUT /api/citas/{id} — reprogramar (la mascota no cambia). */
  async reprogramar(id, datos) {
    return desempaquetar(await api.put(`/citas/${id}`, datos))
  },

  /** POST /api/citas/{id}/cancelar — admin, recepción y el cliente dueño. */
  async cancelar(id, motivo) {
    return desempaquetar(await api.post(`/citas/${id}/cancelar`, { motivo }))
  },

  /** GET /api/veterinarios — veterinarios activos, para agendar. */
  async veterinarios() {
    return desempaquetar(await api.get('/veterinarios'))
  }
}
