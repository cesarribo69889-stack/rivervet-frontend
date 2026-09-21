<script setup>
import { useAuthStore } from './stores/auth'
import NotificacionesToast from './components/NotificacionesToast.vue'
import LogoRivervet from './components/LogoRivervet.vue'

// El layout (público o de la app) lo decide cada ruta; aquí solo van las
// piezas que viven por encima de todo: los avisos flotantes y la pantalla de
// espera mientras se recupera la sesión al recargar.
const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.inicializando" class="arranque">
    <LogoRivervet :alto="72" />
    <p>Recuperando tu sesión…</p>
  </div>

  <router-view v-else />

  <NotificacionesToast />
</template>

<style scoped lang="scss">
.arranque {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--rv-blanco);

  p {
    color: var(--rv-texto-suave);
    animation: latido 1.4s ease-in-out infinite;
  }
}

@keyframes latido {
  50% {
    opacity: 0.45;
  }
}
</style>
