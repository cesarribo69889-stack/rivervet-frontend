<script setup>
import LogoRivervet from '../components/LogoRivervet.vue'
import { HORARIO } from '../constantes'

const servicios = [
  {
    icono: '🩺',
    titulo: 'Consulta veterinaria',
    texto: 'Diagnóstico y tratamiento con historial clínico digital de tu mascota.'
  },
  {
    icono: '💉',
    titulo: 'Vacunación',
    texto: 'Calendario de vacunas al día, con recordatorios antes de cada dosis.'
  },
  {
    icono: '📅',
    titulo: 'Citas en línea',
    texto: 'Bloques de 30 minutos con el veterinario que elijas, sin esperas.'
  },
  {
    icono: '🛍️',
    titulo: 'Tienda y farmacia',
    texto: 'Alimento, accesorios y medicamentos con stock real y entrega en clínica.'
  }
]

const pasos = [
  { numero: '01', titulo: 'Crea tu cuenta', texto: 'Recepción registra a tu mascota y a ti en un minuto.' },
  { numero: '02', titulo: 'Agenda tu cita', texto: 'Elige día, hora y veterinario según la disponibilidad real.' },
  { numero: '03', titulo: 'Sigue su salud', texto: 'Historial, vacunas y pedidos siempre a la mano.' }
]
</script>

<template>
  <div class="home">
    <!-- ── Portada ── -->
    <section class="hero">
      <div class="rv-contenedor hero__rejilla">
        <div class="hero__texto">
          <span class="hero__pildora">🐾 Centro Veterinario en Lima</span>
          <h1>Cuidamos a <span class="hero__resalte">los que te cuidan</span></h1>
          <p>
            En Rivervet atendemos a perros y gatos con historial clínico digital,
            citas en línea y una tienda con stock real. {{ HORARIO.DESCRIPCION }}.
          </p>

          <div class="hero__acciones">
            <router-link to="/login" class="rv-boton rv-boton--primario rv-boton--lg">
              Reservar una cita
            </router-link>
            <router-link to="/tienda" class="rv-boton rv-boton--contorno rv-boton--lg">
              Ver la tienda
            </router-link>
          </div>

          <dl class="hero__datos">
            <div>
              <dt>Lun a sáb</dt>
              <dd>08:00 – 20:00</dd>
            </div>
            <div>
              <dt>Bloques de</dt>
              <dd>30 minutos</dd>
            </div>
            <div>
              <dt>Historial</dt>
              <dd>100 % digital</dd>
            </div>
          </dl>
        </div>

        <div class="hero__marca">
          <div class="hero__circulo">
            <LogoRivervet variante="marca" :alto="230" />
          </div>
        </div>
      </div>
    </section>

    <!-- ── Servicios ── -->
    <section id="servicios" class="seccion">
      <div class="rv-contenedor">
        <header class="seccion__cabecera">
          <h2>Todo lo que tu mascota necesita</h2>
          <p>Un solo lugar para su salud, sus vacunas y sus cosas.</p>
        </header>

        <div class="rv-rejilla rv-rejilla--4">
          <article v-for="servicio in servicios" :key="servicio.titulo" class="servicio">
            <span class="servicio__icono" aria-hidden="true">{{ servicio.icono }}</span>
            <h3>{{ servicio.titulo }}</h3>
            <p>{{ servicio.texto }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ── Cómo funciona ── -->
    <section class="seccion seccion--clara">
      <div class="rv-contenedor">
        <header class="seccion__cabecera">
          <h2>Así de simple</h2>
          <p>Tres pasos entre tu mascota y su próxima consulta.</p>
        </header>

        <div class="rv-rejilla rv-rejilla--3">
          <article v-for="paso in pasos" :key="paso.numero" class="paso">
            <span class="paso__numero">{{ paso.numero }}</span>
            <h3>{{ paso.titulo }}</h3>
            <p>{{ paso.texto }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ── Llamada final ── -->
    <section class="cta">
      <div class="rv-contenedor cta__caja">
        <div>
          <h2>¿Ya eres parte de Rivervet?</h2>
          <p>Entra a tu cuenta para ver tus citas, el historial de tu mascota y tus pedidos.</p>
        </div>
        <router-link to="/login" class="rv-boton rv-boton--primario rv-boton--lg">
          Iniciar sesión
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--rv-navy) 0%, var(--rv-navy-700) 55%, #0b1c4a 100%);
  color: #dbe4f7;
  padding-block: clamp(3rem, 8vw, 5.5rem);

  &::after {
    content: '';
    position: absolute;
    right: -140px;
    top: -120px;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(35, 195, 165, 0.35) 0%, transparent 68%);
  }

  &__rejilla {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 2.5rem;
    grid-template-columns: 1.15fr 0.85fr;
    align-items: center;
  }

  &__pildora {
    display: inline-block;
    padding: 0.35rem 0.9rem;
    border-radius: var(--rv-radio-full);
    background: rgba(35, 195, 165, 0.16);
    border: 1px solid rgba(35, 195, 165, 0.4);
    color: var(--rv-teal-300);
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1.1rem;
  }

  h1 {
    color: var(--rv-blanco);
    font-size: clamp(2.1rem, 1.3rem + 3.2vw, 3.4rem);
    margin-bottom: 1rem;
  }

  &__resalte {
    color: var(--rv-teal);
  }

  &__texto p {
    font-size: 1.08rem;
    max-width: 52ch;
    color: #c3cfe8;
  }

  &__acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem;
    margin: 1.75rem 0 2.25rem;

    .rv-boton--contorno {
      color: var(--rv-blanco);
      border-color: rgba(255, 255, 255, 0.45);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--rv-blanco);
        border-color: var(--rv-teal);
      }
    }
  }

  &__datos {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    margin: 0;

    dt {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--rv-teal-300);
    }

    dd {
      margin: 0.2rem 0 0;
      font-family: var(--rv-fuente-titulo);
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--rv-blanco);
    }
  }

  &__marca {
    display: flex;
    justify-content: center;
  }

  &__circulo {
    display: grid;
    place-items: center;
    width: min(340px, 78vw);
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--rv-blanco);
    box-shadow: 0 30px 70px rgba(4, 12, 35, 0.45);
  }
}

