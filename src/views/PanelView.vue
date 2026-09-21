<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import servicioIndicadores from '../services/indicadores'
import servicioCitas from '../services/citas'
import { mensajeDeError } from '../utils/errores'
import { cantidad, diaLima, fechaHoraLima, hoyLima, soles } from '../utils/formato'
import { ESTADOS_CITA, NOMBRE_ROL } from '../constantes'
import TarjetaIndicador from '../components/TarjetaIndicador.vue'
import EtiquetaEstado from '../components/EtiquetaEstado.vue'
import EstadoCarga from '../components/EstadoCarga.vue'

const auth = useAuthStore()

// ── Indicadores del negocio (GET /api/indicadores, solo admin) ──
const indicadores = ref(null)
const cargandoIndicadores = ref(false)
const errorIndicadores = ref('')

async function cargarIndicadores() {
  if (!auth.esAdmin) return

  cargandoIndicadores.value = true
  errorIndicadores.value = ''
  try {
    // Sin fechas el backend usa del día 1 del mes hasta hoy (hora de Lima).
    indicadores.value = await servicioIndicadores.obtener()
  } catch (error) {
    errorIndicadores.value = mensajeDeError(error)
  } finally {
    cargandoIndicadores.value = false
  }
}

// ── Próximas citas (GET /api/citas). Un cliente solo ve las de sus mascotas. ──
const citas = ref([])
const cargandoCitas = ref(false)
const errorCitas = ref('')

async function cargarCitas() {
  cargandoCitas.value = true
  errorCitas.value = ''
  try {
    const resultado = await servicioCitas.listar({
      desde: hoyLima(),
      hasta: diaLima(7),
      estado: ESTADOS_CITA.PROGRAMADA
    })
    // El listado viene paginado: { items, paginacion }.
    citas.value = (resultado.items ?? resultado).slice(0, 6)
  } catch (error) {
    errorCitas.value = mensajeDeError(error)
  } finally {
    cargandoCitas.value = false
  }
}

function recargar() {
  cargarIndicadores()
  cargarCitas()
}

onMounted(recargar)
</script>

