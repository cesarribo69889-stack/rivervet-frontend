<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const auth = useAuthStore()

function handleLogout() {
  auth.logout()
  // Salimos del dashboard: si nos quedáramos, el guard no se ejecuta
  // (solo corre al navegar) y seguiríamos viendo una página protegida.
  router.push({ name: 'home' })
}
</script>

<template>
  <nav>
    <router-link to="/">Inicio</router-link>

    <!-- El nav refleja el estado de la sesión: no tiene sentido ofrecer
         "Dashboard" a quien el guard va a rebotar igual. -->
    <router-link v-if="auth.isAuthenticated" to="/dashboard">Dashboard</router-link>
    <router-link v-else to="/login">Login</router-link>

    <button v-if="auth.isAuthenticated" type="button" @click="handleLogout">
      Salir
    </button>
  </nav>

  <router-view />
</template>

<style scoped lang="scss">
nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #ddd;

  button {
    margin-left: auto;
  }
}
</style>
