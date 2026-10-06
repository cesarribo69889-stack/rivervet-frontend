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
- Solo el rol **veterinario** registra atenciones y vacunas (ni el admin).
  Agendar/reprogramar citas: admin y recepción. Carrito: solo cliente.

## Despliegue

- **Frontend**: cada `push` a `main` publica solo (`.github/workflows/frontend-cd.yml`:
  build → Vercel → health check → rollback si falla). Secretos en el environment
  `produccion` de GitHub. El token de Vercel es `github-cd-rivervet`
  (vence 2027-10-01; un token "solo proyecto" NO sirve).
- Manual: `npx vercel --prod` (en PowerShell del usuario: `npx.cmd`, por la
  ExecutionPolicy).
- **Backend**: su CD no está activo. Se publica a mano:
  `dotnet publish src/RiverVet.Api -c Release -o publicacion -p:UseAppHost=false`,
  comprimir y `az webapp deploy --type zip`.
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

## Pendientes

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
