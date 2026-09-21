<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotificacionesStore } from '../stores/notificaciones'
import servicioProductos from '../services/productos'
import { mensajeDeError } from '../utils/errores'
import { cantidad, soles } from '../utils/formato'
import EstadoCarga from '../components/EstadoCarga.vue'
import EtiquetaEstado from '../components/EtiquetaEstado.vue'
import ModalBase from '../components/ModalBase.vue'
import PaginadorSimple from '../components/PaginadorSimple.vue'

const auth = useAuthStore()
const notificaciones = useNotificacionesStore()

const filtros = reactive({
  texto: '',
  categoriaId: '',
  soloStockBajo: false,
  incluirInactivos: false,
  pagina: 1,
  limite: 10
})

const productos = ref([])
const paginacion = ref(null)
const categorias = ref([])
const cargando = ref(false)
const error = ref('')

async function cargar(pagina = 1) {
  filtros.pagina = pagina
  cargando.value = true
  error.value = ''

  try {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => valor !== '' && valor !== null)
    )
    const resultado = await servicioProductos.inventario(params)
    productos.value = resultado.items
    paginacion.value = resultado.paginacion
  } catch (excepcion) {
    error.value = mensajeDeError(excepcion)
  } finally {
    cargando.value = false
  }
}

async function cargarCategorias() {
  try {
    categorias.value = await servicioProductos.categorias()
  } catch {
    categorias.value = []
  }
}

// ── Ajuste de stock (POST /api/productos/{id}/stock, solo admin) ──
const modalAbierto = ref(false)
const productoActivo = ref(null)
const guardando = ref(false)
const errorFormulario = ref('')
// El DTO del backend (AjusteStockSolicitud) solo acepta `cantidad` y `motivo`:
// la cantidad lleva SIGNO (+ repone, - descuenta). Cualquier campo de más
// (por ejemplo "tipo") hace que la API responda 422: el JSON es lista blanca.
const ajuste = reactive({ unidades: 1, movimiento: 'entrada', motivo: '' })

function abrirAjuste(producto) {
  productoActivo.value = producto
  Object.assign(ajuste, { unidades: 1, movimiento: 'entrada', motivo: '' })
  errorFormulario.value = ''
  modalAbierto.value = true
}

async function guardarAjuste() {
  guardando.value = true
  errorFormulario.value = ''

  const signo = ajuste.movimiento === 'salida' ? -1 : 1

  try {
    await servicioProductos.ajustarStock(productoActivo.value.id, {
      cantidad: signo * Math.abs(Number(ajuste.unidades)),
      motivo: ajuste.motivo
    })
    notificaciones.exito('Stock actualizado.')
    modalAbierto.value = false
    await cargar(paginacion.value?.pagina ?? 1)
  } catch (excepcion) {
    errorFormulario.value = mensajeDeError(excepcion, 'No se pudo ajustar el stock.')
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargar(1)
  cargarCategorias()
})
</script>

