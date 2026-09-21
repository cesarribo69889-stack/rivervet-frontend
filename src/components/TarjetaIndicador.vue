<script setup>
// Tarjeta de un número del panel (ventas, citas, clientes nuevos…).
defineProps({
  titulo: { type: String, required: true },
  valor: { type: [String, Number], required: true },
  detalle: { type: String, default: '' },
  icono: { type: String, default: '🐾' },
  tono: { type: String, default: 'teal' }
})
</script>

<template>
  <article class="indicador" :class="`indicador--${tono}`">
    <span class="indicador__icono" aria-hidden="true">{{ icono }}</span>
    <div>
      <p class="indicador__titulo">{{ titulo }}</p>
      <p class="indicador__valor">{{ valor }}</p>
      <p v-if="detalle" class="indicador__detalle">{{ detalle }}</p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.indicador {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1.15rem 1.25rem;
  background: var(--rv-superficie);
  border: 1px solid var(--rv-borde);
  border-radius: var(--rv-radio);
  box-shadow: var(--rv-sombra-sm);
  border-top: 3px solid var(--rv-teal);

  &--marino {
    border-top-color: var(--rv-navy);
  }
  &--cielo {
    border-top-color: var(--rv-cielo);
  }
  &--aviso {
    border-top-color: var(--rv-aviso);
  }

  &__icono {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: var(--rv-radio-sm);
    background: var(--rv-teal-50);
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  &__titulo {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--rv-texto-tenue);
  }

  &__valor {
    margin: 0.15rem 0 0;
    font-family: var(--rv-fuente-titulo);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--rv-navy);
    line-height: 1.1;
  }

  &__detalle {
    margin: 0.2rem 0 0;
    font-size: 0.82rem;
    color: var(--rv-texto-suave);
  }
}
</style>
