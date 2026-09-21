<script setup>
import { useNotificacionesStore } from '../stores/notificaciones'

const notificaciones = useNotificacionesStore()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="nota in notificaciones.lista"
        :key="nota.id"
        class="toast"
        :class="`toast--${nota.tono}`"
        role="status"
      >
        <span>{{ nota.mensaje }}</span>
        <button type="button" aria-label="Cerrar aviso" @click="notificaciones.cerrar(nota.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
.toasts {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 80;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: min(360px, calc(100vw - 2rem));
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: var(--rv-radio-sm);
  box-shadow: var(--rv-sombra-lg);
  font-size: 0.92rem;
  color: var(--rv-blanco);
  background: var(--rv-navy);

  button {
    border: none;
    background: transparent;
    color: inherit;
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    opacity: 0.8;
  }

  &--exito {
    background: var(--rv-teal-700);
  }

  &--error {
    background: var(--rv-error);
  }

  &--aviso {
    background: #8a6508;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 200ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
