<script setup>
import { ref } from 'vue'

// Logo de Rivervet.
//
// Si existe /logo.png (carpeta public/) se usa la imagen oficial; si no,
// se dibuja esta versión en SVG con los mismos colores: silueta de gato en
// turquesa, perrito en azul marino y la onda que los une.
const props = defineProps({
  // 'completo' = marca + texto; 'marca' = solo el símbolo.
  variante: { type: String, default: 'completo' },
  // 'color' sobre fondo claro, 'blanco' sobre el azul marino.
  tono: { type: String, default: 'color' },
  alto: { type: Number, default: 44 }
})

// Ruta en una constante (y no literal en el src): así Vite la trata como un
// archivo servido desde public/ en tiempo de ejecución y no intenta resolverla
// al compilar, que fallaría mientras el PNG no esté puesto.
const RUTA_LOGO = '/logo.png'
const hayImagen = ref(true)
const marino = () => (props.tono === 'blanco' ? '#ffffff' : '#14295e')
</script>

<template>
  <span class="logo" :style="{ '--alto': alto + 'px' }">
    <img
      v-if="hayImagen"
      :src="RUTA_LOGO"
      alt="Rivervet, Centro Veterinario"
      class="logo__imagen"
      @error="hayImagen = false"
    />

    <!-- Respaldo en SVG: se dibuja solo si no está public/logo.png -->
    <svg
      v-else
      class="logo__svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Rivervet"
    >
      <!-- Gato (turquesa) -->
      <path
        fill="#23c3a5"
        d="M38 20l4-6 3 6c5 2 8 7 8 13v13h-19V33c0-5 2-10 4-13z"
      />
      <path
        fill="#23c3a5"
        d="M53 33c4 0 7 3 7 8s-3 8-7 8v-4c2 0 3-2 3-4s-1-4-3-4z"
      />
      <!-- Perrito (marino) -->
      <path
        :fill="marino()"
        d="M20 16c6 0 11 5 11 12v18H12V28c0-7 3-12 8-12z"
      />
      <path :fill="marino()" d="M10 21c0-4 3-6 5-4l2 3-5 9z" />
      <!-- Onda de la base -->
      <path
        :fill="marino()"
        d="M4 50c9-4 17-2 26 0s17 3 30-2v5c-13 5-21 4-30 2s-17-4-26 0z"
      />
      <path
        fill="#23c3a5"
        d="M4 55c9-4 17-2 26 0s17 3 30-2v3c-13 5-21 4-30 2s-17-4-26 0z"
      />
    </svg>

    <span v-if="variante === 'completo'" class="logo__texto">
      <strong :style="{ color: tono === 'blanco' ? '#ffffff' : '#14295e' }">
        Rivervet
      </strong>
      <small>Centro Veterinario</small>
    </span>
  </span>
</template>

<style scoped lang="scss">
.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  line-height: 1;
}

.logo__imagen,
.logo__svg {
  height: var(--alto);
  width: auto;
  flex-shrink: 0;
}

.logo__texto {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-family: var(--rv-fuente-titulo);
    font-size: calc(var(--alto) * 0.44);
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  small {
    font-family: var(--rv-fuente-titulo);
    font-size: calc(var(--alto) * 0.2);
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--rv-teal-600);
    text-transform: uppercase;
  }
}
</style>