.seccion {
  padding-block: clamp(2.75rem, 6vw, 4.5rem);
  background: var(--rv-blanco);

  &--clara {
    background: var(--rv-fondo);
  }

  &__cabecera {
    text-align: center;
    max-width: 560px;
    margin: 0 auto 2.25rem;

    p {
      color: var(--rv-texto-suave);
      margin: 0;
    }
  }
}

.servicio {
  padding: 1.5rem;
  border: 1px solid var(--rv-borde);
  border-radius: var(--rv-radio);
  background: var(--rv-superficie);
  transition: transform var(--rv-transicion), box-shadow var(--rv-transicion),
    border-color var(--rv-transicion);

  &:hover {
    transform: translateY(-4px);
    border-color: var(--rv-teal-300);
    box-shadow: var(--rv-sombra);
  }

  &__icono {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: var(--rv-radio-sm);
    background: var(--rv-teal-50);
    font-size: 1.4rem;
    margin-bottom: 0.9rem;
  }

  p {
    margin: 0;
    color: var(--rv-texto-suave);
    font-size: 0.95rem;
  }
}

.paso {
  padding: 1.6rem 1.5rem 1.5rem;
  background: var(--rv-superficie);
  border-radius: var(--rv-radio);
  border: 1px solid var(--rv-borde);

  &__numero {
    font-family: var(--rv-fuente-titulo);
    font-size: 2rem;
    font-weight: 700;
    color: var(--rv-teal);
    line-height: 1;
  }

  h3 {
    margin-top: 0.6rem;
  }

  p {
    margin: 0;
    color: var(--rv-texto-suave);
    font-size: 0.95rem;
  }
}

.cta {
  padding-block: 0 clamp(2.5rem, 6vw, 4rem);
  background: var(--rv-fondo);

  &__caja {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding: 2rem;
    border-radius: var(--rv-radio-lg);
    background: linear-gradient(120deg, var(--rv-teal-600) 0%, var(--rv-teal) 100%);
    box-shadow: 0 20px 45px rgba(20, 168, 140, 0.28);

    h2 {
      color: #04372e;
      margin: 0;
    }

    p {
      margin: 0.35rem 0 0;
      color: #05463a;
    }

    .rv-boton--primario {
      background: var(--rv-navy);
      color: var(--rv-blanco);
      box-shadow: none;

      &:hover {
        background: var(--rv-navy-800);
      }
    }
  }
}

@media (max-width: 900px) {
  .hero__rejilla {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero__texto p,
  .hero__datos {
    margin-inline: auto;
    justify-content: center;
  }

  .hero__acciones {
    justify-content: center;
  }
}
</style>
