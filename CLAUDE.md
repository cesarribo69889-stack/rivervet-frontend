# RiverVet — contexto del proyecto

Sistema de un centro veterinario: citas, historial clínico, vacunas, tienda,
pedidos y pagos. Español en código, comentarios, commits y respuestas.

Este archivo es la **única fuente de contexto**: la memoria de Claude no pasa de
una computadora a otra, así que todo lo que haga falta para seguir va aquí.

## Dónde quedamos (2026-10-11)

- Todo el Sprint 2 y las HU 001–018, 020 y 021 están hechas y en producción.
  Solo falta la pasarela real (HU-019), que depende de contratar un proveedor.
- Revisión de producción del 2026-10-11 (solo lectura, 34 comprobaciones con las
  tres cuentas: web, catálogo, panel, agenda, clientes, mascotas, historial,
  vacunas, inventario, pedidos, pagos, Métodos de pago, usuarios, auditoría):
  todo bien. CI del backend: 263/263.
- Trabajo del 2026-10-08 al 11:
  - "Métodos de pago": Yape editable desde el panel (migración 0006).
  - Eliminar productos en Inventario.
  - El cliente usa solo el diseño de la tienda.
  - Google: la web está indexada.
  - El **admin también registra, corrige y elimina atenciones y vacunas**
    (HU-006 y HU-011 dicen "Como administrador").
  - Límite de la API subido a 600 peticiones cada 15 min (antes bloqueaba con
    "Demasiadas solicitudes").
  - Script para **copiar la base** a un `.sql` (`exportar-base.ps1`).
- Repos al día en GitHub: backend `main` = `develop`; frontend `main`.
- Lo que sigue depende del usuario: ver **Pendientes** al final.

## Retomar en otra computadora

1. Clonar con la misma estructura (el repo `rivervet` es la carpeta raíz y el
   frontend va clonado dentro de ella):
   ```
   git clone https://github.com/cesarribo69889-stack/rivervet.git RIVERVET
   cd RIVERVET
   git clone https://github.com/cesarribo69889-stack/rivervet-frontend.git veterinaria-frontend
   cd veterinaria-frontend && npm ci
   ```
   En el repo `rivervet`, `veterinaria-frontend/` aparece como carpeta sin
   seguimiento: es normal, no agregarla. `_respaldo-backend-node/` (la primera
   versión en Node) existe solo en la PC original y no hace falta.
2. Abrir Claude Code en `RIVERVET\veterinaria-frontend` (aquí está este archivo).
3. Herramientas (versiones de la PC original): Git, GitHub CLI `gh` 2.100,
   Node 24 (el CD usa 22), npm 11, .NET SDK 10.0.302 (`backend/global.json`),
   Azure CLI 2.90 y `sqlcmd`. Opcionales: Visual Studio y SQL Server local (solo
   para correr la API o sus pruebas en la PC).
4. Iniciar sesión: `gh auth login` (cuenta `cesarribo69889-stack`), `az login`
   (suscripción *Azure for Students*) y, solo para publicar a mano,
   `npx vercel login` + `npx vercel link` (equipo "Dinamita", proyecto `rivervet`).
5. Secretos: los guarda el usuario en su gestor de contraseñas (nota "RiverVet
   producción": `SUFIJO`, `SQL_ADMIN_USUARIO`, `SQL_ADMIN_PASSWORD`,
   `MIGRADOR_PASSWORD`, `APP_PASSWORD`, `JWT_SECRETO`, `ADMIN_APP_PASSWORD`).
   Pedírselos solo cuando haga falta (migraciones o cambios directos en la BD);
   si se copian a un archivo temporal, borrarlo al terminar (y vaciar la Papelera).
6. Desarrollo local: `backend\configurar-desarrollo.ps1` crea la BD local, los
   usuarios, los user-secrets, migra y carga datos (necesita SQL Server local;
   guía en `backend/docs/INSTALACION.md`). La API queda en `http://localhost:3000`
   y la web con `npm start`.

## Estructura

