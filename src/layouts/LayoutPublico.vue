<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import LogoRivervet from '../components/LogoRivervet.vue'
import { HORARIO } from '../constantes'

const auth = useAuthStore()
const menuAbierto = ref(false)
</script>

<template>
  <div class="publico">
    <header class="cabecera">
      <div class="rv-contenedor cabecera__fila">
        <router-link to="/" class="cabecera__logo" @click="menuAbierto = false">
          <LogoRivervet :alto="46" />
        </router-link>

        <button
          type="button"
          class="cabecera__hamburguesa"
          :aria-expanded="menuAbierto"
          aria-label="Abrir menú"
          @click="menuAbierto = !menuAbierto"
        >
          <span></span><span></span><span></span>
        </button>

        <nav class="cabecera__nav" :class="{ 'cabecera__nav--abierto': menuAbierto }">
          <router-link to="/" @click="menuAbierto = false">Inicio</router-link>
          <router-link to="/tienda" @click="menuAbierto = false">Tienda</router-link>
          <a href="#servicios" @click="menuAbierto = false">Servicios</a>
          <a href="#contacto" @click="menuAbierto = false">Contacto</a>

          <router-link
            v-if="auth.estaAutenticado"
            to="/panel"
            class="rv-boton rv-boton--primario rv-boton--sm"
            @click="menuAbierto = false"
          >
            Ir al panel
          </router-link>
          <router-link
            v-else
            to="/login"
            class="rv-boton rv-boton--primario rv-boton--sm"
            @click="menuAbierto = false"
          >
            Iniciar sesión
          </router-link>
        </nav>
      </div>
    </header>

    <main>
      <router-view />
    </main>

    <footer id="contacto" class="pie">
      <div class="rv-contenedor pie__rejilla">
        <div>
          <LogoRivervet :alto="52" tono="blanco" />
          <p class="pie__texto">
            Cuidamos a los que te cuidan. Consulta, vacunación, cirugía y tienda
            para tu mascota.
          </p>
        </div>

        <div>
          <h3>Atención</h3>
          <p class="pie__texto">{{ HORARIO.DESCRIPCION }}</p>
          <p class="pie__texto">Citas en bloques de 30 minutos.</p>
        </div>

        <div>
          <h3>Accesos</h3>
          <router-link to="/tienda">Tienda</router-link>
          <router-link to="/login">Iniciar sesión</router-link>
        </div>
      </div>

      <div class="rv-contenedor pie__legal">
        <span>© {{ new Date().getFullYear() }} Rivervet — Centro Veterinario</span>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.publico {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--rv-blanco);
}

.cabecera {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--rv-borde);

  &__fila {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 76px;
  }

  &__logo {
    display: inline-flex;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 1.6rem;

    a {
      font-weight: 500;
      color: var(--rv-navy);
      position: relative;

      &:not(.rv-boton):hover {
        color: var(--rv-teal-700);
      }
    }

    .router-link-active:not(.rv-boton)::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -6px;
      height: 3px;
      border-radius: 3px;
      background: var(--rv-teal);
    }
  }

  &__hamburguesa {
    display: none;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    border: 1px solid var(--rv-borde);
    border-radius: var(--rv-radio-sm);
    background: var(--rv-blanco);
    cursor: pointer;

    span {
      width: 20px;
      height: 2px;
      background: var(--rv-navy);
      border-radius: 2px;
    }
  }
}

.pie {
  margin-top: auto;
  padding-top: 3rem;
  background: var(--rv-navy-800);
  color: #c7d2ea;

  h3 {
    color: var(--rv-blanco);
    font-size: 1rem;
  }

  a {
    display: block;
    color: var(--rv-teal-300);
    margin-bottom: 0.4rem;

    &:hover {
      color: var(--rv-blanco);
    }
  }

  &__rejilla {
    display: grid;
    gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    padding-bottom: 2.5rem;
  }

  &__texto {
    margin: 0.75rem 0 0;
    font-size: 0.92rem;
    line-height: 1.6;
  }

  &__legal {
    padding-block: 1.1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    font-size: 0.85rem;
  }
}

@media (max-width: 860px) {
  .cabecera__hamburguesa {
    display: flex;
  }

  .cabecera__nav {
    position: absolute;
    top: 76px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem 20px 1.75rem;
    background: var(--rv-blanco);
    border-bottom: 1px solid var(--rv-borde);
    box-shadow: var(--rv-sombra);
    display: none;

    &--abierto {
      display: flex;
    }
  }
}
</style>
