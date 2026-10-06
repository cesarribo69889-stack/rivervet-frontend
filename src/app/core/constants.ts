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

// Grupo de la API "VentasYCliente": gestionan ventas admin y recepcion; el
// cliente opera solo lo suyo.
export const VENTAS_Y_CLIENTE = [ROLES.ADMIN, ROLES.RECEPCIONISTA, ROLES.CLIENTE];

export const ESTADO_PEDIDO: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago', pendiente_verificacion: 'Pago en verificación',
  pagado: 'Pagado', entregado: 'Entregado', cancelado: 'Cancelado'
};
export const ESTADO_PAGO: Record<string, string> = {
  pendiente: 'Pendiente', pendiente_verificacion: 'Por verificar', aprobado: 'Aprobado', rechazado: 'Rechazado'
};
export const METODO_PAGO: Record<string, string> = { yape: 'Yape', pasarela: 'Tarjeta', efectivo: 'Efectivo' };

// WhatsApp de la clinica (9 digitos, sin +51) para que el triage ofrezca pedir
// una cita: la API no deja agendar al cliente. Vacio = se muestra el horario
// y se invita a acercarse a recepcion.
export const WHATSAPP_CLINICA = '923083898';

// Sugerencias para el campo "vacuna" (datalist): el veterinario puede escribir
// cualquier otra. Por especie, para no ofrecerle a un gato vacunas de perro.
export const VACUNAS_COMUNES: Record<string, string[]> = {
  perro: ['Antirrábica', 'Séxtuple (polivalente)', 'Óctuple (polivalente)', 'Parvovirus', 'Moquillo', 'Leptospirosis', 'Bordetella (tos de las perreras)', 'Coronavirus canino'],
  gato: ['Antirrábica', 'Triple felina', 'Leucemia felina', 'Rinotraqueítis', 'Calicivirus', 'Panleucopenia'],
  conejo: ['Mixomatosis', 'Enfermedad hemorrágica vírica (VHD)'],
  otro: ['Antirrábica'],
};