| Carpeta | Qué es | Repo |
|---|---|---|
| `RIVERVET\` (raíz) con `backend\` y `.github\` | API .NET 10 + Dapper + SQL Server | `cesarribo69889-stack/rivervet` (privado) |
| `RIVERVET\veterinaria-frontend` | Angular 22 (este repo) | `cesarribo69889-stack/rivervet-frontend` (privado) |

En la PC original la carpeta es `C:\Users\ricra\Desktop\RIVERVET`.

El backend ya cubre las 21 HU del tablero. **Antes de tocar una pantalla, lee
el modelo C# de la respuesta** (`backend/src/RiverVet.Aplicacion/**/*Modelos.cs`):
varios bugs vinieron de leer campos que la API no devuelve (`vacunaNombre` en
vez de `tipoVacuna`, `ventasTotal`, `p.stock` en el catálogo público…). Ojo
también con las formas: un pedido viene aplanado (`{id, codigo, estado, total,
items, pagos}`), no como `{pedido: …}`.

## Producción

- Web: https://rivervet.vercel.app (Vercel, equipo "Dinamita", proyecto `rivervet`)
- API: `rivervet-api-5nua9h.azurewebsites.net` (App Service Windows F1, .NET 10)
- BD: Azure SQL `rivervet_db` en `rivervet-sql-5nua9h` (serverless, oferta gratuita)
- Grupo `rg-rivervet`, región **westus**, suscripción *Azure for Students*
- Salud: `GET https://rivervet.vercel.app/api/health` → `estado: ok, baseDatos: ok`

Datos que hay en producción:
- 12 productos de ejemplo en 4 categorías (Alimentos, Snacks y premios,
  Accesorios, Higiene y cuidado), del 2026-10-06. La correa (`ACC-CORREA-120`)
  quedó con stock bajo a propósito para mostrar ese aviso.
- Datos de demostración del Sprint 2: 4 clientes ficticios (`@example.com`,
  teléfonos `9000001xx`, DNI `100001xx`) con 6 mascotas (Toby, Mía, Rocky,
  Nala, Coco, Max), citas, atenciones y vacunas. Borrarlos si la clínica va a
  usar el sistema con clientes reales.
- Las cuentas de prueba (abajo). El pedido de prueba de Yape (RV-000003) se
  borró, pero al 2026-10-11 hay 4 pedidos nuevos (3 del cliente de prueba y 1 de otra cuenta de cliente)
  (RV-000004 a RV-000007, S/ 4.50 cada uno, `pendiente_pago`) de las pruebas del
  usuario: cada uno descontó 1 unidad de stock. Si son pruebas, cancelarlos
  (Mis pedidos → Cancelar, o Pedidos en el panel) devuelve el stock.

**Copias de la base:** Azure guarda respaldos automáticos de 7 días (restaurar a
cualquier momento). Para una copia en archivo, el usuario corre
`backend\herramientas\exportar-base.ps1` (solo lee; pide la clave de
`rivervet_migrador`; firewall abierto a su IP): deja en Descargas un `.sql` con
estructura + datos que se restaura en una base vacía con SSMS o `sqlcmd -I -f 65001`.
Hay LocalDB y SQL Express en la PC original para probar la restauración. La del
2026-10-11 (362 filas) se restauró en LocalDB idéntica a producción.

### Azure: regiones

La suscripción tiene la política "Allowed resource deployment regions": solo
`westus`, `northcentralus`, `chilecentral`, `mexicocentral` y `canadacentral`.
`eastus2` y `brazilsouth` están bloqueadas aunque Azure las recomiende;
`chilecentral` acepta el servidor SQL pero no la base gratuita
(`ProvisioningDisabled`). Solo **westus** ofrece todo (SQL gratis + F1 Windows).

### Google (desde el 2026-10-08)

`public/robots.txt` (indexa solo lo público), `public/sitemap.xml` (`/`, `/tienda`,
`/orientacion`) y en `index.html` la descripción, las etiquetas `og:` para la
vista previa en WhatsApp (`public/rivervet-compartir.jpg`, 600 px, < 300 KB), los
datos `VeterinaryCare` (solo ciudad y horario: la web no muestra dirección ni
teléfono) y un `<noscript>`. No hace falta tocar `vercel.json`: Vercel sirve
primero los archivos reales y solo después aplica el rewrite a `index.html`.
Registrada y verificada en Google Search Console; indexada desde el 2026-10-09.

## Arquitectura que no se debe romper

- La web llama a `/api` en **su mismo origen** y `vercel.json` lo reescribe al
  App Service. Es obligatorio: las cookies `rv_refresh`/`rv_csrf` son
  `SameSite=Strict` (`backend/src/RiverVet.Api/Seguridad/CookiesSesion.cs`) y en
  una llamada cruzada nunca viajarían. Otro hosting del frontend tendría que
  hacer ese mismo proxy.
