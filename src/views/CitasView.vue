<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificacionesStore } from '../stores/notificaciones'
import servicioCitas from '../services/citas'
import servicioMascotas from '../services/mascotas'
import { mensajeDeError } from '../utils/errores'
import { diaLima, fechaHoraLima, hoyLima } from '../utils/formato'
import { ESTADOS_CITA, GRUPOS, HORARIO } from '../constantes'
import EstadoCarga from '../components/EstadoCarga.vue'
import EtiquetaEstado from '../components/EtiquetaEstado.vue'
import ModalBase from '../components/ModalBase.vue'

const auth = useAuthStore()
const notificaciones = useNotificacionesStore()

// Solo admin y recepción pueden agendar (POST /api/citas).
const puedeAgendar = GRUPOS.ADMIN_O_RECEPCION.includes(auth.rol)

// ── Listado ──
const filtros = reactive({
  desde: hoyLima(),
  hasta: diaLima(14),
  estado: '',
  veterinarioId: ''
})

const citas = ref([])
const cargando = ref(false)
const error = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    // Los parámetros vacíos se quitan: el validador del backend rechaza
    // cadenas vacías donde espera una fecha o un id.
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => valor !== '' && valor !== null)
    )
    const resultado = await servicioCitas.listar(params)
    citas.value = resultado.items ?? resultado
  } catch (excepcion) {
    error.value = mensajeDeError(excepcion)
  } finally {
    cargando.value = false
  }
}

// ── Veterinarios (para filtrar y para agendar) ──
const veterinarios = ref([])

async function cargarVeterinarios() {
  if (!auth.esPersonal) return
  try {
    veterinarios.value = await servicioCitas.veterinarios()
  } catch {
    veterinarios.value = []
  }
}

// ── Agendar ──
const modalAbierto = ref(false)
const guardando = ref(false)
const errorFormulario = ref('')

const nueva = reactive({
  mascotaId: '',
  veterinarioId: '',
  fecha: hoyLima(),
  hora: '',
  motivo: ''
})

const busquedaMascota = ref('')
const mascotas = ref([])
const buscandoMascotas = ref(false)

async function buscarMascotas() {
  if (busquedaMascota.value.trim().length < 2) return
  buscandoMascotas.value = true
  try {
    const resultado = await servicioMascotas.buscar({
      texto: busquedaMascota.value.trim(),
      pagina: 1,
      limite: 10
    })
    mascotas.value = resultado.items ?? resultado
  } catch (excepcion) {
    notificaciones.error(mensajeDeError(excepcion))
  } finally {
    buscandoMascotas.value = false
  }
}

// ── Disponibilidad: bloques de 30 min del veterinario ese día ──
const horarios = ref([])
const cargandoHorarios = ref(false)

async function cargarDisponibilidad() {
  horarios.value = []
  nueva.hora = ''
  if (!nueva.veterinarioId || !nueva.fecha) return

  cargandoHorarios.value = true
  try {
    const respuesta = await servicioCitas.disponibilidad(nueva.veterinarioId, nueva.fecha)
    horarios.value = respuesta.atiende ? respuesta.horarios : []
    if (!respuesta.atiende) {
      notificaciones.aviso(`Ese día no se atiende. ${HORARIO.DESCRIPCION}.`)
    }
  } catch (excepcion) {
    notificaciones.error(mensajeDeError(excepcion))
  } finally {
    cargandoHorarios.value = false
  }
}

watch(() => [nueva.veterinarioId, nueva.fecha], cargarDisponibilidad)

function abrirModal() {
  Object.assign(nueva, {
    mascotaId: '',
    veterinarioId: '',
    fecha: hoyLima(),
    hora: '',
    motivo: ''
  })
  busquedaMascota.value = ''
  mascotas.value = []
  horarios.value = []
  errorFormulario.value = ''
  modalAbierto.value = true
}

async function agendar() {
  guardando.value = true
  errorFormulario.value = ''
  try {
    // El backend espera la hora de Lima como texto: 'AAAA-MM-DDTHH:mm'.
    await servicioCitas.agendar({
      mascotaId: Number(nueva.mascotaId),
      veterinarioId: Number(nueva.veterinarioId),
      fechaHora: `${nueva.fecha}T${nueva.hora}`,
      motivo: nueva.motivo
    })
    notificaciones.exito('Cita agendada.')
    modalAbierto.value = false
    await cargar()
  } catch (excepcion) {
    errorFormulario.value = mensajeDeError(excepcion, 'No se pudo agendar la cita.')
  } finally {
    guardando.value = false
  }
}

