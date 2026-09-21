// Producción: la API se sirve en el MISMO origen que la web.
// Vercel reescribe /api/* hacia el App Service de Azure (ver vercel.json), así
// el navegador nunca ve una petición cruzada: no hay preflight CORS y las
// cookies rv_refresh / rv_csrf viajan como propias del sitio (first-party).
export const environment = {
  produccion: true,
  apiUrl: '/api'
};
