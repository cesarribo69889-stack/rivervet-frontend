<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificacionesStore } from '../stores/notificaciones'
import { erroresPorCampo, mensajeDeError } from '../utils/errores'
import servicioSalud from '../services/salud'
import LogoRivervet from '../components/LogoRivervet.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notificaciones = useNotificacionesStore()

// Los nombres son los del DTO del backend (LoginSolicitud: email, password).
const formulario = reactive({ email: '', password: '' })

const enviando = ref(false)
const error = ref('')
const erroresCampo = ref({})
const apiCaida = ref(false)

// Aviso temprano: si la API o la base no están arriba, mejor decirlo antes de
// que la persona escriba su contraseña y reciba un error confuso.
onMounted(async () => {
  try {
    await servicioSalud.verificar()
  } catch {
    apiCaida.value = true
  }
})

async function enviar() {
  enviando.value = true
  error.value = ''
  erroresCampo.value = {}

  try {
    const sesion = await auth.login({ ...formulario })
    notificaciones.exito(`¡Hola, ${sesion.usuario.nombre}!`)

    // Si el guard nos trajo aquí, volvemos al destino original.
    await router.push(route.query.redirect ?? { name: 'panel' })
  } catch (excepcion) {
    error.value = mensajeDeError(excepcion, 'No se pudo iniciar sesión.')
    erroresCampo.value = erroresPorCampo(excepcion)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="login">
    <!-- Panel de marca -->
    <aside class="login__marca">
      <router-link to="/" class="login__volver">← Volver al inicio</router-link>

      <div class="login__marca-centro">
        <div class="login__circulo">
          <LogoRivervet variante="marca" :alto="150" />
        </div>
        <h2>Rivervet</h2>
        <p>Centro Veterinario</p>
        <p class="login__lema">
          Historial clínico, citas y tienda para tu mascota, en un solo lugar.
        </p>
      </div>
    </aside>

    <!-- Formulario -->
    <main class="login__panel">
      <div class="login__caja">
        <div class="login__logo-movil">
          <LogoRivervet :alto="52" />
        </div>

        <h1>Iniciar sesión</h1>
        <p class="login__subtitulo">Entra con la cuenta que te dio la clínica.</p>

        <div v-if="apiCaida" class="rv-aviso rv-aviso--aviso" role="status">
          No hay respuesta de la API. Levanta el backend (<code>dotnet run</code>
          en <code>backend/src/RiverVet.Api</code>) antes de entrar.
        </div>

        <form novalidate @submit.prevent="enviar">
          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="email">Correo electrónico</label>
            <input
              id="email"
              v-model.trim="formulario.email"
              class="rv-input"
              type="email"
              autocomplete="username"
              placeholder="nombre@rivervet.pe"
              required
              :disabled="enviando"
              :aria-invalid="Boolean(erroresCampo.email)"
            />
            <span v-if="erroresCampo.email" class="rv-campo__error">{{ erroresCampo.email }}</span>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="password">Contraseña</label>
            <input
              id="password"
              v-model="formulario.password"
              class="rv-input"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              required
              :disabled="enviando"
              :aria-invalid="Boolean(erroresCampo.password)"
            />
            <span v-if="erroresCampo.password" class="rv-campo__error">
              {{ erroresCampo.password }}
            </span>
          </div>

          <p v-if="error" class="rv-aviso rv-aviso--error" role="alert">{{ error }}</p>

          <button
            type="submit"
            class="rv-boton rv-boton--primario rv-boton--bloque rv-boton--lg"
            :disabled="enviando"
          >
            {{ enviando ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>

        <p class="login__nota">
          Tras 5 intentos fallidos la cuenta se bloquea 15 minutos por seguridad.
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.login {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;

  &__marca {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 2rem;
    color: #cfdaf2;
    background: linear-gradient(150deg, var(--rv-navy) 0%, var(--rv-navy-900) 100%);
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      left: -120px;
      bottom: -160px;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(35, 195, 165, 0.32) 0%, transparent 70%);
    }
  }

  &__volver {
    position: relative;
    z-index: 1;
    color: var(--rv-teal-300);
    font-size: 0.9rem;
    font-weight: 500;

    &:hover {
      color: var(--rv-blanco);
    }
  }

  &__marca-centro {
    position: relative;
    z-index: 1;
    margin: auto;
    text-align: center;

    h2 {
      margin: 1.5rem 0 0;
      color: var(--rv-blanco);
      font-size: 2.1rem;
    }

    > p {
      margin: 0.2rem 0 0;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--rv-teal);
    }
  }

  &__lema {
    max-width: 34ch;
    margin: 1.5rem auto 0 !important;
    font-size: 0.98rem;
    line-height: 1.6;
    text-transform: none !important;
    letter-spacing: normal !important;
    color: #b9c6e2 !important;
    font-weight: 400 !important;
  }

  &__circulo {
    display: grid;
    place-items: center;
    width: 220px;
    height: 220px;
    margin: 0 auto;
    border-radius: 50%;
    background: var(--rv-blanco);
    box-shadow: 0 24px 60px rgba(4, 12, 35, 0.5);
  }

  &__panel {
    display: grid;
    place-items: center;
    padding: 2rem 1.5rem;
    background: var(--rv-blanco);
  }

  &__caja {
    width: 100%;
    max-width: 380px;
  }

  &__logo-movil {
    display: none;
    margin-bottom: 1.5rem;
  }

  &__subtitulo {
    color: var(--rv-texto-suave);
    margin-bottom: 1.75rem;
  }

  &__nota {
    margin-top: 1.5rem;
    font-size: 0.82rem;
    color: var(--rv-texto-tenue);
    text-align: center;
  }

  .rv-aviso {
    margin-bottom: 1rem;

    code {
      font-family: ui-monospace, Consolas, monospace;
      font-size: 0.85em;
      background: rgba(0, 0, 0, 0.06);
      padding: 1px 4px;
      border-radius: 4px;
    }
  }

  h1 {
    margin-bottom: 0.35rem;
  }
}

@media (max-width: 880px) {
  .login {
    grid-template-columns: 1fr;
  }

  .login__marca {
    display: none;
  }

  .login__logo-movil {
    display: block;
  }
}
</style>
