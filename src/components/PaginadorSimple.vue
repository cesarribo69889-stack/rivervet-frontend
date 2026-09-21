<script setup>
// Paginador para la forma { items, paginacion: { pagina, limite, total, totalPaginas } }
// que devuelven todos los listados del backend.
const props = defineProps({
  paginacion: { type: Object, default: null }
})

defineEmits(['cambiar'])

const hayAnterior = () => (props.paginacion?.pagina ?? 1) > 1
const haySiguiente = () =>
  (props.paginacion?.pagina ?? 1) < (props.paginacion?.totalPaginas ?? 1)
</script>

<template>
  <nav v-if="paginacion && paginacion.totalPaginas > 1" class="paginador" aria-label="Paginación">
    <button
      type="button"
      class="rv-boton rv-boton--sm rv-boton--contorno"
      :disabled="!hayAnterior()"
      @click="$emit('cambiar', paginacion.pagina - 1)"
    >
      ← Anterior
    </button>

    <span class="paginador__info">
      Página <strong>{{ paginacion.pagina }}</strong> de {{ paginacion.totalPaginas }}
      <small>({{ paginacion.total }} registros)</small>
    </span>

    <button
      type="button"
      class="rv-boton rv-boton--sm rv-boton--contorno"
      :disabled="!haySiguiente()"
      @click="$emit('cambiar', paginacion.pagina + 1)"
    >
      Siguiente →
    </button>
  </nav>
</template>

<style scoped lang="scss">
.paginador {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 0 0;

  &__info {
    font-size: 0.9rem;
    color: var(--rv-texto-suave);

    strong {
      color: var(--rv-navy);
    }

    small {
      color: var(--rv-texto-tenue);
    }
  }
}
</style>
