import { HttpErrorResponse, HttpResponse } from '@angular/common/http';

export function desempaquetar<T = any>(respuesta: any): T {
  const body = respuesta instanceof HttpResponse ? respuesta.body : respuesta;
  return (body?.data ?? body) as T;
}

export function mensajeDeError(error: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (!(error instanceof HttpErrorResponse)) return porDefecto;
  if (error.status === 0) return 'No se pudo conectar con el servidor. ¿Está corriendo la API?';
  const data = error.error;
  if (error.status === 422 && data?.errors?.length) return data.errors[0].mensaje ?? data.message ?? porDefecto;
  if (error.status === 401) return data?.message ?? 'Tu sesión expiró. Vuelve a iniciar sesión.';
  if (error.status === 403) return data?.message ?? 'No tienes permiso para realizar esta acción.';
  if (error.status === 429) return data?.message ?? 'Demasiadas solicitudes. Espera unos minutos.';
  // 503 con mensaje = un servicio apagado a proposito (p. ej. "El pago con
  // Yape no está habilitado"): ese texto sirve al usuario; el generico no.
  if (error.status === 503 && data?.message) return data.message;
  if (error.status >= 500) return `El servidor tuvo un problema.${data?.traceId ? ` Referencia: ${data.traceId}` : ''}`;
  return data?.message ?? porDefecto;
}

export const soles = (valor: unknown) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(valor ?? 0));
export const cantidad = (valor: unknown) => new Intl.NumberFormat('es-PE').format(Number(valor ?? 0));
export const hoyLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
export function diaLima(dias = 0): string { const d = new Date(); d.setDate(d.getDate() + dias); return d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); }
export function fechaHoraLima(texto?: string): string {
  if (!texto) return '—';
  const [f, h = '00:00'] = texto.split('T'); const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}, ${h.slice(0, 5)}`;
}
export const fechaCorta = (texto?: string) => texto ? texto.split('-').reverse().join('/') : '—';
export const fechaUtc = (texto?: string) => texto ? new Date(texto).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : '—';
export function iniciales(nombre?: string): string { const p = (nombre ?? '').trim().split(/\s+/); return ((p[0]?.[0] ?? '') + (p.length > 1 ? p.at(-1)?.[0] ?? '' : '')).toUpperCase() || '?'; }

export function paramsLimpios(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

/** "2 años y 3 meses" a partir de 'AAAA-MM-DD'. Sin fecha: '—'. */
export function edadTexto(fechaNacimiento?: string | null): string {
  if (!fechaNacimiento) return '—';
  const [a, m, d] = fechaNacimiento.split('-').map(Number);
  const hoy = new Date(); let meses = (hoy.getFullYear() - a) * 12 + (hoy.getMonth() + 1 - m) - (hoy.getDate() < d ? 1 : 0);
  if (meses < 0) return '—';
  const anios = Math.floor(meses / 12); meses %= 12;
  const partes = [anios ? `${anios} ${anios === 1 ? 'año' : 'años'}` : '', meses ? `${meses} ${meses === 1 ? 'mes' : 'meses'}` : ''].filter(Boolean);
  return partes.length ? partes.join(' y ') : 'Menos de un mes';
}
