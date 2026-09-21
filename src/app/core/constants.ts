import { environment } from '../../environments/environment';

// Desarrollo: http://localhost:3000/api. Produccion: '/api', que Vercel
// reescribe hacia el App Service de Azure (ver src/environments/ y vercel.json).
export const API_URL = environment.apiUrl;

export const ROLES = {
  ADMIN: 'admin', VETERINARIO: 'veterinario', RECEPCIONISTA: 'recepcionista', CLIENTE: 'cliente'
} as const;

export const GRUPOS = {
  ADMIN_O_RECEPCION: [ROLES.ADMIN, ROLES.RECEPCIONISTA],
  PERSONAL: [ROLES.ADMIN, ROLES.VETERINARIO, ROLES.RECEPCIONISTA],
  TODOS: [ROLES.ADMIN, ROLES.VETERINARIO, ROLES.RECEPCIONISTA, ROLES.CLIENTE]
};

export const NOMBRE_ROL: Record<string, string> = {
  admin: 'Administrador', veterinario: 'Veterinario', recepcionista: 'Recepción', cliente: 'Cliente'
};

export const ESPECIES = ['perro', 'gato', 'ave', 'conejo', 'roedor', 'reptil', 'otro'];
export const SEXOS = ['macho', 'hembra'];
export const HORARIO = 'Lunes a sábado, de 08:00 a 20:00';
