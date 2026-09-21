import { defineStore } from 'pinia'
import { ref } from 'vue'

// Avisos flotantes (toasts). Cualquier vista puede lanzar uno sin tener que
// renderizar nada: el componente NotificacionesToast los pinta por todas.
export const useNotificacionesStore = defineStore('notificaciones', () => {
  const lista = ref([])
  let siguienteId = 1

  function mostrar(mensaje, tono = 'exito', duracion = 4000) {
    const id = siguienteId++
    lista.value.push({ id, mensaje, tono })

    if (duracion > 0) {
      setTimeout(() => cerrar(id), duracion)
    }

    return id
  }

  const exito = (mensaje) => mostrar(mensaje, 'exito')
  const error = (mensaje) => mostrar(mensaje, 'error', 6000)
  const aviso = (mensaje) => mostrar(mensaje, 'aviso', 5000)

  function cerrar(id) {
    lista.value = lista.value.filter((n) => n.id !== id)
  }

  return { lista, mostrar, exito, error, aviso, cerrar }
})
