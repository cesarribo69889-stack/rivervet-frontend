// Formateo para Perú: soles, fechas y horas de Lima.

const moneda = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2
})

const numero = new Intl.NumberFormat('es-PE')

export function soles(valor) {
  return moneda.format(Number(valor ?? 0))
}

export function cantidad(valor) {
  return numero.format(Number(valor ?? 0))
}

/**
 * El backend manda las fechas de las citas ya convertidas a hora de Lima
 * como texto: "2026-09-20T10:30" (campo fechaHoraLima). No se debe pasar por
 * `new Date()` sin cuidado: al no traer zona, el navegador la interpreta como
 * hora local, y en otra zona horaria mostraría otra hora.
 */
export function partirFechaLima(texto) {
  if (!texto) return null
  const [fecha, hora = '00:00'] = texto.split('T')
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const [h, m] = hora.split(':').map(Number)
  return { anio, mes, dia, hora: h, minuto: m }
}

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
]

/** "2026-09-20T10:30" → "20 sep 2026, 10:30" */
export function fechaHoraLima(texto) {
  const p = partirFechaLima(texto)
  if (!p) return '—'
  const hh = String(p.hora).padStart(2, '0')
  const mm = String(p.minuto).padStart(2, '0')
  return `${p.dia} ${MESES[p.mes - 1]} ${p.anio}, ${hh}:${mm}`
}

/** "2026-09-20" → "20 sep 2026" */
export function fechaCorta(texto) {
  const p = partirFechaLima(texto)
  if (!p) return '—'
  return `${p.dia} ${MESES[p.mes - 1]} ${p.anio}`
}

/** Fechas UTC que sí vienen con zona (creadoEn, actualizadoEn). */
export function fechaUtc(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** Hoy en Lima como 'AAAA-MM-DD' (el formato que esperan los filtros). */
export function hoyLima() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
}

/** 'AAAA-MM-DD' desplazado N días (para los rangos de los filtros). */
export function diaLima(dias = 0) {
  const base = new Date()
  base.setDate(base.getDate() + dias)
  return base.toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
}

/** "Ana María Torres" → "AT" */
export function iniciales(nombre) {
  if (!nombre) return '?'
  const partes = nombre.trim().split(/\s+/)
  const primera = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}

export function capitalizar(texto) {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
