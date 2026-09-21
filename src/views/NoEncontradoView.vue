<script setup>
import LogoRivervet from '../components/LogoRivervet.vue'
</script>

<template>
  <div class="aviso-pagina">
    <LogoRivervet :alto="64" />
    <h1>404 · Página no encontrada</h1>
    <p>La dirección que abriste no existe o cambió de sitio.</p>
    <router-link to="/" class="rv-boton rv-boton--primario">Ir al inicio</router-link>
  </div>
</template>

<style scoped lang="scss">
.aviso-pagina {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  padding: 2rem;
  background: var(--rv-blanco);

  h1 {
    margin: 1rem 0 0;
  }

  p {
    color: var(--rv-texto-suave);
  }

  .rv-boton {
    margin-top: 0.75rem;
  }
}
</style>