- `src/environments/`: dev apunta a `http://localhost:3000/api`; prod a `/api`.
- La BD se **pausa tras 60 min** sin uso: la primera petición recibe 500/503
  ("Servicio no disponible") unos 30-60 s. El login lo tolera (reintenta y
  consulta `/health`). No desactivar la pausa: es lo que la mantiene dentro de
  la oferta gratuita.
- Atenciones y vacunas las registran el **veterinario y el admin** (`Roles.Clinico`;
  el admin es el dueño de la clínica y HU-006/HU-011 dicen "Como administrador",
  desde el 2026-10-11). Las corrige o elimina **quien la registró o el admin**
  (otro veterinario: 403); el autor no cambia aunque corrija el admin. Borrado
  lógico, auditado con el contenido anterior y quién lo hizo. Recepción y
  clientes no registran. En la web la marca es `puedeAtender`. Agendar/reprogramar
  citas e inasistencia: admin y recepción. Carrito: solo cliente.
- El **cliente nunca entra al diseño interno** (menú lateral): ninguna HU le pide
  un panel (HU-018 y HU-012 son del administrador). Al entrar va a la Tienda
  (`auth.inicio()`) y todo lo suyo vive en el diseño público, con la cabecera
  Inicio · Tienda · ¿Es urgente? · Mi carrito · Mis pedidos · Mi cuenta · Salir:
  `/carrito`, `/mis-pedidos` y `/mi-cuenta` (hijas de `AreaClienteComponent`,
  que reusan Carrito, Pedidos y Perfil). Todas las rutas del diseño interno
  (`/panel`, `/citas`, `/mascotas`, `/historial`, `/vacunas`, `/pedidos`,
  `/perfil`…) son solo del personal. Desde el 2026-10-08.
- Inventario: el admin edita, ajusta stock y **elimina** productos (desde el
  2026-10-08). Eliminar es borrado lógico (`eliminado = 1, activo = 0`): sale de
  la tienda y del inventario, pero los pedidos anteriores lo conservan. No hay
  botón para recuperarlo; se hace por SQL (`UPDATE dbo.productos SET eliminado = 0,
  eliminado_en = NULL, activo = 1 WHERE id = …`), y ese script lo corre el usuario.
- La API rechaza con **422** cualquier campo de un body que no conozca
  (`UnmappedMemberHandling.Disallow`). Si un cambio agrega un campo al
  contrato, el orden de despliegue es: migración → API → web, nunca al revés.
- Las migraciones (`backend/database/migraciones/NNNN_*.sql`) son inmutables
  (se verifica su hash) y llevan la reversión comentada al final. La última es
  `0006_configuracion_yape.sql` (aplicada en producción el 2026-10-08). Para
  aplicarlas en producción, abrir el firewall a la IP del día y que el
  **usuario** corra uno de estos scripts (piden la clave de `rivervet_migrador`
  al ejecutarse, sin que pase por el chat):
  - `backend\herramientas\migrar-produccion.ps1`: verificar → migrar → esquema
    con el migrador.
  - `backend\herramientas\aplicar-migracion-sqlcmd.ps1 NNNN_x.sql`: aplica una
    con `sqlcmd` y la registra con el mismo hash. En la PC original hay que usar
    este: Smart App Control bloquea `RiverVet.Migrador.dll` cada vez que se recompila.
  Comando: `powershell -ExecutionPolicy Bypass -File <ruta del script> [migración]`.

## Despliegue

- **Frontend**: cada `push` a `main` publica solo (`.github/workflows/frontend-cd.yml`:
  build → Vercel → health check → rollback si falla). En el environment
  `produccion` de GitHub están los secretos `VERCEL_TOKEN`, `VERCEL_ORG_ID` y
  `VERCEL_PROJECT_ID` y la variable `URL_FRONTEND_PRODUCCION`. El token de
  Vercel es `github-cd-rivervet` (vence **2027-10-01**). Un token "solo
  proyecto" NO sirve (falla con "Could not retrieve Project Settings"), y
  `vercel tokens add` no funciona: los tokens se crean en vercel.com/account/tokens.
  La cuenta de Vercel debe tener GitHub conectado (si no, los despliegues
  quedan BLOCKED: "commit author doesn't have permission").
