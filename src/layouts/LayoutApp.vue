<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificacionesStore } from '../stores/notificaciones'
import LogoRivervet from '../components/LogoRivervet.vue'
import { GRUPOS, NOMBRE_ROL } from '../constantes'
import { iniciales } from '../utils/formato'

const router = useRouter()
const auth = useAuthStore()
const notificaciones = useNotificacionesStore()
const menuAbierto = ref(false)

// El menú es el espejo de meta.roles del router: cada quien ve solo lo suyo.
const enlaces = [
  { nombre: 'panel', texto: 'Panel', icono: '📊', roles: GRUPOS.TODOS },
  { nombre: 'citas', texto: 'Citas', icono: '📅', roles: GRUPOS.TODOS },
  { nombre: 'mascotas', texto: 'Mascotas', icono: '🐾', roles: GRUPOS.TODOS },
  { nombre: 'clientes', texto: 'Clientes', icono: '👥', roles: GRUPOS.PERSONAL },
  { nombre: 'inventario', texto: 'Inventario', icono: '📦', roles: GRUPOS.ADMIN_O_RECEPCION }
]

const enlacesVisibles = computed(() =>
  enlaces.filter((enlace) => enlace.roles.includes(auth.rol))
)

const rolLegible = computed(() => NOMBRE_ROL[auth.rol] ?? '')

async function cerrarSesion() {
  await auth.logout()
  notificaciones.exito('Sesión cerrada. ¡Hasta pronto!')
  router.push({ name: 'inicio' })
}
</script>

<template>
  <div class="app" :class="{ 'app--menu': menuAbierto }">
    <aside class="lateral">
      <router-link to="/" class="lateral__logo">
        <LogoRivervet :alto="44" tono="blanco" />
      </router-link>

      <nav class="lateral__nav">
        <router-link
          v-for="enlace in enlacesVisibles"
          :key="enlace.nombre"
          :to="{ name: enlace.nombre }"
          class="lateral__enlace"
          @click="menuAbierto = false"
        >
          <span aria-hidden="true">{{ enlace.icono }}</span>
          {{ enlace.texto }}
        </router-link>
      </nav>

      <div class="lateral__pie">
        <router-link :to="{ name: 'tienda' }" class="lateral__enlace lateral__enlace--tenue">
          <span aria-hidden="true">🛍️</span> Ver tienda
        </router-link>
      </div>
    </aside>

    <div class="principal">
      <header class="topbar">
        <button
          type="button"
          class="topbar__menu"
          aria-label="Abrir menú"
          @click="menuAbierto = !menuAbierto"
        >
          ☰
        </button>

        <h1 class="topbar__titulo">{{ $route.meta.titulo ?? 'Panel' }}</h1>

        <div class="topbar__usuario">
          <router-link :to="{ name: 'perfil' }" class="topbar__ficha">
            <span class="topbar__avatar">{{ iniciales(auth.nombre) }}</span>
            <span class="topbar__datos">
              <strong>{{ auth.nombre }}</strong>
              <small>{{ rolLegible }}</small>
            </span>
          </router-link>

          <button type="button" class="rv-boton rv-boton--sm rv-boton--contorno" @click="cerrarSesion">
            Salir
          </button>
        </div>
      </header>

      <main class="contenido">
        <router-view />
      </main>
    </div>

    <div v-if="menuAbierto" class="velo" @click="menuAbierto = false"></div>
  </div>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  min-height: 100vh;
  background: var(--rv-fondo);
}

// ── Barra lateral marino, como el azul del logo ──
.lateral {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--rv-sidebar);
  display: flex;
  flex-direction: column;
  padding: 1.25rem 0.9rem;
  background: linear-gradient(180deg, var(--rv-navy) 0%, var(--rv-navy-900) 100%);
  z-index: 50;

  &__logo {
    display: block;
    padding: 0.35rem 0.6rem 1.5rem;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__enlace {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.85rem;
    border-radius: var(--rv-radio-sm);
    color: #ccd7ef;
    font-weight: 500;
    font-size: 0.95rem;
    transition: background var(--rv-transicion), color var(--rv-transicion);

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--rv-blanco);
    }

    &--tenue {
      color: #9fb0d2;
      font-size: 0.9rem;
    }
  }

  // Ruta activa: turquesa, el segundo color de la marca.
  &__nav .router-link-active {
    background: var(--rv-teal);
    color: #04372e;
    font-weight: 600;
    box-shadow: 0 6px 16px rgba(35, 195, 165, 0.25);
  }

  &__pie {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
}

.principal {
  flex: 1;
  min-width: 0;
  margin-left: var(--rv-sidebar);
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: var(--rv-topbar);
  padding: 0 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--rv-borde);

  &__titulo {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
  }

  &__usuario {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__ficha {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0.6rem 0.3rem 0.3rem;
    border-radius: var(--rv-radio-full);
    transition: background var(--rv-transicion);

    &:hover {
      background: var(--rv-navy-50);
    }
  }

  &__avatar {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--rv-teal);
    color: #04372e;
    font-weight: 700;
    font-size: 0.85rem;
  }

  &__datos {
    display: flex;
    flex-direction: column;
    line-height: 1.2;

    strong {
      font-size: 0.9rem;
      color: var(--rv-navy);
    }

    small {
      font-size: 0.75rem;
      color: var(--rv-texto-tenue);
    }
  }

  &__menu {
    display: none;
    border: 1px solid var(--rv-borde);
    background: var(--rv-blanco);
    border-radius: var(--rv-radio-sm);
    width: 38px;
    height: 38px;
    font-size: 1.1rem;
    cursor: pointer;
  }
}

.contenido {
  flex: 1;
  padding: 1.75rem 1.5rem 3rem;
  max-width: 1320px;
  width: 100%;
}

.velo {
  position: fixed;
  inset: 0;
  background: rgba(8, 19, 47, 0.45);
  z-index: 45;
}

@media (max-width: 960px) {
  .lateral {
    transform: translateX(-100%);
    transition: transform 200ms ease;
  }

  .app--menu .lateral {
    transform: translateX(0);
  }

  .principal {
    margin-left: 0;
  }

  .topbar__menu {
    display: block;
  }

  .topbar__datos {
    display: none;
  }

  .contenido {
    padding: 1.25rem 1rem 2.5rem;
  }
}
</style>
