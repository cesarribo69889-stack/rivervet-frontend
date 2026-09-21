<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificacionesStore } from '../stores/notificaciones'
import servicioClientes from '../services/clientes'
import { erroresPorCampo, mensajeDeError } from '../utils/errores'
import { GRUPOS } from '../constantes'
import EstadoCarga from '../components/EstadoCarga.vue'
import EtiquetaEstado from '../components/EtiquetaEstado.vue'
import ModalBase from '../components/ModalBase.vue'
import PaginadorSimple from '../components/PaginadorSimple.vue'

const auth = useAuthStore()
const notificaciones = useNotificacionesStore()

const puedeEditar = GRUPOS.ADMIN_O_RECEPCION.includes(auth.rol)

const clientes = ref([])
const paginacion = ref(null)
const cargando = ref(false)
const error = ref('')
const texto = ref('')

async function cargar(pagina = 1) {
  cargando.value = true
  error.value = ''
  try {
    const consulta = { pagina, limite: 10 }
    // Con texto se usa POST /clientes/buscar (el texto no viaja en la URL).
    const resultado = texto.value.trim()
      ? await servicioClientes.buscar({ ...consulta, texto: texto.value.trim() })
      : await servicioClientes.listar(consulta)

    clientes.value = resultado.items
    paginacion.value = resultado.paginacion
  } catch (excepcion) {
    error.value = mensajeDeError(excepcion)
  } finally {
    cargando.value = false
  }
}

// ── Alta y edición ──
const modalAbierto = ref(false)
const editandoId = ref(null)
const guardando = ref(false)
const errorFormulario = ref('')
const erroresCampo = ref({})

const vacio = () => ({
  dni: '',
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  direccion: '',
  consentimientoDatos: false,
  crearCuenta: false,
  password: ''
})

const formulario = reactive(vacio())

function abrirNuevo() {
  Object.assign(formulario, vacio())
  editandoId.value = null
  errorFormulario.value = ''
  erroresCampo.value = {}
  modalAbierto.value = true
}

function abrirEdicion(cliente) {
  Object.assign(formulario, vacio(), {
    dni: cliente.dni,
    nombres: cliente.nombres,
    apellidos: cliente.apellidos,
    email: cliente.email ?? '',
    telefono: cliente.telefono,
    direccion: cliente.direccion ?? ''
  })
  editandoId.value = cliente.id
  errorFormulario.value = ''
  erroresCampo.value = {}
  modalAbierto.value = true
}

async function guardar() {
  guardando.value = true
  errorFormulario.value = ''
  erroresCampo.value = {}

  try {
    if (editandoId.value) {
      // En la edición el backend NO acepta consentimiento ni cuenta:
      // manda solo los campos comunes (el JSON rechaza los que no declara).
      await servicioClientes.actualizar(editandoId.value, {
        dni: formulario.dni,
        nombres: formulario.nombres,
        apellidos: formulario.apellidos,
        email: formulario.email || null,
        telefono: formulario.telefono,
        direccion: formulario.direccion || null
      })
      notificaciones.exito('Cliente actualizado.')
    } else {
      await servicioClientes.crear({
        dni: formulario.dni,
        nombres: formulario.nombres,
        apellidos: formulario.apellidos,
        email: formulario.email || null,
        telefono: formulario.telefono,
        direccion: formulario.direccion || null,
        consentimientoDatos: formulario.consentimientoDatos,
        crearCuenta: formulario.crearCuenta,
        password: formulario.crearCuenta ? formulario.password : null
      })
      notificaciones.exito('Cliente registrado.')
    }

    modalAbierto.value = false
    await cargar(paginacion.value?.pagina ?? 1)
  } catch (excepcion) {
    errorFormulario.value = mensajeDeError(excepcion, 'No se pudo guardar.')
    erroresCampo.value = erroresPorCampo(excepcion)
  } finally {
    guardando.value = false
  }
}

async function eliminar(cliente) {
  const nombre = `${cliente.nombres} ${cliente.apellidos}`
  if (!window.confirm(`¿Eliminar a ${nombre}? Esta acción queda auditada.`)) return

  try {
    await servicioClientes.eliminar(cliente.id)
    notificaciones.exito('Cliente eliminado.')
    await cargar(paginacion.value?.pagina ?? 1)
  } catch (excepcion) {
    notificaciones.error(mensajeDeError(excepcion))
  }
}

onMounted(() => cargar())
</script>

