<script setup>
import { useAuthStore } from '../stores/auth'
import { NOMBRE_ROL } from '../constantes'
import LogoRivervet from '../components/LogoRivervet.vue'

// Esta pantalla aparece cuando el rol de la sesión no cubre la ruta pedida.
// El control real lo hace el backend con [Authorize]; esto solo evita el 403.
const auth = useAuthStore()
</script>

<template>
  <div class="aviso-pagina">
    <LogoRivervet :alto="64" />
    <h1>403 · Sin permiso</h1>
    <p>
      Tu cuenta
      <strong v-if="auth.rol"> ({{ NOMBRE_ROL[auth.rol] }})</strong>
      no tiene acceso a esta sección.
    </p>
    <router-link :to="{ name: 'panel' }" class="rv-boton rv-boton--primario">
      Volver al panel
    </router-link>
  </div>
</template>

<style scoped lang="scss">
.aviso-pagina {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  padding: 2rem;

  h1 {
    margin: 1rem 0 0;
  }

  p {
    color: var(--rv-texto-suave);
    max-width: 44ch;
  }

  .rv-boton {
    margin-top: 0.75rem;
  }
}
</style>
