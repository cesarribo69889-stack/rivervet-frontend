<script setup>
import { onMounted, reactive, ref } from 'vue'
import servicioProductos from '../services/productos'
import { mensajeDeError } from '../utils/errores'
import { soles } from '../utils/formato'
import EstadoCarga from '../components/EstadoCarga.vue'
import PaginadorSimple from '../components/PaginadorSimple.vue'

// Vista pública: GET /api/productos y GET /api/categorias son [AllowAnonymous].
const filtros = reactive({
  texto: '',
  categoriaId: '',
  orden: 'nombre',
  soloDisponibles: true,
  pagina: 1,
  limite: 12
})

const productos = ref([])
const paginacion = ref(null)
const categorias = ref([])
const cargando = ref(false)
const error = ref('')

async function cargar(pagina = filtros.pagina) {
  filtros.pagina = pagina
  cargando.value = true
  error.value = ''

  try {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, valor]) => valor !== '' && valor !== null)
    )
    const resultado = await servicioProductos.catalogo(params)
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

onMounted(() => {
  cargar(1)
  cargarCategorias()
})
</script>

<template>
  <div class="tienda">
    <header class="tienda__portada">
      <div class="rv-contenedor">
        <h1>Tienda Rivervet</h1>
        <p>Alimento, accesorios y medicamentos con stock real de la clínica.</p>
      </div>
    </header>

    <div class="rv-contenedor tienda__cuerpo">
      <form class="rv-filtros" @submit.prevent="cargar(1)">
        <div class="rv-campo" style="flex: 1; min-width: 220px">
          <label class="rv-campo__etiqueta" for="buscar-producto">Buscar</label>
          <input
            id="buscar-producto"
            v-model="filtros.texto"
            class="rv-input"
            type="search"
            placeholder="Alimento, antipulgas, juguete…"
          />
        </div>

        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="categoria">Categoría</label>
          <select id="categoria" v-model="filtros.categoriaId" class="rv-select">
            <option value="">Todas</option>
            <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
              {{ categoria.nombre }}
            </option>
          </select>
        </div>

        <div class="rv-campo">
          <label class="rv-campo__etiqueta" for="orden">Ordenar por</label>
          <select id="orden" v-model="filtros.orden" class="rv-select">
            <option value="nombre">Nombre</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="recientes">Más recientes</option>
          </select>
        </div>

        <button type="submit" class="rv-boton rv-boton--marino">Aplicar</button>
      </form>

      <EstadoCarga
        :cargando="cargando"
        :error="error"
        :vacio="productos.length === 0"
        titulo-vacio="Sin productos"
        mensaje-vacio="No encontramos productos con esos filtros."
        @reintentar="cargar(1)"
      >
        <div class="rejilla">
          <article v-for="producto in productos" :key="producto.id" class="producto">
            <div class="producto__imagen">
              <img v-if="producto.imagenUrl" :src="producto.imagenUrl" :alt="producto.nombre" />
              <span v-else aria-hidden="true">🐾</span>
            </div>

            <div class="producto__cuerpo">
              <span class="producto__categoria">{{ producto.categoriaNombre }}</span>
              <h3>{{ producto.nombre }}</h3>
              <p v-if="producto.descripcion">{{ producto.descripcion }}</p>

              <div class="producto__pie">
                <strong>{{ soles(producto.precio) }}</strong>
                <span v-if="!producto.disponible" class="rv-etiqueta rv-etiqueta--error">
                  Sin stock
                </span>
                <span v-else class="rv-etiqueta rv-etiqueta--exito">Disponible</span>
              </div>
            </div>
          </article>
        </div>

        <PaginadorSimple :paginacion="paginacion" @cambiar="cargar" />
      </EstadoCarga>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tienda {
  padding-bottom: 3rem;

  &__portada {
    padding-block: 2.75rem;
    background: linear-gradient(120deg, var(--rv-navy) 0%, var(--rv-navy-700) 100%);
    color: #c9d5ee;
    margin-bottom: 2rem;

    h1 {
      color: var(--rv-blanco);
      margin-bottom: 0.4rem;
    }

    p {
      margin: 0;
    }
  }
}

.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.15rem;
}

.producto {
  display: flex;
  flex-direction: column;
  background: var(--rv-superficie);
  border: 1px solid var(--rv-borde);
  border-radius: var(--rv-radio);
  overflow: hidden;
  transition: transform var(--rv-transicion), box-shadow var(--rv-transicion),
    border-color var(--rv-transicion);

  &:hover {
    transform: translateY(-4px);
    border-color: var(--rv-teal-300);
    box-shadow: var(--rv-sombra);
  }

  &__imagen {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    background: var(--rv-teal-50);
    font-size: 2.5rem;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__cuerpo {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 1rem 1.1rem 1.15rem;
  }

  &__categoria {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--rv-teal-700);
  }

  h3 {
    margin: 0.3rem 0 0.4rem;
    font-size: 1.02rem;
  }

  p {
    margin: 0;
    font-size: 0.88rem;
    color: var(--rv-texto-suave);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__pie {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.9rem;

    strong {
      font-family: var(--rv-fuente-titulo);
      font-size: 1.15rem;
      color: var(--rv-navy);
    }
  }
}
</style>
