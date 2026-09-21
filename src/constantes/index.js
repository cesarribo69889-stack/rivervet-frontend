// Constantes espejo de RiverVet.Dominio/Constantes (Roles.cs, Citas.cs).
// Si cambian allá, hay que cambiarlas aquí.

export const ROLES = {
  ADMIN: 'admin',
  VETERINARIO: 'veterinario',
  RECEPCIONISTA: 'recepcionista',
  CLIENTE: 'cliente'
}

export const GRUPOS = {
  ADMIN_O_RECEPCION: [ROLES.ADMIN, ROLES.RECEPCIONISTA],
  PERSONAL: [ROLES.ADMIN, ROLES.VETERINARIO, ROLES.RECEPCIONISTA],
  TODOS: [ROLES.ADMIN, ROLES.VETERINARIO, ROLES.RECEPCIONISTA, ROLES.CLIENTE]
}

export const NOMBRE_ROL = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.VETERINARIO]: 'Veterinario',
  [ROLES.RECEPCIONISTA]: 'Recepción',
  [ROLES.CLIENTE]: 'Cliente'
}

export const ESTADOS_CITA = {
  PROGRAMADA: 'programada',
  ATENDIDA: 'atendida',
  CANCELADA: 'cancelada',
  NO_ASISTIO: 'no_asistio'
}

export const ETIQUETA_ESTADO_CITA = {
  [ESTADOS_CITA.PROGRAMADA]: { texto: 'Programada', tono: 'info' },
  [ESTADOS_CITA.ATENDIDA]: { texto: 'Atendida', tono: 'exito' },
  [ESTADOS_CITA.CANCELADA]: { texto: 'Cancelada', tono: 'error' },
  [ESTADOS_CITA.NO_ASISTIO]: { texto: 'No asistió', tono: 'aviso' }
}

// Horario de atención (HorarioAtencion.cs): lunes a sábado, 08:00–20:00,
// en bloques de 30 minutos.
export const HORARIO = {
  APERTURA: '08:00',
  CIERRE: '20:00',
  DESCRIPCION: 'Lunes a sábado, de 08:00 a 20:00',
  MINUTOS_BLOQUE: 30
}

// Catálogos con CHECK en la base (Catalogos.cs / 0001_esquema_inicial.sql).
export const ESPECIES = ['perro', 'gato', 'ave', 'conejo', 'roedor', 'reptil', 'otro']
export const SEXOS = ['macho', 'hembra']
