# Rivervet — Frontend Angular

Aplicación del Centro Veterinario Rivervet migrada a **Angular 22** y conectada
con la API .NET ubicada en `../backend`.

## Ejecutar desde la terminal de VS Code

Este workspace configura la terminal integrada como **Command Prompt** para que
Windows no bloquee los comandos `npm` y `npx` mediante `npm.ps1`.

Después de abrir una terminal nueva:

```cmd
npm install
npx ng s -o
```

La aplicación abre en `http://localhost:5173`.

En otra terminal, inicia el backend:

```cmd
cd ..\backend
dotnet run --project src\RiverVet.Api
```

La API queda en `http://localhost:3000` y el frontend consume
`http://localhost:3000/api`.

## Comandos

```cmd
npm start       REM ng serve --open
npm run dev     REM ng serve
npm run build   REM compilación de producción
```

## Estructura Angular

- `src/app/core`: API, autenticación, interceptor, guards, sesión y roles.
- `src/app/layouts`: layouts público y privado.
- `src/app/pages`: páginas de la aplicación.
- `src/app/shared`: logo y notificaciones.
- `src/app/app.routes.ts`: rutas públicas, privadas y control por roles.

Los componentes `.vue` anteriores se conservan temporalmente como respaldo,
pero no forman parte de la compilación Angular.
