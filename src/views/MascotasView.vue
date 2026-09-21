<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificacionesStore } from '../stores/notificaciones'
import servicioMascotas from '../services/mascotas'
import servicioClientes from '../services/clientes'
import { erroresPorCampo, mensajeDeError } from '../utils/errores'
import { fechaCorta, fechaUtc } from '../utils/formato'
import { ESPECIES, GRUPOS, SEXOS } from '../constantes'
import EstadoCarga from '../components/EstadoCarga.vue'
import EtiquetaEstado from '../components/EtiquetaEstado.vue'
import ModalBase from '../components/ModalBase.vue'
import PaginadorSimple from '../components/PaginadorSimple.vue'

const auth = useAuthStore()
const notificaciones = useNotificacionesStore()

// POST /api/mascotas es de admin y recepción; un cliente solo ve las suyas.
const puedeRegistrar = GRUPOS.ADMIN_O_RECEPCION.includes(auth.rol)

const mascotas = ref([])
const paginacion = ref(null)
const cargando = ref(false)
const error = ref('')
const texto = ref('')

async function cargar(pagina = 1) {
  cargando.value = true
  error.value = ''
  try {
    const consulta = { pagina, limite: 10 }
    const resultado = texto.value.trim()
      ? await servicioMascotas.buscar({ ...consulta, texto: texto.value.trim() })
      : await servicioMascotas.listar(consulta)

    mascotas.value = resultado.items
    paginacion.value = resultado.paginacion
  } catch (excepcion) {
    error.value = mensajeDeError(excepcion)
  } finally {
    cargando.value = false
  }
}

// ── Ficha: historial clínico y vacunas ──
const fichaAbierta = ref(false)
const mascotaActiva = ref(null)
const historial = ref([])
const vacunas = ref([])
const cargandoFicha = ref(false)

async function abrirFicha(mascota) {
  mascotaActiva.value = mascota
  fichaAbierta.value = true
  cargandoFicha.value = true
  historial.value = []
  vacunas.value = []

  try {
    const [atenciones, dosis] = await Promise.all([
      servicioMascotas.historial(mascota.id, { pagina: 1, limite: 10 }),
      servicioMascotas.vacunas(mascota.id)
    ])
    historial.value = atenciones.items ?? atenciones
    vacunas.value = dosis.items ?? dosis
  } catch (excepcion) {
    notificaciones.error(mensajeDeError(excepcion))
  } finally {
    cargandoFicha.value = false
  }
}

// ── Alta ──
const modalAbierto = ref(false)
const guardando = ref(false)
const errorFormulario = ref('')
const erroresCampo = ref({})

const vacio = () => ({
  clienteId: '',
  nombre: '',
  especie: 'perro',
  raza: '',
  sexo: '',
  fechaNacimiento: '',
  pesoKg: '',
  color: '',
  senasParticulares: '',
  esterilizado: false
})

const formulario = reactive(vacio())

// Buscador de dueño (POST /api/clientes/buscar).
const busquedaCliente = ref('')
const clientes = ref([])

async function buscarClientes() {
  if (busquedaCliente.value.trim().length < 2) return
  try {
    const resultado = await servicioClientes.buscar({
      texto: busquedaCliente.value.trim(),
      pagina: 1,
      limite: 10
    })
    clientes.value = resultado.items
  } catch (excepcion) {
    notificaciones.error(mensajeDeError(excepcion))
  }
}

function abrirNueva() {
  Object.assign(formulario, vacio())
  busquedaCliente.value = ''
  clientes.value = []
  errorFormulario.value = ''
  erroresCampo.value = {}
  modalAbierto.value = true
}

async function guardar() {
  guardando.value = true
  errorFormulario.value = ''
  erroresCampo.value = {}

  try {
    await servicioMascotas.crear({
      clienteId: Number(formulario.clienteId),
      nombre: formulario.nombre,
      especie: formulario.especie,
      raza: formulario.raza || null,
      sexo: formulario.sexo || null,
      fechaNacimiento: formulario.fechaNacimiento || null,
      pesoKg: formulario.pesoKg ? Number(formulario.pesoKg) : null,
      color: formulario.color || null,
      senasParticulares: formulario.senasParticulares || null,
      esterilizado: formulario.esterilizado
    })
    notificaciones.exito('Mascota registrada.')
    modalAbierto.value = false
    await cargar(paginacion.value?.pagina ?? 1)
  } catch (excepcion) {
    errorFormulario.value = mensajeDeError(excepcion, 'No se pudo registrar la mascota.')
    erroresCampo.value = erroresPorCampo(excepcion)
  } finally {
    guardando.value = false
  }
}

onMounted(() => cargar())
</script>