- Manual: `npx vercel --prod` (en PowerShell con ExecutionPolicy restringida: `npx.cmd`).
- **Backend**: su CD no está activo. Se publica a mano desde `main`:
  `dotnet publish src/RiverVet.Api -c Release -o publicacion -p:UseAppHost=false`,
  comprimir y `az webapp deploy --type zip`. Ramas: `develop` (integración) y
  `main` (lo que está en producción); hoy ambas en el mismo commit.
- **Pruebas del backend**: en la PC original NO corren (Windows Smart App Control
  bloquea cargar `RiverVet.Api.dll`; no desactivarlo: no se puede volver a
  encender). En otra PC pueden correr con `dotnet test RiverVet.slnx` si hay SQL
  Server local. La referencia es el CI de GitHub (formato, build, pruebas,
  migraciones, gitleaks, CodeQL; 263/263 en verde). El push NO dispara el CI:
  `gh workflow run backend-ci.yml --repo cesarribo69889-stack/rivervet --ref develop`.
  Antes de subir: `dotnet format RiverVet.slnx --verify-no-changes --severity warn`
  (el CI falla por el orden de los `using`).
- Colección de Postman: `backend/docs/RiverVet.postman_collection.json`; se
  regenera con `node herramientas/generar-coleccion-postman.mjs`. Documentación
  de la API: `backend/docs/API.md`.
