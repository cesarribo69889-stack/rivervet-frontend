<script setup>
import { computed } from 'vue'
import { ETIQUETA_ESTADO_CITA } from '../constantes'

// Pinta el estado de una cita (o cualquier texto) con su color de la marca.
const props = defineProps({
  estado: { type: String, default: '' },
  tono: { type: String, default: '' },
  texto: { type: String, default: '' }
})

const config = computed(() => ETIQUETA_ESTADO_CITA[props.estado] ?? null)
const tonoFinal = computed(() => props.tono || config.value?.tono || 'neutro')
const textoFinal = computed(() => props.texto || config.value?.texto || props.estado || '—')
</script>

<template>
  <span class="rv-etiqueta" :class="`rv-etiqueta--${tonoFinal}`">{{ textoFinal }}</span>
</template>