<template>
  <div>
    <header class="rv-pagina-cabecera">
      <div>
        <h1>Mascotas</h1>
        <p>{{ auth.esCliente ? 'Las mascotas registradas a tu nombre.' : 'Pacientes registrados en la clínica.' }}</p>
      </div>
      <button v-if="puedeRegistrar" type="button" class="rv-boton rv-boton--primario" @click="abrirNueva">
        + Registrar mascota
      </button>
    </header>

    <form class="rv-filtros" @submit.prevent="cargar(1)">
      <div class="rv-campo" style="flex: 1; min-width: 260px">
        <label class="rv-campo__etiqueta" for="buscar-mascotas">Buscar</label>
        <input
          id="buscar-mascotas"
          v-model="texto"
          class="rv-input"
          type="search"
          placeholder="Nombre de la mascota o del dueño…"
        />
      </div>
      <button type="submit" class="rv-boton rv-boton--marino">Buscar</button>
      <button
        v-if="texto"
        type="button"
        class="rv-boton rv-boton--fantasma"
        @click="((texto = ''), cargar(1))"
      >
        Limpiar
      </button>
    </form>

    <article class="rv-tarjeta">
      <div class="rv-tarjeta__cuerpo">
        <EstadoCarga
          :cargando="cargando"
          :error="error"
          :vacio="mascotas.length === 0"
          titulo-vacio="Sin mascotas"
          mensaje-vacio="No hay mascotas que coincidan."
          @reintentar="cargar(1)"
        >
          <div class="rv-tabla-envoltura">
            <table class="rv-tabla">
              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Especie / raza</th>
                  <th>Dueño</th>
                  <th>Nacimiento</th>
                  <th>Peso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mascota in mascotas" :key="mascota.id">
                  <td>
                    <span class="rv-tabla__principal">{{ mascota.nombre }}</span>
                    <span class="rv-tabla__secundario">
                      {{ mascota.sexo ?? 'sexo no indicado' }}
                      <template v-if="mascota.esterilizado"> · esterilizado</template>
                    </span>
                  </td>
                  <td>
                    <EtiquetaEstado tono="info" :texto="mascota.especie" />
                    <span class="rv-tabla__secundario">{{ mascota.raza ?? '—' }}</span>
                  </td>
                  <td>{{ mascota.clienteNombre }}</td>
                  <td>{{ mascota.fechaNacimiento ? fechaCorta(mascota.fechaNacimiento) : '—' }}</td>
                  <td>{{ mascota.pesoKg ? `${mascota.pesoKg} kg` : '—' }}</td>
                  <td>
                    <div class="rv-tabla__acciones">
                      <button
                        type="button"
                        class="rv-boton rv-boton--sm rv-boton--contorno"
                        @click="abrirFicha(mascota)"
                      >
                        Ver ficha
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <PaginadorSimple :paginacion="paginacion" @cambiar="cargar" />
        </EstadoCarga>
      </div>
    </article>

    <!-- Ficha clínica -->
    <ModalBase
      v-if="fichaAbierta"
      :titulo="`Ficha de ${mascotaActiva.nombre}`"
      ancho="680px"
      @cerrar="fichaAbierta = false"
    >
      <dl class="ficha">
        <div><dt>Especie</dt><dd>{{ mascotaActiva.especie }}</dd></div>
        <div><dt>Raza</dt><dd>{{ mascotaActiva.raza ?? '—' }}</dd></div>
        <div><dt>Sexo</dt><dd>{{ mascotaActiva.sexo ?? '—' }}</dd></div>
        <div><dt>Color</dt><dd>{{ mascotaActiva.color ?? '—' }}</dd></div>
        <div><dt>Peso</dt><dd>{{ mascotaActiva.pesoKg ? `${mascotaActiva.pesoKg} kg` : '—' }}</dd></div>
        <div><dt>Dueño</dt><dd>{{ mascotaActiva.clienteNombre }}</dd></div>
      </dl>

      <p v-if="mascotaActiva.senasParticulares" class="rv-aviso">
        <span><strong>Señas particulares:</strong> {{ mascotaActiva.senasParticulares }}</span>
      </p>

      <h3 class="ficha__titulo">Historial clínico</h3>
      <p v-if="cargandoFicha" class="rv-campo__ayuda">Cargando…</p>
      <ul v-else-if="historial.length" class="linea">
        <li v-for="atencion in historial" :key="atencion.id">
          <strong>{{ fechaUtc(atencion.fecha ?? atencion.creadoEn) }}</strong>
          <span>{{ atencion.diagnostico ?? atencion.motivo ?? 'Atención registrada' }}</span>
          <small v-if="atencion.tratamiento">{{ atencion.tratamiento }}</small>
          <small v-if="atencion.veterinarioNombre">
            Atendió: {{ atencion.veterinarioNombre }}
          </small>
        </li>
      </ul>
      <p v-else class="rv-vacio">Todavía no hay atenciones registradas.</p>

      <h3 class="ficha__titulo">Vacunas</h3>
      <p v-if="cargandoFicha" class="rv-campo__ayuda">Cargando…</p>
      <ul v-else-if="vacunas.length" class="linea">
        <li v-for="vacuna in vacunas" :key="vacuna.id">
          <strong>{{ vacuna.nombre ?? vacuna.vacuna }}</strong>
          <span>Aplicada: {{ vacuna.fechaAplicacion ? fechaCorta(vacuna.fechaAplicacion) : '—' }}</span>
          <small v-if="vacuna.proximaDosis">
            Próxima dosis: {{ fechaCorta(vacuna.proximaDosis) }}
          </small>
        </li>
      </ul>
      <p v-else class="rv-vacio">Sin vacunas registradas.</p>
    </ModalBase>

    <!-- Alta de mascota -->
    <ModalBase v-if="modalAbierto" titulo="Registrar mascota" ancho="620px" @cerrar="modalAbierto = false">
      <form id="form-mascota" novalidate @submit.prevent="guardar">
        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="buscar-cliente">Dueño</label>
          <div class="buscador">
            <input
              id="buscar-cliente"
              v-model="busquedaCliente"
              class="rv-input"
              type="search"
              placeholder="DNI, nombre o teléfono…"
              @keydown.enter.prevent="buscarClientes"
            />
            <button type="button" class="rv-boton rv-boton--contorno" @click="buscarClientes">
              Buscar
            </button>
          </div>
        </div>

        <div v-if="clientes.length" class="rv-campo">
          <label class="rv-campo__etiqueta" for="cliente">Selecciona al dueño</label>
          <select id="cliente" v-model="formulario.clienteId" class="rv-select" required>
            <option value="" disabled>Elige un cliente</option>
            <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
              {{ cliente.nombres }} {{ cliente.apellidos }} — DNI {{ cliente.dni }}
            </option>
          </select>
        </div>

        <div class="rv-rejilla rv-rejilla--2">
          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="nombre-mascota">Nombre</label>
            <input id="nombre-mascota" v-model.trim="formulario.nombre" class="rv-input" required />
            <span v-if="erroresCampo.nombre" class="rv-campo__error">{{ erroresCampo.nombre }}</span>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="especie">Especie</label>
            <select id="especie" v-model="formulario.especie" class="rv-select" required>
              <option v-for="especie in ESPECIES" :key="especie" :value="especie">
                {{ especie }}
              </option>
            </select>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="raza">Raza</label>
            <input id="raza" v-model.trim="formulario.raza" class="rv-input" />
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="sexo">Sexo</label>
            <select id="sexo" v-model="formulario.sexo" class="rv-select">
              <option value="">Sin indicar</option>
              <option v-for="sexo in SEXOS" :key="sexo" :value="sexo">{{ sexo }}</option>
            </select>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="nacimiento">Fecha de nacimiento</label>
            <input id="nacimiento" v-model="formulario.fechaNacimiento" class="rv-input" type="date" />
            <span v-if="erroresCampo.fechaNacimiento" class="rv-campo__error">
              {{ erroresCampo.fechaNacimiento }}
            </span>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="peso">Peso (kg)</label>
            <input id="peso" v-model="formulario.pesoKg" class="rv-input" type="number" step="0.01" min="0" />
            <span v-if="erroresCampo.pesoKg" class="rv-campo__error">{{ erroresCampo.pesoKg }}</span>
          </div>
        </div>

        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="senas">Señas particulares</label>
          <textarea id="senas" v-model.trim="formulario.senasParticulares" class="rv-textarea"></textarea>
        </div>

        <label class="casilla">
          <input v-model="formulario.esterilizado" type="checkbox" />
          <span>Está esterilizado / castrado</span>
        </label>

        <p v-if="errorFormulario" class="rv-aviso rv-aviso--error" role="alert">
          {{ errorFormulario }}
        </p>
      </form>

      <template #pie>
        <button type="button" class="rv-boton rv-boton--fantasma" @click="modalAbierto = false">
          Cancelar
        </button>
        <button
          type="submit"
          form="form-mascota"
          class="rv-boton rv-boton--primario"
          :disabled="guardando || !formulario.clienteId"
        >
          {{ guardando ? 'Guardando…' : 'Registrar' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<style scoped lang="scss">
.buscador {
  display: flex;
  gap: 0.5rem;
}

.casilla {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 0.9rem;
  font-size: 0.9rem;
  color: var(--rv-texto-suave);
  cursor: pointer;

  input {
    accent-color: var(--rv-teal-600);
    width: 16px;
    height: 16px;
  }
}

.ficha {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.9rem 1.25rem;
  margin: 0 0 1.25rem;

  dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--rv-texto-tenue);
  }

  dd {
    margin: 0.15rem 0 0;
    font-weight: 600;
    color: var(--rv-navy);
    text-transform: capitalize;
  }

  &__titulo {
    margin: 1.5rem 0 0.75rem;
    padding-bottom: 0.4rem;
    border-bottom: 2px solid var(--rv-teal-100);
  }
}

.linea {
  list-style: none;
  margin: 0;
  padding: 0 0 0 1.1rem;
  border-left: 2px solid var(--rv-teal-100);

  li {
    position: relative;
    padding: 0 0 1rem 0.6rem;

    &::before {
      content: '';
      position: absolute;
      left: -1.45rem;
      top: 6px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--rv-teal);
      border: 2px solid var(--rv-blanco);
    }

    strong {
      display: block;
      color: var(--rv-navy);
      font-size: 0.92rem;
    }

    span {
      display: block;
      font-size: 0.92rem;
    }

    small {
      display: block;
      font-size: 0.82rem;
      color: var(--rv-texto-tenue);
    }
  }
}
</style>
