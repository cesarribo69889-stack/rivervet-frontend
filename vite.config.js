import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // El CORS del backend solo permite este origen en desarrollo
    // (Seguridad:OrigenesCors en appsettings.Development.json).
    // strictPort: si 5173 está ocupado preferimos fallar a arrancar en otro
    // puerto y que todas las peticiones sean rechazadas por CORS.
    port: 5173,
    strictPort: true
  }
})