// ── Cancelar ──
async function cancelar(cita) {
  const motivo = window.prompt(`Motivo para cancelar la cita de ${cita.mascotaNombre}:`)
  if (motivo === null) return

  try {
    await servicioCitas.cancelar(cita.id, motivo || 'Cancelada por el usuario')
    notificaciones.exito('Cita cancelada.')
    await cargar()
  } catch (excepcion) {
    notificaciones.error(mensajeDeError(excepcion))
  }
}

onMounted(() => {
  cargar()
  cargarVeterinarios()
})
</script>

<template>
  <div>
    <header class="rv-pagina-cabecera">
      <div>
        <h1>Agenda de citas</h1>
        <p>{{ HORARIO.DESCRIPCION }} · bloques de {{ HORARIO.MINUTOS_BLOQUE }} minutos.</p>
      </div>
      <button v-if="puedeAgendar" type="button" class="rv-boton rv-boton--primario" @click="abrirModal">
        + Agendar cita
      </button>
    </header>

    <!-- Filtros -->
    <form class="rv-filtros" @submit.prevent="cargar">
      <div class="rv-campo">
        <label class="rv-campo__etiqueta" for="desde">Desde</label>
        <input id="desde" v-model="filtros.desde" class="rv-input" type="date" />
      </div>

      <div class="rv-campo">
        <label class="rv-campo__etiqueta" for="hasta">Hasta</label>
        <input id="hasta" v-model="filtros.hasta" class="rv-input" type="date" />
      </div>

      <div class="rv-campo">
        <label class="rv-campo__etiqueta" for="estado">Estado</label>
        <select id="estado" v-model="filtros.estado" class="rv-select">
          <option value="">Todos</option>
          <option :value="ESTADOS_CITA.PROGRAMADA">Programadas</option>
          <option :value="ESTADOS_CITA.ATENDIDA">Atendidas</option>
          <option :value="ESTADOS_CITA.CANCELADA">Canceladas</option>
          <option :value="ESTADOS_CITA.NO_ASISTIO">No asistió</option>
        </select>
      </div>

      <div v-if="auth.esPersonal" class="rv-campo">
        <label class="rv-campo__etiqueta" for="vet">Veterinario</label>
        <select id="vet" v-model="filtros.veterinarioId" class="rv-select">
          <option value="">Todos</option>
          <option v-for="vet in veterinarios" :key="vet.id" :value="vet.id">
            {{ vet.nombre }}
          </option>
        </select>
      </div>

      <button type="submit" class="rv-boton rv-boton--marino">Filtrar</button>
    </form>

    <!-- Listado -->
    <article class="rv-tarjeta">
      <div class="rv-tarjeta__cuerpo">
        <EstadoCarga
          :cargando="cargando"
          :error="error"
          :vacio="citas.length === 0"
          titulo-vacio="Sin citas"
          mensaje-vacio="No hay citas en el rango elegido."
          @reintentar="cargar"
        >
          <div class="rv-tabla-envoltura">
            <table class="rv-tabla">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Mascota</th>
                  <th>Cliente</th>
                  <th>Veterinario</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cita in citas" :key="cita.id">
                  <td class="rv-tabla__principal">{{ fechaHoraLima(cita.fechaHoraLima) }}</td>
                  <td>
                    <span class="rv-tabla__principal">{{ cita.mascotaNombre }}</span>
                    <span class="rv-tabla__secundario">{{ cita.mascotaEspecie }}</span>
                  </td>
                  <td>
                    <span>{{ cita.clienteNombre }}</span>
                    <span class="rv-tabla__secundario">{{ cita.clienteTelefono }}</span>
                  </td>
                  <td>{{ cita.veterinarioNombre }}</td>
                  <td>{{ cita.motivo }}</td>
                  <td>
                    <EtiquetaEstado :estado="cita.estado" />
                    <span v-if="cita.motivoCancelacion" class="rv-tabla__secundario">
                      {{ cita.motivoCancelacion }}
                    </span>
                  </td>
                  <td>
                    <div class="rv-tabla__acciones">
                      <button
                        v-if="cita.estado === ESTADOS_CITA.PROGRAMADA"
                        type="button"
                        class="rv-boton rv-boton--sm rv-boton--peligro"
                        @click="cancelar(cita)"
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </EstadoCarga>
      </div>
    </article>

    <!-- Modal: agendar -->
    <ModalBase v-if="modalAbierto" titulo="Agendar una cita" ancho="560px" @cerrar="modalAbierto = false">
      <form id="form-cita" @submit.prevent="agendar">
        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="buscar-mascota">Mascota</label>
          <div class="buscador">
            <input
              id="buscar-mascota"
              v-model="busquedaMascota"
              class="rv-input"
              type="search"
              placeholder="Nombre de la mascota o del dueño…"
              @keydown.enter.prevent="buscarMascotas"
            />
            <button
              type="button"
              class="rv-boton rv-boton--contorno"
              :disabled="buscandoMascotas"
              @click="buscarMascotas"
            >
              Buscar
            </button>
          </div>
          <span class="rv-campo__ayuda">Escribe al menos 2 letras y pulsa Buscar.</span>
        </div>

        <div v-if="mascotas.length" class="rv-campo">
          <label class="rv-campo__etiqueta" for="mascota">Resultado</label>
          <select id="mascota" v-model="nueva.mascotaId" class="rv-select" required>
            <option value="" disabled>Elige una mascota</option>
            <option v-for="mascota in mascotas" :key="mascota.id" :value="mascota.id">
              {{ mascota.nombre }} ({{ mascota.especie }}) — {{ mascota.clienteNombre }}
            </option>
          </select>
        </div>

        <div class="rv-rejilla rv-rejilla--2">
          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="vet-nuevo">Veterinario</label>
            <select id="vet-nuevo" v-model="nueva.veterinarioId" class="rv-select" required>
              <option value="" disabled>Elige</option>
              <option v-for="vet in veterinarios" :key="vet.id" :value="vet.id">
                {{ vet.nombre }}
              </option>
            </select>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="fecha-nueva">Fecha</label>
            <input
              id="fecha-nueva"
              v-model="nueva.fecha"
              class="rv-input"
              type="date"
              :min="hoyLima()"
              required
            />
          </div>
        </div>

        <div class="rv-campo">
          <span class="rv-campo__etiqueta">Hora disponible</span>

          <p v-if="cargandoHorarios" class="rv-campo__ayuda">Consultando disponibilidad…</p>
          <p v-else-if="!nueva.veterinarioId" class="rv-campo__ayuda">
            Elige veterinario y fecha para ver los bloques libres.
          </p>
          <p v-else-if="!horarios.length" class="rv-campo__ayuda">
            No hay bloques para ese día.
          </p>

          <div v-else class="horarios">
            <button
              v-for="bloque in horarios"
              :key="bloque.hora"
              type="button"
              class="horario"
              :class="{ 'horario--activo': nueva.hora === bloque.hora }"
              :disabled="!bloque.libre"
              :title="bloque.libre ? 'Disponible' : 'Ocupado'"
              @click="nueva.hora = bloque.hora"
            >
              {{ bloque.hora }}
            </button>
          </div>
        </div>

        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="motivo">Motivo</label>
          <textarea
            id="motivo"
            v-model="nueva.motivo"
            class="rv-textarea"
            placeholder="Consulta general, vacunación, control…"
            required
          ></textarea>
        </div>

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
          form="form-cita"
          class="rv-boton rv-boton--primario"
          :disabled="guardando || !nueva.mascotaId || !nueva.hora"
        >
          {{ guardando ? 'Agendando…' : 'Agendar' }}
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

.horarios {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 0.4rem;
  max-height: 190px;
  overflow-y: auto;
  padding: 0.25rem;
}

.horario {
  padding: 0.45rem 0.2rem;
  border: 1px solid var(--rv-borde-fuerte);
  border-radius: var(--rv-radio-sm);
  background: var(--rv-blanco);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--rv-navy);
  cursor: pointer;
  transition: all var(--rv-transicion);

  &:hover:not(:disabled) {
    border-color: var(--rv-teal);
    background: var(--rv-teal-50);
  }

  &:disabled {
    color: var(--rv-texto-tenue);
    background: var(--rv-superficie-2);
    text-decoration: line-through;
    cursor: not-allowed;
  }

  &--activo {
    background: var(--rv-teal);
    border-color: var(--rv-teal);
    color: #04372e;
  }
}
</style>
