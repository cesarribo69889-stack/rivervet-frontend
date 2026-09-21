<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificacionesStore } from '../stores/notificaciones'
import { erroresPorCampo, mensajeDeError } from '../utils/errores'
import { NOMBRE_ROL } from '../constantes'
import { iniciales } from '../utils/formato'

const router = useRouter()
const auth = useAuthStore()
const notificaciones = useNotificacionesStore()

const formulario = reactive({ passwordActual: '', passwordNueva: '', repetir: '' })
const guardando = ref(false)
const error = ref('')
const erroresCampo = ref({})

async function cambiar() {
  if (formulario.passwordNueva !== formulario.repetir) {
    error.value = 'La nueva contraseña y su repetición no coinciden.'
    return
  }

  guardando.value = true
  error.value = ''
  erroresCampo.value = {}

  try {
    await auth.cambiarPassword({
      passwordActual: formulario.passwordActual,
      passwordNueva: formulario.passwordNueva
    })
    // El backend cierra TODAS las sesiones: hay que volver a entrar.
    notificaciones.exito('Contraseña actualizada. Vuelve a iniciar sesión.')
    await router.push({ name: 'login' })
  } catch (excepcion) {
    error.value = mensajeDeError(excepcion, 'No se pudo cambiar la contraseña.')
    erroresCampo.value = erroresPorCampo(excepcion)
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div>
    <header class="rv-pagina-cabecera">
      <div>
        <h1>Mi cuenta</h1>
        <p>Tus datos de acceso al sistema.</p>
      </div>
    </header>

    <div class="rv-rejilla rv-rejilla--2">
      <article class="rv-tarjeta">
        <div class="rv-tarjeta__cuerpo perfil">
          <span class="perfil__avatar">{{ iniciales(auth.nombre) }}</span>
          <h2>{{ auth.nombre }}</h2>
          <p class="perfil__rol">{{ NOMBRE_ROL[auth.rol] }}</p>

          <dl class="perfil__datos">
            <div><dt>Correo</dt><dd>{{ auth.usuario?.email }}</dd></div>
            <div><dt>Usuario n.º</dt><dd>{{ auth.usuario?.id }}</dd></div>
            <div v-if="auth.usuario?.clienteId">
              <dt>Ficha de cliente</dt>
              <dd>#{{ auth.usuario.clienteId }}</dd>
            </div>
          </dl>
        </div>
      </article>

      <article class="rv-tarjeta">
        <header class="rv-tarjeta__cabecera"><h2>Cambiar contraseña</h2></header>
        <div class="rv-tarjeta__cuerpo">
          <form novalidate @submit.prevent="cambiar">
            <div class="rv-campo">
              <label class="rv-campo__etiqueta" for="actual">Contraseña actual</label>
              <input
                id="actual"
                v-model="formulario.passwordActual"
                class="rv-input"
                type="password"
                autocomplete="current-password"
                required
              />
              <span v-if="erroresCampo.passwordActual" class="rv-campo__error">
                {{ erroresCampo.passwordActual }}
              </span>
            </div>

            <div class="rv-campo">
              <label class="rv-campo__etiqueta" for="nueva">Nueva contraseña</label>
              <input
                id="nueva"
                v-model="formulario.passwordNueva"
                class="rv-input"
                type="password"
                autocomplete="new-password"
                required
              />
              <span class="rv-campo__ayuda">
                Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.
              </span>
              <span v-if="erroresCampo.passwordNueva" class="rv-campo__error">
                {{ erroresCampo.passwordNueva }}
              </span>
            </div>

            <div class="rv-campo">
              <label class="rv-campo__etiqueta" for="repetir">Repite la nueva</label>
              <input
                id="repetir"
                v-model="formulario.repetir"
                class="rv-input"
                type="password"
                autocomplete="new-password"
                required
              />
            </div>

            <p class="rv-aviso rv-aviso--aviso">
              <span>Al cambiarla se cerrarán todas tus sesiones abiertas.</span>
            </p>

            <p v-if="error" class="rv-aviso rv-aviso--error" role="alert">{{ error }}</p>

            <button type="submit" class="rv-boton rv-boton--primario" :disabled="guardando">
              {{ guardando ? 'Guardando…' : 'Cambiar contraseña' }}
            </button>
          </form>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped lang="scss">
.perfil {
  text-align: center;

  &__avatar {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    margin: 0 auto 1rem;
    border-radius: 50%;
    background: var(--rv-teal);
    color: #04372e;
    font-family: var(--rv-fuente-titulo);
    font-size: 1.6rem;
    font-weight: 700;
  }

  h2 {
    margin-bottom: 0.15rem;
  }

  &__rol {
    margin: 0 0 1.5rem;
    font-size: 0.82rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--rv-teal-700);
  }

  &__datos {
    display: grid;
    gap: 0.85rem;
    margin: 0;
    text-align: left;
    padding-top: 1.25rem;
    border-top: 1px solid var(--rv-borde);

    dt {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--rv-texto-tenue);
    }

    dd {
      margin: 0.1rem 0 0;
      font-weight: 600;
      color: var(--rv-navy);
    }
  }
}
</style>
