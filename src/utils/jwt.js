// Utilidades para leer un JWT en el cliente.
//
// IMPORTANTE: esto solo *decodifica*, no *verifica*. La firma del token solo
// la puede comprobar el backend, que tiene la clave secreta. Cualquiera puede
// fabricar un JWT con el `exp` que quiera y pegarlo en localStorage.
// Estas funciones sirven para mejorar la experiencia de usuario (no mandar
// peticiones que sabemos que van a fallar), nunca como control de seguridad.

// Margen de seguridad: damos por vencido un token que expira en menos de
// 10 segundos, para no enviar uno que caduque durante el viaje al servidor.
const MARGEN_SEGUNDOS = 10

// Devuelve el payload del token como objeto, o null si no se puede leer.
export function decodeJwt(token) {
  try {
    // Un JWT son tres partes separadas por puntos: header.payload.signature
    const payload = token.split('.')[1]
    if (!payload) return null

    // El payload viene en base64url, que cambia dos caracteres respecto a
    // base64 estándar para poder viajar en una URL.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')

    // atob() devuelve bytes; este rodeo los reinterpreta como UTF-8 para que
    // no se rompan las tildes ni la ñ en, por ejemplo, el nombre del usuario.
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )

    return JSON.parse(json)
  } catch {
    // Token malformado, base64 inválido o JSON roto.
    return null
  }
}

export function isTokenExpired(token) {
  if (!token) return true

  const payload = decodeJwt(token)

  // No se pudo decodificar: no es un JWT. Lo tratamos como inválido.
  if (!payload) return true

  // Sin campo `exp` no podemos demostrar que haya vencido, así que lo
  // aceptamos. Si tu backend siempre emite `exp`, puedes cambiar esto a
  // `return true` para ser más estricto.
  if (typeof payload.exp !== 'number') return false

  // `exp` está en SEGUNDOS desde 1970; Date.now() devuelve MILISEGUNDOS.
  // Olvidar esa conversión es el error clásico aquí: daría por vencidos
  // todos los tokens.
  const ahoraEnSegundos = Date.now() / 1000

  return payload.exp <= ahoraEnSegundos + MARGEN_SEGUNDOS
}