<template>
  <div>
    <header class="rv-pagina-cabecera">
      <div>
        <h1>Inventario</h1>
        <p>Stock real de la tienda y la farmacia.</p>
      </div>
    </header>

    <form class="rv-filtros" @submit.prevent="cargar(1)">
      <div class="rv-campo" style="flex: 1; min-width: 220px">
        <label class="rv-campo__etiqueta" for="buscar-inv">Buscar</label>
        <input id="buscar-inv" v-model="filtros.texto" class="rv-input" type="search" placeholder="SKU o nombre…" />
      </div>

      <div class="rv-campo">
        <label class="rv-campo__etiqueta" for="cat-inv">Categoría</label>
        <select id="cat-inv" v-model="filtros.categoriaId" class="rv-select">
          <option value="">Todas</option>
          <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
            {{ categoria.nombre }}
          </option>
        </select>
      </div>

      <label class="casilla">
        <input v-model="filtros.soloStockBajo" type="checkbox" />
        <span>Solo stock bajo</span>
      </label>

      <label class="casilla">
        <input v-model="filtros.incluirInactivos" type="checkbox" />
        <span>Incluir inactivos</span>
      </label>

      <button type="submit" class="rv-boton rv-boton--marino">Aplicar</button>
    </form>

    <article class="rv-tarjeta">
      <div class="rv-tarjeta__cuerpo">
        <EstadoCarga
          :cargando="cargando"
          :error="error"
          :vacio="productos.length === 0"
          titulo-vacio="Sin productos"
          mensaje-vacio="No hay productos con esos filtros."
          @reintentar="cargar(1)"
        >
          <div class="rv-tabla-envoltura">
            <table class="rv-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="producto in productos" :key="producto.id">
                  <td>
                    <span class="rv-tabla__principal">{{ producto.nombre }}</span>
                    <span class="rv-tabla__secundario">{{ producto.sku }}</span>
                  </td>
                  <td>{{ producto.categoriaNombre }}</td>
                  <td>{{ soles(producto.precio) }}</td>
                  <td>
                    <strong :class="{ bajo: producto.stockBajo }">
                      {{ cantidad(producto.stock) }}
                    </strong>
                  </td>
                  <td>{{ producto.stockMinimo }}</td>
                  <td>
                    <EtiquetaEstado
                      v-if="!producto.activo"
                      tono="neutro"
                      texto="Inactivo"
                    />
                    <EtiquetaEstado
                      v-else-if="producto.stockBajo"
                      tono="aviso"
                      texto="Reponer"
                    />
                    <EtiquetaEstado v-else tono="exito" texto="En stock" />
                  </td>
                  <td>
                    <div class="rv-tabla__acciones">
                      <button
                        v-if="auth.esAdmin"
                        type="button"
                        class="rv-boton rv-boton--sm rv-boton--contorno"
                        @click="abrirAjuste(producto)"
                      >
                        Ajustar stock
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
      :titulo="`Ajustar stock · ${productoActivo.nombre}`"
      @cerrar="modalAbierto = false"
    >
      <p class="rv-aviso">
        <span>
          Stock actual: <strong>{{ cantidad(productoActivo.stock) }}</strong> unidades
          (mínimo {{ productoActivo.stockMinimo }}).
        </span>
      </p>

      <form id="form-stock" novalidate @submit.prevent="guardarAjuste">
        <div class="rv-rejilla rv-rejilla--2">
          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="movimiento">Movimiento</label>
            <select id="movimiento" v-model="ajuste.movimiento" class="rv-select">
              <option value="entrada">Entrada (reponer)</option>
              <option value="salida">Salida (descontar)</option>
            </select>
          </div>

          <div class="rv-campo">
            <label class="rv-campo__etiqueta" for="unidades">Unidades</label>
            <input
              id="unidades"
              v-model="ajuste.unidades"
              class="rv-input"
              type="number"
              min="1"
              max="10000"
              required
            />
          </div>
        </div>

        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="motivo-stock">Motivo</label>
          <textarea
            id="motivo-stock"
            v-model.trim="ajuste.motivo"
            class="rv-textarea"
            placeholder="Compra a proveedor, merma, corrección de conteo…"
            maxlength="250"
            required
          ></textarea>
          <span class="rv-campo__ayuda">Queda registrado en la auditoría del sistema.</span>
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
          form="form-stock"
          class="rv-boton rv-boton--primario"
          :disabled="guardando || !ajuste.motivo"
        >
          {{ guardando ? 'Guardando…' : 'Aplicar ajuste' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<style scoped lang="scss">
.casilla {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--rv-texto-suave);
  cursor: pointer;
  padding-bottom: 0.65rem;

  input {
    accent-color: var(--rv-teal-600);
    width: 16px;
    height: 16px;
  }
}

.bajo {
  color: var(--rv-error);
}
</style>