- Configuración y secretos del backend: variables del App Service, nunca en el repo.
  Límite general de la API: `Seguridad__GlobalMax = 600` peticiones cada 15 min
  por IP (desde el 2026-10-11; el valor por defecto, 100, bloqueaba con "Demasiadas
  solicitudes" a quien navegaba un rato: el panel solo hace 8 llamadas). El
  login tiene su propia protección aparte (5 intentos por IP+correo y bloqueo de
  la cuenta tras 5 contraseñas malas). `Seguridad__ProxiesConfiables = 2`
  (Vercel + Azure) hace que el límite cuente la IP real del usuario.
  **Yape se edita desde el panel**: "Métodos de pago" (`/metodos-pago`, solo
  admin) cambia número, titular y QR, que se guardan en `dbo.configuracion_yape`
  (el QR también: `GET /api/pagos/yape/qr?v=…`, público y cacheable). Las
  variables del App Service `Pagos__Yape__Celular` y `__Titular` solo rigen si
  esa tabla no tiene número (respaldo). WhatsApp de la clínica:
  `WHATSAPP_CLINICA` en `src/app/core/constants.ts` (solo lo usa el triage).
  Ambos son de la clínica desde el 2026-10-08.

## Convenciones del código

- Componentes standalone con plantilla y estilos en línea, `signal`/`computed`,
  estilo compacto como el resto de `src/app/pages/`. Clases globales `rv-*`.
- `ApiService` ya desempaqueta `.data`; listas paginadas: `r.items` y `r.paginacion`.
- Errores: `mensajeDeError(e)`. Permisos: `auth.puede([...])` igual que la API.
- Fechas de Lima como `'AAAA-MM-DD'` (`hoyLima()`, `fechaHoraLima`).
- Verificar contra la API real y compilar con `npx ng build` antes de cerrar.
- Commits en español; los de Claude terminan con la línea `Co-Authored-By`.

## Lo que Claude no puede hacer (lo bloquea su sistema de permisos)

Darle al usuario el comando o script listo para que lo corra él:
- Escribir secretos en GitHub (`gh secret set`) o hacer públicos los repos.
- Cambiar datos de producción por `sqlcmd` (DELETE/UPDATE).
- Nunca imprimir secretos, ni escribirlos en el repo, en este archivo o en el chat.

## Trucos del entorno (Windows)

- Git Bash convierte `/ruta` en ruta de Windows: `MSYS_NO_PATHCONV=1 npx vercel api /v13/...`.
- `az.cmd` parte mal argumentos con espacios o llaves: usar `--settings @archivo.json`
  y `-o tsv`. `az appservice plan create` crea Linux por defecto: `--is-linux false`.
- PowerShell 5.1 corre sobre .NET Framework (no hay `RandomNumberGenerator.GetInt32`).
- PowerShell 5.1 lee un `.ps1` sin BOM como ANSI: las tildes de un script escrito
  desde Git Bash se rompen ("húmedo" → "hÃºmedo") antes de enviarse. Mantener los
  scripts en ASCII (texto con tildes en JSON aparte) o guardarlos con BOM.
- `sqlcmd` necesita `SET QUOTED_IDENTIFIER ON` (o `-I`) para borrar o modificar
  (hay índices filtrados). La clave va en `SQLCMDPASSWORD`, no en la línea de comandos.
- `citas.fecha_hora` solo admite :00 o :30 exactos (`CK_citas_bloque`); en pruebas
  que mueven una cita al pasado, usar un bloque alineado. Columnas `eliminado` son BIT.
- En el bundle de Angular las tildes van escapadas (`cl\xEDnico`): para buscar
  textos en el bundle publicado, usar la parte ASCII.
- El firewall de Azure SQL solo tiene `PermitirServiciosAzure` (desde 2026-10-07).
  Para conectarse desde una PC, crear una regla temporal con la IP del día (el ISP
  del usuario la cambia; usar la que muestra el error de `sqlcmd`) y borrarla al
  terminar: `az sql server firewall-rule create|delete -g rg-rivervet -s rivervet-sql-5nua9h`.
- No hay Python en la PC original: para editar archivos, usar las herramientas
  de Claude o PowerShell.

## Estado de las HU (tablero Trello)

Revisado contra el tablero y las tareas del Sprint 2 el 2026-10-08.

- ✅ **001–018, 020 y 021 completas** (todo el Sprint 2 = HU-006 a HU-012).
- HU-020: el comprobante lleva solo código, total y fecha **por decisión del
  usuario** (Ley 29733; lo protege `Sprint4Pruebas.cs`). No agregar productos.
- HU-017 Yape: activo y **probado de punta a punta en producción** el 2026-10-06
  (pagar → rechazar → pagar → aprobar → `pagado`). Desde el 2026-10-08 usa el
  Yape de la clínica (titular "Rivelino Mendoza"; la app de Yape lo muestra
  como "Rivelino Men"). Su QR (recortado de la captura que mandó la clínica)
  está en la base desde "Métodos de pago"; si no hay QR, la web lo oculta. El
  "número de operación" es obligatorio: Yape personal no avisa a la web, y
  recepción lo usa para verificar el pago (y la base impide repetirlo).
- HU-008/HU-009 (en "QA / Revisión" de Trello): la disponibilidad se valida en la
  API con índices únicos (un **veterinario** o una **mascota** no puede tener dos
  citas a la misma hora → 409 "El veterinario ya tiene una cita en ese
  horario"; dos veterinarios distintos sí pueden atender a la misma hora).
  Probado en producción el 2026-10-14 (agendar el 15 a las 08:00 dos veces con
  el mismo veterinario: la segunda, 409; la cita de prueba quedó cancelada).
  Desde ese día la web muestra las horas ocupadas **bloqueadas ("· ocupado")** en
  Agendar y Reprogramar, y resalta 4 s la cita agendada, reprogramada o
  cancelada en el calendario (que ya se recargaba solo).
- HU-021 triage: "agendar" deriva a WhatsApp (la API no deja agendar al cliente).
  No hay bot de WhatsApp: ningún texto lo pide.
- ❌ HU-019 pasarela: solo existe la simulada (en producción responde 503, y la
  opción "Tarjeta" sigue visible **por decisión del usuario**); falta que la
  clínica contrate un proveedor (Culqi, Niubiz, Izipay o Mercado Pago). Está
  en el Product Backlog, no en el Sprint 2. Una cuenta bancaria o CCI NO sirve
  para cobrar tarjetas (solo transferencias); el usuario descartó por ahora
  agregar "Transferencia bancaria".

Extras que no pide ninguna HU, hechos a pedido del usuario (2026-10-08 al 11):
"Métodos de pago" (Yape editable desde el panel), eliminar productos en el
Inventario, el cliente sin panel (todo en el diseño de la tienda), lo de Google
y la copia de la base. Que el admin registre atenciones y vacunas no es un
extra: lo piden HU-006 y HU-011 ("Como administrador").

### Sprint 2 (tareas de Cesar y Mariano, 2026-10-06)

Hecho con nuestro stack (.NET + Angular en vez de Node/Express + Vue/FullCalendar):
- API: `/api/citas/mascota/{id}`, `/api/citas/veterinario/{id}`, `?mascotaId=`,
  `POST /api/citas/{id}/no-asistio`; detalle/PUT/DELETE de atenciones y vacunas;
  receta en la atención (migración 0005); `/api/dashboard/stats`, `/citas-hoy`,
  `/citas-semana`. Pruebas en `Sprint2AmpliacionPruebas.cs`. Postman y API.md.
- Web: páginas `/historial` (búsqueda, impresión, receta, vincular atención a una
  cita) y `/vacunas` (alertas "Urgente" < 7 días, sugerencias por especie);
  calendario con vista Mes, clic para agendar, filtro por mascota, "Atender" y
  "No asistió"; panel del personal con tarjetas, citas de hoy y gráfico de la
  semana; migas de pan.
- Estados de cita del sprint vs. los nuestros: pendiente→programada,
  completada→atendida; "confirmada" no existe; se agregó `no_asistio`.
- Diferencias con el plan: el PDF sale desde "Imprimir"; arrastrar citas para
  reagendar (opcional) no se hizo, se usa "Reprogramar"; las vacunas pendientes
  salen de `/api/recordatorios` (HU-012) y el detalle de una atención es
  `/api/historial/{id}`. Lo demás de Cesar y Mariano está hecho (CI: 263/263).
- Guion para la demo del Sprint Review (8 escenas, textos, capturas):
  https://claude.ai/artifact/J8Hhfwh9UP6Y7TwcP5xEgm (privado; compartirlo
  con Mariano desde el menú Compartir). Su HTML no está en el repo: para
  cambiarlo, leerlo con la herramienta Artifact y volver a publicarlo en esa URL.

## Pendientes (dependen del usuario)

No falta programación de ninguna HU salvo la pasarela real (HU-019).

1. **Cambiar la contraseña del admin** (apareció en un chat). La cambia el
   usuario en Mi cuenta (`/perfil`) y actualiza `ADMIN_APP_PASSWORD` en su
   gestor. Claude no la cambia: la nueva pasaría por el chat. Las claves de las
   cuentas de prueba de veterinario y cliente también aparecieron en el chat.
   El 2026-10-08 se le dejó `Descargas\rivervet-usuarios.txt` con las claves de
   la app (a pedido suyo): recordarle pasarlas al gestor y borrarlo (Shift+Supr).
2. **Trello**: marcar como terminadas 001–018, 020 y 021 (019 en curso) y
   cambiar el criterio de HU-020 por: "Cuando el pago está confirmado, recepción
   puede enviar al cliente por WhatsApp un comprobante con el código del pedido,
   el total y la fecha. Por la Ley 29733 de Protección de Datos Personales, el
   comprobante no incluye el detalle de los productos." (No hay acceso a Trello
   desde Claude.)
