<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

// Diálogo centrado y accesible: se cierra con Escape o clic en el fondo,
// y bloquea el scroll de la página mientras está abierto.
defineProps({
  titulo: { type: String, required: true },
  ancho: { type: String, default: '520px' }
})

const emit = defineEmits(['cerrar'])

function alPulsarTecla(evento) {
  if (evento.key === 'Escape') emit('cerrar')
}

onMounted(() => {
  document.addEventListener('keydown', alPulsarTecla)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', alPulsarTecla)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="fondo" @click.self="$emit('cerrar')">
    <div class="modal" :style="{ maxWidth: ancho }" role="dialog" aria-modal="true">
      <header class="modal__cabecera">
        <h2>{{ titulo }}</h2>
        <button
          type="button"
          class="modal__cerrar"
          aria-label="Cerrar"
          @click="$emit('cerrar')"
        >
          ×
        </button>
      </header>

      <div class="modal__cuerpo">
        <slot />
      </div>

      <footer v-if="$slots.pie" class="modal__pie">
        <slot name="pie" />
      </footer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fondo {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 19, 47, 0.55);
  backdrop-filter: blur(3px);
  animation: aparecer 140ms ease;
}

.modal {
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--rv-blanco);
  border-radius: var(--rv-radio-lg);
  box-shadow: var(--rv-sombra-lg);
  overflow: hidden;

  &__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1.35rem;
    border-bottom: 1px solid var(--rv-borde);
    background: linear-gradient(120deg, var(--rv-navy) 0%, var(--rv-navy-500) 100%);

    h2 {
      margin: 0;
      font-size: 1.15rem;
      color: var(--rv-blanco);
    }
  }

  &__cerrar {
    border: none;
    background: rgba(255, 255, 255, 0.12);
    color: var(--rv-blanco);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.24);
    }
  }

  &__cuerpo {
    padding: 1.35rem;
    overflow-y: auto;
  }

  &__pie {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    padding: 1rem 1.35rem;
    border-top: 1px solid var(--rv-borde);
    background: var(--rv-superficie-2);
  }
}

@keyframes aparecer {
  from {
    opacity: 0;
  }
}
</style>
