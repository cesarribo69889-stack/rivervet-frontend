# RiverVet — contexto del proyecto

Sistema de un centro veterinario: citas, historial clínico, vacunas, tienda,
pedidos y pagos. Español en código, comentarios, commits y respuestas.

## Estructura

| Carpeta | Qué es | Repo |
|---|---|---|
| `C:\Users\ricra\Desktop\RIVERVET\backend` | API .NET 10 + Dapper + SQL Server | `cesarribo69889-stack/rivervet` (privado) |
| `C:\Users\ricra\Desktop\RIVERVET\veterinaria-frontend` | Angular 22 (este repo) | `cesarribo69889-stack/rivervet-frontend` (privado) |

El backend ya cubre las 21 HU del tablero. **Antes de tocar una pantalla, lee
el modelo C# de la respuesta** (`backend/src/RiverVet.Aplicacion/**/*Modelos.cs`):
varios bugs vinieron de leer campos que la API no devuelve (`vacunaNombre` en
vez de `tipoVacuna`, `ventasTotal`, `p.stock` en el catálogo público…).

## Producción

- Web: https://rivervet.vercel.app (Vercel, equipo "Dinamita", proyecto `rivervet`)
- API: `rivervet-api-5nua9h.azurewebsites.net` (App Service Windows F1, .NET 10)
- BD: Azure SQL `rivervet_db` en `rivervet-sql-5nua9h` (serverless, oferta gratuita)
- Grupo `rg-rivervet`, región **westus**, suscripción *Azure for Students*

La tienda tiene 12 productos de ejemplo en 4 categorías (Alimentos, Snacks y
premios, Accesorios, Higiene y cuidado), creados el 2026-10-06. La correa
(`ACC-CORREA-120`) quedó con stock bajo a propósito para mostrar ese aviso.

La suscripción solo permite `westus`, `northcentralus`, `chilecentral`,
`mexicocentral` y `canadacentral`; solo westus ofrece todo (SQL gratis + F1).

## Arquitectura que no se debe romper

- La web llama a `/api` en **su mismo origen** y `vercel.json` lo reescribe al
  App Service. Es obligatorio: las cookies `rv_refresh`/`rv_csrf` son
  `SameSite=Strict` y en una llamada cruzada nunca viajarían.
- `src/environments/`: dev apunta a `http://localhost:3000/api`; prod a `/api`.
- La BD se **pausa tras 60 min** sin uso: la primera petición recibe 500/503
  unos 30-60 s. El login lo tolera (reintenta y consulta `/health`). No
  desactivar la pausa: es lo que la mantiene dentro de la oferta gratuita.
- Solo el rol **veterinario** registra atenciones y vacunas (ni el admin), y
  solo **el que la registró** puede corregirla o eliminarla (borrado lógico,
  auditado con el contenido anterior). Agendar/reprogramar citas e
  inasistencia: admin y recepción. Carrito: solo cliente.
- La API rechaza con **422** cualquier campo de un body que no conozca
  (`UnmappedMemberHandling.Disallow`). Si un cambio agrega un campo al
  contrato, el orden de despliegue es: migración → API → web, nunca al revés.

## Despliegue

- **Frontend**: cada `push` a `main` publica solo (`.github/workflows/frontend-cd.yml`:
  build → Vercel → health check → rollback si falla). Secretos en el environment
  `produccion` de GitHub. El token de Vercel es `github-cd-rivervet`
  (vence 2027-10-01; un token "solo proyecto" NO sirve).
- Manual: `npx vercel --prod` (en PowerShell del usuario: `npx.cmd`, por la
  ExecutionPolicy).
- **Backend**: su CD no está activo. Se publica a mano desde `main`:
  `dotnet publish src/RiverVet.Api -c Release -o publicacion -p:UseAppHost=false`,
  comprimir y `az webapp deploy --type zip`. Ramas: `develop` (integración) y
  `main` (lo que está en producción).
- **Pruebas del backend**: en esta PC NO corren (Windows Smart App Control bloquea
  cargar `RiverVet.Api.dll`; no desactivarlo: no se puede volver a encender). Se
  corren en el CI de GitHub, que tiene su propio SQL Server. El push NO dispara el
  CI: lanzarlo con `gh workflow run backend-ci.yml --repo cesarribo69889-stack/rivervet --ref develop`.
  Antes de subir: `dotnet format RiverVet.slnx --verify-no-changes --severity warn`
  (el CI falla por el orden de los `using`).
- Colección de Postman: `backend/docs/RiverVet.postman_collection.json`; se
  regenera con `node herramientas/generar-coleccion-postman.mjs`.
- Configuración y secretos del backend: variables del App Service, nunca en el repo.

## Convenciones del código

- Componentes standalone con plantilla y estilos en línea, `signal`/`computed`,
  estilo compacto como el resto de `src/app/pages/`. Clases globales `rv-*`.
