<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// TODO: ajustar los campos a los que espera tu backend (¿email o usuario?).
const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  loading.value = true
  errorMessage.value = ''

  try {
    await auth.login(form)

    // Si el guard nos mandó aquí, volvemos al destino original.
    // Si no, al dashboard.
    const destino = route.query.redirect ?? '/dashboard'
    router.push(destino)
  } catch (error) {
    errorMessage.value = traducirError(error)
  } finally {
    // En `finally` para que el botón se reactive tanto si sale bien como si falla.
    loading.value = false
  }
}

function traducirError(error) {
  // Sin `error.response` la petición nunca llegó al servidor.
  if (!error.response) {
    return error.code === 'ECONNABORTED'
      ? 'El servidor tardó demasiado en responder.'
      : 'No se pudo conectar con el servidor. ¿Está corriendo el backend?'
  }

  if (error.response.status === 401) {
    return 'Correo o contraseña incorrectos.'
  }

  return error.response.data?.message ?? 'Ocurrió un error inesperado.'
}
</script>

<template>
  <section class="login">
    <h1>Iniciar sesión</h1>

    <!-- .prevent evita que el navegador recargue la página al enviar. -->
    <form @submit.prevent="handleSubmit">
      <label for="email">Correo</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        autocomplete="username"
        required
        :disabled="loading"
      />

      <label for="password">Contraseña</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        required
        :disabled="loading"
      />

      <!-- role="alert" hace que un lector de pantalla anuncie el error. -->
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>

    <router-link to="/">Volver al inicio</router-link>
  </section>
</template>

<style scoped lang="scss">
.login {
  max-width: 20rem;
  margin: 3rem auto;
  text-align: left;

  form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  input {
    padding: 0.5rem;
  }

  button {
    margin-top: 1rem;
  }

  .error {
    color: #c0392b;
    font-size: 0.9rem;
  }
}
</style>
