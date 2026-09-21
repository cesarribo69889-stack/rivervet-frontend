// ═══════════════════════════════════════════════════════════════════
//  Traducción de errores de axios a un mensaje para la persona usuaria.
//
//  El backend responde SIEMPRE con la misma forma:
//  { success: false, message: "...", errors: [{ campo, mensaje }], traceId }
// ═══════════════════════════════════════════════════════════════════

export function mensajeDeError(error, porDefecto = 'Ocurrió un error inesperado.') {
  // Sin `response` la petición nunca llegó al servidor.
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') {
      return 'El servidor tardó demasiado en responder.'
    }
    return 'No se pudo conectar con el servidor. ¿Está corriendo la API?'
  }

  const { status, data } = error.response

  // 422: fallos de validación. Mostramos el primero, que es el más útil.
  if (status === 422 && data?.errors?.length) {
    return data.errors[0].mensaje ?? data.message ?? porDefecto
  }

  if (status === 401) {
    return data?.message ?? 'Tu sesión expiró. Vuelve a iniciar sesión.'
  }

  if (status === 403) {
    return data?.message ?? 'No tienes permiso para realizar esta acción.'
  }

  if (status === 429) {
    return data?.message ?? 'Demasiadas solicitudes. Espera unos minutos.'
  }

  if (status >= 500) {
    // El traceId permite encontrar el fallo exacto en los logs del servidor.
    const traza = data?.traceId ? ` (referencia: ${data.traceId})` : ''
    return `El servidor tuvo un problema. Inténtalo de nuevo${traza}.`
  }

  return data?.message ?? porDefecto
}

/** Errores por campo, listos para pintarlos debajo de cada input. */
export function erroresPorCampo(error) {
  const lista = error?.response?.data?.errors ?? []
  const mapa = {}

  for (const item of lista) {
    const campo = item.campo ?? item.field
    if (campo && !mapa[campo]) {
      mapa[campo] = item.mensaje ?? item.message
    }
  }

  return mapa
}
