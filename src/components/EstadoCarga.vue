<script setup>
// Envoltura para los tres estados de cualquier listado: cargando, error y
// vacío. Evita repetir los mismos v-if en cada vista.
defineProps({
  cargando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  vacio: { type: Boolean, default: false },
  tituloVacio: { type: String, default: 'Sin resultados' },
  mensajeVacio: { type: String, default: 'No hay nada que mostrar todavía.' },
  filas: { type: Number, default: 4 }
})

defineEmits(['reintentar'])
</script>

<template>
  <div v-if="cargando" class="carga" aria-busy="true">
    <span class="rv-oculto">Cargando…</span>
    <div v-for="fila in filas" :key="fila" class="carga__fila">
      <div class="rv-esqueleto" style="width: 38%"></div>
      <div class="rv-esqueleto" style="width: 22%"></div>
      <div class="rv-esqueleto" style="width: 30%"></div>
    </div>
  </div>

  <div v-else-if="error" class="rv-aviso rv-aviso--error" role="alert">
    <span>{{ error }}</span>
    <button type="button" class="rv-boton rv-boton--sm rv-boton--contorno" @click="$emit('reintentar')">
      Reintentar
    </button>
  </div>

  <div v-else-if="vacio" class="rv-vacio">
    <strong>{{ tituloVacio }}</strong>
    <span>{{ mensajeVacio }}</span>
  </div>

  <slot v-else />
</template>

<style scoped lang="scss">
.carga {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem 0;

  &__fila {
    display: flex;
    gap: 1rem;
  }
}

.rv-aviso--error {
  align-items: center;
  justify-content: space-between;
}
</style>