- `ApiService` ya desempaqueta `.data`; listas paginadas: `r.items` y `r.paginacion`.
- Errores: `mensajeDeError(e)`. Permisos: `auth.puede([...])` igual que la API.
- Fechas de Lima como `'AAAA-MM-DD'` (`hoyLima()`, `fechaHoraLima`).
- Verificar contra la API real y compilar con `npx ng build` antes de cerrar.

## Trucos del entorno (Windows)

- Git Bash convierte `/ruta` en ruta de Windows: `MSYS_NO_PATHCONV=1 npx vercel api /v13/...`.
- `az.cmd` parte mal argumentos con espacios o llaves: usar `--settings @archivo.json`
  y `-o tsv`. `az appservice plan create` crea Linux por defecto: `--is-linux false`.
- PowerShell 5.1 corre sobre .NET Framework (no hay `RandomNumberGenerator.GetInt32`).
- PowerShell 5.1 lee un `.ps1` sin BOM como ANSI: las tildes de un script escrito
  desde Git Bash se rompen ("húmedo" → "hÃºmedo") antes de enviarse. Mantener los
  scripts en ASCII (texto con tildes en JSON aparte) o guardarlos con BOM.
- `sqlcmd` necesita `SET QUOTED_IDENTIFIER ON` para borrar o modificar (hay índices filtrados).
- `citas.fecha_hora` solo admite :00 o :30 exactos (`CK_citas_bloque`); en pruebas
  que mueven una cita al pasado, usar un bloque alineado. Columnas `eliminado` son BIT.
- En el bundle de Angular las tildes van escapadas (`cl\xEDnico`): para buscar
  textos en el bundle publicado, usar la parte ASCII.
- El ISP del usuario alterna IPs: la regla `PcDesarrollo` del firewall de Azure SQL
  se desactualiza; usar la IP que muestra el error de `sqlcmd`.

## Estado de las HU (tablero Trello)

- ✅ 001–016, 018 y 020 completas.
- HU-020: el comprobante lleva solo código, total y fecha **por decisión del
  usuario** (Ley 29733; lo protege `Sprint4Pruebas.cs`). No agregar productos.
- HU-017 Yape: activo. Falta el QR (`public/yape-qr.png`, la web lo oculta si
  no existe) y probar de punta a punta: pagar → rechazar → pagar → aprobar.
- HU-021 triage: "agendar" deriva a WhatsApp (la API no deja agendar al cliente).
- HU-019 pasarela: solo existe la simulada; falta contratar un proveedor real.

### Sprint 2 (tareas de Cesar y Mariano, 2026-10-06)

Hecho con nuestro stack (.NET + Angular en vez de Node/Express + Vue/FullCalendar):
- API: `/api/citas/mascota/{id}`, `/api/citas/veterinario/{id}`, `?mascotaId=`,
  `POST /api/citas/{id}/no-asistio`; detalle/PUT/DELETE de atenciones y vacunas;
  `/api/dashboard/stats`, `/citas-hoy`, `/citas-semana`. Pruebas en
  `Sprint2AmpliacionPruebas.cs` (CI: 259/259). Colección de Postman y API.md.
- Web: páginas `/historial` (búsqueda, impresión, vincular atención a una cita)
  y `/vacunas` (alertas "Urgente" < 7 días, sugerencias por especie); calendario
  con vista Mes, clic para agendar, filtro por mascota, "Atender" y "No asistió";
  panel del personal con tarjetas, citas de hoy y gráfico de la semana; migas de pan.
- Datos de demostración en producción: 4 clientes ficticios (`@example.com`,
  teléfonos `9000001xx`, DNI `100001xx`), 6 mascotas, citas, atenciones y vacunas.
- Estados de cita del sprint vs. los nuestros: pendiente→programada,
  completada→atendida; "confirmada" no existe; se agregó `no_asistio`.

## Pendientes

0. **Receta (Sprint 2)**: lista en `develop` (backend, migración 0005) y en la rama
   `receta` del frontend. Para publicar: aplicar la migración en Azure con el
   usuario `rivervet_migrador` (clave en los secretos del usuario: pedírsela),
   publicar la API desde `develop` (y mezclarla en `main`), y recién después
   mezclar la rama `receta` en `main` del frontend.

1. Probar Yape de punta a punta y borrar el pedido de prueba (requiere la clave
   del admin de SQL; el usuario guarda los secretos fuera del repo: pedírsela).
2. Yape y WhatsApp son **provisionales** (los del administrador): cambiarlos
   cuando el usuario dé los de la clínica. Yape: `Pagos__Yape__Celular` y
   `__Titular` en el App Service. WhatsApp: `WHATSAPP_CLINICA` en
   `src/app/core/constants.ts`.
3. Recordar al usuario cambiar la contraseña del admin (apareció en el chat).

## Cuentas de prueba (las claves las tiene el usuario)

- Admin: `cesarribo69889@gmail.com`
- Veterinario: `cesarribo69889+vet@gmail.com`
- Cliente: `cesarribo69889+cliente@gmail.com`