<template>
  <div class="panel">
    <header class="saludo">
      <div>
        <h1>Hola, {{ auth.nombre.split(' ')[0] }} 👋</h1>
        <p>
          Sesión iniciada como <strong>{{ NOMBRE_ROL[auth.rol] }}</strong>.
          Esto es lo que pasa hoy en la clínica.
        </p>
      </div>
      <button type="button" class="rv-boton rv-boton--contorno rv-boton--sm" @click="recargar">
        Actualizar
      </button>
    </header>

    <!-- ── Indicadores (solo admin) ── -->
    <section v-if="auth.esAdmin" class="bloque">
      <h2 class="bloque__titulo">Indicadores del mes</h2>

      <EstadoCarga
        :cargando="cargandoIndicadores"
        :error="errorIndicadores"
        :vacio="!indicadores"
        titulo-vacio="Sin datos"
        mensaje-vacio="Aún no hay movimientos en este periodo."
        @reintentar="cargarIndicadores"
      >
        <div class="rv-rejilla rv-rejilla--4">
          <TarjetaIndicador
            titulo="Ventas cobradas"
            :valor="soles(indicadores.ventas.total)"
            :detalle="`${cantidad(indicadores.ventas.pedidos)} pedidos · ticket ${soles(indicadores.ventas.ticketPromedio)}`"
            icono="💰"
          />
          <TarjetaIndicador
            titulo="Citas atendidas"
            :valor="cantidad(indicadores.citas.atendidas)"
            :detalle="`${cantidad(indicadores.citas.programadas)} programadas · ${cantidad(indicadores.citas.canceladas)} canceladas`"
            icono="🩺"
            tono="marino"
          />
          <TarjetaIndicador
            titulo="Clientes nuevos"
            :valor="cantidad(indicadores.clientesNuevos)"
            :detalle="`Del ${indicadores.desde} al ${indicadores.hasta}`"
            icono="👥"
            tono="cielo"
          />
          <TarjetaIndicador
            titulo="Por cobrar"
            :valor="cantidad(indicadores.ventas.pendientesDeCobro)"
            detalle="Pedidos esperando pago o verificación"
            icono="⏳"
            tono="aviso"
          />
        </div>

        <div class="rv-rejilla rv-rejilla--2 bloque__doble">
          <article class="rv-tarjeta">
            <header class="rv-tarjeta__cabecera"><h3>Stock bajo</h3></header>
            <div class="rv-tabla-envoltura">
              <table v-if="indicadores.productosStockBajo.length" class="rv-tabla">
                <thead>
                  <tr><th>Producto</th><th>Stock</th><th>Mínimo</th></tr>
                </thead>
                <tbody>
                  <tr v-for="producto in indicadores.productosStockBajo" :key="producto.id">
                    <td>
                      <span class="rv-tabla__principal">{{ producto.nombre }}</span>
                      <span class="rv-tabla__secundario">{{ producto.sku }}</span>
                    </td>
                    <td><EtiquetaEstado tono="error" :texto="String(producto.stock)" /></td>
                    <td>{{ producto.stockMinimo }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="rv-vacio">Todo el inventario está por encima del mínimo.</p>
            </div>
          </article>

          <article class="rv-tarjeta">
            <header class="rv-tarjeta__cabecera"><h3>Más vendidos</h3></header>
            <div class="rv-tabla-envoltura">
              <table v-if="indicadores.productosMasVendidos.length" class="rv-tabla">
                <thead>
                  <tr><th>Producto</th><th>Unidades</th><th>Monto</th></tr>
                </thead>
                <tbody>
                  <tr v-for="producto in indicadores.productosMasVendidos" :key="producto.productoId">
                    <td class="rv-tabla__principal">{{ producto.nombre }}</td>
                    <td>{{ cantidad(producto.cantidad) }}</td>
                    <td>{{ soles(producto.monto) }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="rv-vacio">Sin ventas en el periodo.</p>
            </div>
          </article>
        </div>
      </EstadoCarga>
    </section>

    <!-- ── Próximas citas (todos los roles) ── -->
    <section class="bloque">
      <div class="bloque__cabecera">
        <h2 class="bloque__titulo">Próximas citas</h2>
        <router-link :to="{ name: 'citas' }" class="rv-boton rv-boton--sm rv-boton--contorno">
          Ver todas
        </router-link>
      </div>

      <article class="rv-tarjeta">
        <div class="rv-tarjeta__cuerpo">
          <EstadoCarga
            :cargando="cargandoCitas"
            :error="errorCitas"
            :vacio="citas.length === 0"
            titulo-vacio="Sin citas programadas"
            mensaje-vacio="No hay citas para los próximos 7 días."
            @reintentar="cargarCitas"
          >
            <ul class="citas">
              <li v-for="cita in citas" :key="cita.id" class="cita">
                <div class="cita__fecha">
                  <strong>{{ fechaHoraLima(cita.fechaHoraLima).split(',')[1] }}</strong>
                  <small>{{ fechaHoraLima(cita.fechaHoraLima).split(',')[0] }}</small>
                </div>
                <div class="cita__datos">
                  <span class="rv-tabla__principal">
                    {{ cita.mascotaNombre }} · {{ cita.mascotaEspecie }}
                  </span>
                  <span class="rv-tabla__secundario">
                    {{ cita.clienteNombre }} — {{ cita.motivo }}
                  </span>
                </div>
                <div class="cita__vet">
                  <span class="rv-tabla__secundario">{{ cita.veterinarioNombre }}</span>
                  <EtiquetaEstado :estado="cita.estado" />
                </div>
              </li>
            </ul>
          </EstadoCarga>
        </div>
      </article>
    </section>

    <!-- ── Accesos rápidos ── -->
    <section class="bloque">
      <h2 class="bloque__titulo">Accesos rápidos</h2>
      <div class="rv-rejilla rv-rejilla--4">
        <router-link :to="{ name: 'citas' }" class="acceso">
          <span aria-hidden="true">📅</span> Agenda de citas
        </router-link>
        <router-link :to="{ name: 'mascotas' }" class="acceso">
          <span aria-hidden="true">🐾</span> Mascotas
        </router-link>
        <router-link v-if="auth.esPersonal" :to="{ name: 'clientes' }" class="acceso">
          <span aria-hidden="true">👥</span> Clientes
        </router-link>
        <router-link :to="{ name: 'tienda' }" class="acceso">
          <span aria-hidden="true">🛍️</span> Tienda
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.saludo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.75rem;

  h1 {
    margin: 0;
    font-size: 1.7rem;
  }

  p {
    margin: 0.3rem 0 0;
    color: var(--rv-texto-suave);
  }

  strong {
    color: var(--rv-teal-700);
  }
}

.bloque {
  margin-bottom: 2rem;

  &__titulo {
    font-size: 1.05rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--rv-texto-suave);
    margin-bottom: 0.9rem;
  }

  &__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__doble {
    margin-top: 1rem;
  }
}

.citas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.cita {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--rv-borde);

  &:last-child {
    border-bottom: none;
  }

  &__fecha {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 92px;
    padding: 0.5rem;
    border-radius: var(--rv-radio-sm);
    background: var(--rv-teal-50);

    strong {
      font-family: var(--rv-fuente-titulo);
      font-size: 1.05rem;
      color: var(--rv-navy);
    }

    small {
      font-size: 0.75rem;
      color: var(--rv-texto-suave);
    }
  }

  &__datos {
    flex: 1;
    min-width: 0;
  }

  &__vet {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
    text-align: right;
  }
}

.acceso {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem 1.15rem;
  background: var(--rv-superficie);
  border: 1px solid var(--rv-borde);
  border-radius: var(--rv-radio);
  font-weight: 600;
  color: var(--rv-navy);
  transition: border-color var(--rv-transicion), transform var(--rv-transicion);

  &:hover {
    border-color: var(--rv-teal);
    transform: translateY(-2px);
    color: var(--rv-teal-700);
  }
}

@media (max-width: 640px) {
  .cita {
    flex-wrap: wrap;
  }

  .cita__vet {
    align-items: flex-start;
    text-align: left;
  }
}
</style>