<template>
  <div>
    <header class="rv-pagina-cabecera">
      <div>
        <h1>Clientes</h1>
        <p>Dueños registrados y sus mascotas.</p>
      </div>
      <button v-if="puedeEditar" type="button" class="rv-boton rv-boton--primario" @click="abrirNuevo">
        + Nuevo cliente
      </button>
    </header>

    <form class="rv-filtros" @submit.prevent="cargar(1)">
      <div class="rv-campo" style="flex: 1; min-width: 260px">
        <label class="rv-campo__etiqueta" for="buscar">Buscar</label>
        <input
          id="buscar"
          v-model="texto"
          class="rv-input"
          type="search"
          placeholder="DNI, nombre, apellido o teléfono…"
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
          :vacio="clientes.length === 0"
          titulo-vacio="Sin clientes"
          mensaje-vacio="No se encontraron clientes con ese criterio."
          @reintentar="cargar(1)"
        >
          <div class="rv-tabla-envoltura">
            <table class="rv-tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>DNI</th>
                  <th>Contacto</th>
                  <th>Mascotas</th>
                  <th>Cuenta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cliente in clientes" :key="cliente.id">
                  <td>
                    <span class="rv-tabla__principal">
                      {{ cliente.nombres }} {{ cliente.apellidos }}
                    </span>
                    <span v-if="cliente.direccion" class="rv-tabla__secundario">
                      {{ cliente.direccion }}
                    </span>
                  </td>
                  <td>{{ cliente.dni }}</td>
                  <td>
                    <span>{{ cliente.telefono }}</span>
                    <span class="rv-tabla__secundario">{{ cliente.email ?? 'Sin correo' }}</span>
                  </td>
                  <td>{{ cliente.totalMascotas ?? '—' }}</td>
                  <td>
                    <EtiquetaEstado
                      :tono="cliente.tieneCuenta ? 'exito' : 'neutro'"
                      :texto="cliente.tieneCuenta ? 'Con acceso web' : 'Sin cuenta'"
                    />
                  </td>
                  <td>
                    <div class="rv-tabla__acciones">
                      <button
                        v-if="puedeEditar"
                        type="button"
                        class="rv-boton rv-boton--sm rv-boton--contorno"
                        @click="abrirEdicion(cliente)"
                      >
                        Editar
                      </button>
                      <button
                        v-if="auth.esAdmin"
                        type="button"
                        class="rv-boton rv-boton--sm rv-boton--peligro"
                        @click="eliminar(cliente)"
                      >
                        Eliminar
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

    <ModalBase
      v-if="modalAbierto"
      :titulo="editandoId ? 'Editar cliente' : 'Nuevo cliente'"
      ancho="600px"
      @cerrar="modalAbierto = false"
    >
      <form id="form-cliente" novalidate @submit.prevent="guardar">
        <div class="rv-rejilla rv-rejilla--2">
          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="dni">DNI</label>
            <input id="dni" v-model.trim="formulario.dni" class="rv-input" maxlength="8" required />
            <span v-if="erroresCampo.dni" class="rv-campo__error">{{ erroresCampo.dni }}</span>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="telefono">Teléfono</label>
            <input
              id="telefono"
              v-model.trim="formulario.telefono"
              class="rv-input"
              placeholder="9XXXXXXXX"
              required
            />
            <span v-if="erroresCampo.telefono" class="rv-campo__error">
              {{ erroresCampo.telefono }}
            </span>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="nombres">Nombres</label>
            <input id="nombres" v-model.trim="formulario.nombres" class="rv-input" required />
            <span v-if="erroresCampo.nombres" class="rv-campo__error">
              {{ erroresCampo.nombres }}
            </span>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="apellidos">Apellidos</label>
            <input id="apellidos" v-model.trim="formulario.apellidos" class="rv-input" required />
            <span v-if="erroresCampo.apellidos" class="rv-campo__error">
              {{ erroresCampo.apellidos }}
            </span>
          </div>
        </div>

        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="email-cliente">Correo (opcional)</label>
          <input
            id="email-cliente"
            v-model.trim="formulario.email"
            class="rv-input"
            type="email"
          />
          <span v-if="erroresCampo.email" class="rv-campo__error">{{ erroresCampo.email }}</span>
        </div>

        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="direccion">Dirección (opcional)</label>
          <input id="direccion" v-model.trim="formulario.direccion" class="rv-input" />
        </div>

        <!-- Solo en el alta: consentimiento (Ley 29733) y cuenta web. -->
        <template v-if="!editandoId">
          <label class="casilla">
            <input v-model="formulario.consentimientoDatos" type="checkbox" />
            <span>
              El cliente autoriza el tratamiento de sus datos personales
              (Ley N.° 29733). Obligatorio para registrarlo.
            </span>
          </label>

          <label class="casilla">
            <input v-model="formulario.crearCuenta" type="checkbox" />
            <span>Crear también su acceso web (necesita correo y contraseña).</span>
          </label>

          <div v-if="formulario.crearCuenta" class="rv-campo">
            <label class="rv-campo__etiqueta" for="password-cliente">Contraseña</label>
            <input
              id="password-cliente"
              v-model="formulario.password"
              class="rv-input"
              type="password"
              autocomplete="new-password"
            />
            <span class="rv-campo__ayuda">
              Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.
            </span>
            <span v-if="erroresCampo.password" class="rv-campo__error">
              {{ erroresCampo.password }}
            </span>
          </div>
        </template>

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
          form="form-cliente"
          class="rv-boton rv-boton--primario"
          :disabled="guardando"
        >
          {{ guardando ? 'Guardando…' : 'Guardar' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<style scoped lang="scss">
.casilla {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin-bottom: 0.9rem;
  font-size: 0.9rem;
  color: var(--rv-texto-suave);
  cursor: pointer;

  input {
    margin-top: 3px;
    accent-color: var(--rv-teal-600);
    width: 16px;
    height: 16px;
  }
}
</style>