3. **Sprint Review**: capturas y video, siguiendo el guion.
3b. **Google Search Console**: propiedad "Prefijo de URL" `https://rivervet.vercel.app/`
   (en la cuenta de Google del usuario), verificada con el archivo
   `public/googlec2017652cef6453e.html` (**no borrarlo**: sin él se pierde la
   verificación). El 2026-10-08 se envió `sitemap.xml` (al principio Search
   Console muestra "Couldn't fetch" hasta que Google lo lee; el archivo se
   comprobó como Googlebot y está bien). **El 2026-10-09 la página ya figura
   indexada** ("URL is on Google", "Page is indexed"): no hace falta "Request
   indexing" salvo que la página cambie. Para subir en los resultados: que la
   clínica cree su Perfil de Empresa en Google (Maps) con la dirección real y
   ponga el enlace en sus redes.
4. Revisar la web en el navegador con las tres cuentas: se probó por la API
   (revisión de producción del 2026-10-11, todo bien) y compilando, pero Claude
   no la recorrió en pantalla.
4b. Cancelar los 4 pedidos de prueba sin pagar (RV-000004 a RV-000007) si eran
   pruebas, para que el stock vuelva (Pedidos en el panel → Cancelar).
4c. La copia de la base del 2026-10-11 está en `Descargas\rivervet_db_2026-10-11_2040.sql`:
   tiene datos personales y hashes de contraseñas; guardarla en privado, no en GitHub.
5. Los repos son privados. Si se hacen públicos, el número de WhatsApp queda en
   el historial de git.

## Cuentas de prueba (las claves las tiene el usuario)

- Admin: `cesarribo69889@gmail.com`
- Veterinario: `cesarribo69889+vet@gmail.com`
- Cliente: `cesarribo69889+cliente@gmail.com`
- Cliente registrado aparte: `ricracesar970@gmail.com` (su clave no se conoce).
- Los 4 clientes de demostración (`@example.com`) no tienen cuenta para entrar.
