import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { API_URL, ESTADO_PAGO, ESTADO_PEDIDO, METODO_PAGO, ROLES } from '../core/constants';
import { fechaUtc, mensajeDeError, soles } from '../core/helpers';
import { ToastService } from '../core/toast.service';

type Pestana = 'pedidos' | 'verificar';
type Metodo = '' | 'yape' | 'tarjeta';

// HU-016 pedidos, HU-017 Yape, HU-019 pasarela, HU-020 comprobante.
//
// Cliente: sus pedidos y su estado; si esta pendiente de pago, elige Yape o
// tarjeta. Admin y recepcion: todos los pedidos, cobro en efectivo, entrega,
// verificacion de Yapes y comprobante por WhatsApp.
//
// Reglas que impone la API (los botones las siguen para no ofrecer acciones
// que terminarian en 409): pagar, solo "pendiente_pago"; cancelar,
// "pendiente_pago" (el personal tambien "pendiente_verificacion"); entregar,
// solo "pagado"; comprobante, "pagado" o "entregado".
@Component({selector:'app-pedidos',standalone:true,imports:[FormsModule,RouterLink],template:`
<header class="rv-pagina-cabecera"><div><h1>{{esCliente?'Mis pedidos':'Pedidos'}}</h1><p>{{esCliente?'El estado de tus compras y pagos.':'Ventas, cobros, verificación de pagos y entregas.'}}</p></div>@if(esCliente){<a routerLink="/tienda" class="rv-boton rv-boton--contorno">Ir a la tienda</a>}</header>

@if(!esCliente){<div class="pestanas">
  <button type="button" [class.activa]="pestana()==='pedidos'" (click)="pestana.set('pedidos')">Pedidos</button>
  <button type="button" [class.activa]="pestana()==='verificar'" (click)="irAVerificar()">Pagos por verificar @if(porVerificar().length){<span class="contador">{{porVerificar().length}}</span>}</button>
</div>}

@if(pestana()==='pedidos'){
  <form class="rv-filtros" (ngSubmit)="cargar(1)"><label>Estado<select class="rv-select" name="estado" [(ngModel)]="filtroEstado" (change)="cargar(1)"><option value="">Todos</option>@for(e of estados;track e){<option [value]="e">{{nombreEstado[e]}}</option>}</select></label></form>
  @if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
  @if(cargando()){<p>Cargando pedidos…</p>}@else{<div class="rv-tabla-wrap rv-panel"><table class="rv-tabla"><thead><tr><th>Pedido</th><th>Fecha</th>@if(!esCliente){<th>Cliente</th><th>Canal</th>}<th>Productos</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>
    @for(p of pedidos();track p.id){<tr><td><strong>{{p.codigo}}</strong></td><td>{{fechaUtc(p.creadoEn)}}</td>@if(!esCliente){<td>{{p.clienteNombre}}</td><td>{{p.canal==='web'?'Web':'Presencial'}}</td>}<td>{{p.cantidadItems}}</td><td>{{soles(p.total)}}</td><td><span class="estado-pedido estado--{{p.estado}}">{{nombreEstado[p.estado]||p.estado}}</span></td><td><button class="rv-boton rv-boton--sm rv-boton--contorno" (click)="abrir(p.id)">{{esCliente&&p.estado==='pendiente_pago'?'Pagar':'Ver'}}</button></td></tr>}
    @empty{<tr><td [attr.colspan]="esCliente?6:8" class="rv-vacio">No hay pedidos.</td></tr>}
  </tbody></table></div>}
  @if(paginacion()?.totalPaginas>1){<div class="paginas"><button class="rv-boton rv-boton--sm rv-boton--contorno" [disabled]="pagina<=1" (click)="cargar(pagina-1)">Anterior</button><span>Página {{pagina}} de {{paginacion().totalPaginas}}</span><button class="rv-boton rv-boton--sm rv-boton--contorno" [disabled]="pagina>=paginacion().totalPaginas" (click)="cargar(pagina+1)">Siguiente</button></div>}
}

<!-- HU-017: recepcion confirma que el Yape llego a la cuenta del negocio. -->
@if(pestana()==='verificar'){
  @if(errorVerificar()){<p class="rv-aviso rv-aviso--error">{{errorVerificar()}}</p>}
  <div class="rv-tabla-wrap rv-panel"><table class="rv-tabla"><thead><tr><th>Pedido</th><th>Cliente</th><th>Monto</th><th>N.º de operación</th><th>Registrado</th><th></th></tr></thead><tbody>
    @for(v of porVerificar();track v.pagoId){<tr><td><button type="button" class="enlace" (click)="abrir(v.pedidoId)">{{v.pedidoCodigo}}</button></td><td>{{v.clienteNombre}}</td><td>{{soles(v.monto)}}</td><td><code>{{v.codigoOperacion}}</code></td><td>{{fechaUtc(v.creadoEn)}}</td><td><div class="rv-acciones"><button class="rv-boton rv-boton--sm rv-boton--primario" (click)="verificar(v.pagoId,true)" [disabled]="ocupado()">Llegó</button><button class="rv-boton rv-boton--sm" (click)="pedirRechazo(v.pagoId)" [disabled]="ocupado()">No llegó</button></div></td></tr>}
    @empty{<tr><td colspan="6" class="rv-vacio">No hay pagos por verificar.</td></tr>}
  </tbody></table></div>
  <p class="nota">Antes de aprobar, revisa en la app Yape del negocio que el número de operación y el monto coincidan.</p>
}

@if(rechazandoPago()!==null){<div class="rv-modal-fondo capa-2" (click)="rechazandoPago.set(null)"><form class="rv-modal" (click)="$event.stopPropagation()" (ngSubmit)="verificar(rechazandoPago()!,false)">
  <div class="rv-modal__cabecera"><h2>Rechazar pago</h2><button type="button" (click)="rechazandoPago.set(null)">×</button></div>
  <p>El pedido volverá a quedar pendiente de pago para que el cliente lo intente de nuevo.</p>
  <label class="rv-campo">¿Por qué se rechaza?<textarea class="rv-input" name="obs" [(ngModel)]="observacionRechazo" required maxlength="250" rows="2" placeholder="Ej.: el número de operación no aparece en Yape"></textarea></label>
  <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="rechazandoPago.set(null)">Volver</button><button class="rv-boton" [disabled]="ocupado()||!observacionRechazo.trim()">Rechazar pago</button></div>
</form></div>}

@if(detalle(); as p){<div class="rv-modal-fondo" (click)="cerrar()"><div class="rv-modal ancho-pedido" (click)="$event.stopPropagation()">
  <div class="rv-modal__cabecera"><h2>Pedido {{p.codigo}}</h2><button type="button" (click)="cerrar()">×</button></div>
  <span class="estado-pedido estado--{{p.estado}}">{{nombreEstado[p.estado]||p.estado}}</span>
  <p class="meta">{{fechaUtc(p.creadoEn)}}@if(!esCliente){ · {{p.clienteNombre}} · {{p.canal==='web'?'Venta web':'Venta presencial'}}}@if(p.registradoPorNombre){ · Registró {{p.registradoPorNombre}}}</p>

  <table class="rv-tabla items"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>
    @for(i of p.items;track i.productoId){<tr><td>{{i.nombre}}</td><td>{{i.cantidad}}</td><td>{{soles(i.precioUnitario)}}</td><td>{{soles(i.subtotal)}}</td></tr>}
  </tbody><tfoot><tr><td colspan="3">Total</td><td><strong>{{soles(p.total)}}</strong></td></tr></tfoot></table>

  @if(p.pagos?.length){<h3>Pagos</h3>@for(g of p.pagos;track g.id){<div class="pago"><div><strong>{{metodo[g.metodo]||g.metodo}} · {{soles(g.monto)}}</strong><small>{{fechaUtc(g.creadoEn)}}@if(g.codigoOperacion){ · Operación {{g.codigoOperacion}}}@if(g.verificadoPorNombre){ · Verificó {{g.verificadoPorNombre}}}</small></div><span class="estado-pago pago--{{g.estado}}">{{estadoPago[g.estado]||g.estado}}</span>
    @if(!esCliente&&g.estado==='pendiente_verificacion'){<div class="rv-acciones"><button class="rv-boton rv-boton--sm rv-boton--primario" (click)="verificar(g.id,true)" [disabled]="ocupado()">Llegó</button><button class="rv-boton rv-boton--sm" (click)="pedirRechazo(g.id)" [disabled]="ocupado()">No llegó</button></div>}
  </div>}}

  <!-- Cliente: pagar (HU-017 Yape, HU-019 tarjeta). -->
  @if(esCliente&&p.estado==='pendiente_pago'){<section class="pagar"><h3>¿Cómo quieres pagar?</h3>
    <div class="metodos"><button type="button" [class.activo]="metodoElegido()==='yape'" (click)="elegirYape()">Yape</button><button type="button" [class.activo]="metodoElegido()==='tarjeta'" (click)="metodoElegido.set('tarjeta')">Tarjeta</button></div>
    @if(metodoElegido()==='yape'){
      @if(yape(); as y){<div class="yape">
        @if(y.tieneQr&&mostrarQr()){<img class="qr" [src]="qrYape(y)" alt="Código QR de Yape de RiverVet" (error)="mostrarQr.set(false)">}
        <div><p class="monto">Paga {{soles(p.total)}}</p><p>Yapea al <strong>{{y.celular}}</strong>@if(y.titular){ a nombre de {{y.titular}}}</p><ol>@for(i of y.instrucciones;track $index){<li>{{i}}</li>}</ol></div>
      </div>
      <form class="sub" (ngSubmit)="pagarYape()"><label class="rv-campo">Número de operación<input class="rv-input" name="codigo" [(ngModel)]="codigoOperacion" required maxlength="30" placeholder="Aparece en tu constancia de Yape"></label><button class="rv-boton rv-boton--primario" [disabled]="ocupado()||!codigoOperacion.trim()">Ya pagué, registrar</button></form>}
      @else if(errorYape()){<p class="rv-aviso rv-aviso--aviso">{{errorYape()}} Puedes pagar en la clínica.</p>}
      @else{<p>Cargando datos de Yape…</p>}
    }
    @if(metodoElegido()==='tarjeta'){<p class="nota">Te llevaremos a la página segura de la pasarela de pagos: los datos de tu tarjeta nunca pasan por RiverVet.</p><button type="button" class="rv-boton rv-boton--primario" (click)="pagarConTarjeta()" [disabled]="ocupado()">Pagar {{soles(p.total)}} con tarjeta</button>}
  </section>}
  @if(esCliente&&p.estado==='pendiente_verificacion'){<p class="rv-aviso rv-aviso--aviso">Recibimos tu número de operación. Recepción está confirmando el pago.</p>}
  @if(esCliente&&p.estado==='pagado'){<p class="rv-aviso rv-aviso--exito">Pago confirmado. Puedes recoger tu pedido en la clínica.</p>}

  <!-- Personal: cobrar, entregar y comprobante (HU-020). -->
  @if(!esCliente){<div class="rv-acciones acciones">
    @if(p.estado==='pendiente_pago'){<button type="button" class="rv-boton rv-boton--primario" (click)="cobrarEfectivo()" [disabled]="ocupado()">Cobrar en efectivo</button>}
    @if(p.estado==='pagado'){<button type="button" class="rv-boton rv-boton--primario" (click)="entregar()" [disabled]="ocupado()">Marcar entregado</button>}
    @if(p.estado==='pagado'||p.estado==='entregado'){<button type="button" class="rv-boton rv-boton--contorno" (click)="abrirComprobante()">Enviar comprobante por WhatsApp</button>}
  </div>}
  @if(panelComprobante()){<form class="sub" (ngSubmit)="enviarComprobante()">
    @if(!comprobante()){<label class="rv-campo">Celular (opcional)<input class="rv-input" name="tel" [(ngModel)]="telefonoComprobante" maxlength="9" placeholder="Por defecto, el de la ficha del cliente"></label>
      <p class="nota">El mensaje lleva solo el código del pedido, el total y la fecha: nada de productos ni datos personales.</p>
      <button class="rv-boton rv-boton--primario" [disabled]="ocupado()">Preparar mensaje</button>}
    @else{<p class="mensaje">“{{comprobante().mensaje}}”</p><p class="nota">Para {{comprobante().telefono}}.</p>
      @if(comprobante().enlace){<a class="rv-boton rv-boton--primario" [href]="comprobante().enlace" target="_blank" rel="noopener">Abrir WhatsApp y enviar</a>}@else{<p class="rv-aviso rv-aviso--exito">Comprobante enviado.</p>}}
  </form>}

  @if(puedeCancelar(p)){@if(!panelCancelar()){<button type="button" class="cancelar" (click)="panelCancelar.set(true)">Cancelar pedido</button>}@else{<form class="sub" (ngSubmit)="cancelar()">
    <label class="rv-campo">Motivo de la cancelación<textarea class="rv-input" name="motivo" [(ngModel)]="motivoCancelacion" required maxlength="250" rows="2"></textarea></label>
    <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="panelCancelar.set(false)">Volver</button><button class="rv-boton" [disabled]="ocupado()||!motivoCancelacion.trim()">Sí, cancelar pedido</button></div>
  </form>}}
  @if(errorDetalle()){<p class="rv-aviso rv-aviso--error">{{errorDetalle()}}</p>}
</div></div>}`,
styles:[`.pestanas{display:inline-flex;margin-bottom:1rem;padding:.25rem;border:1px solid var(--rv-borde);border-radius:12px;background:white}
.pestanas button{display:flex;align-items:center;gap:.4rem;padding:.45rem .9rem;border:0;border-radius:9px;background:none;color:var(--rv-texto-suave);font-weight:700;cursor:pointer}.pestanas button.activa{background:var(--rv-navy);color:white}
.contador{display:grid;place-items:center;min-width:1.3rem;height:1.3rem;padding:0 .3rem;border-radius:999px;background:var(--rv-teal);color:#073d35;font-size:.72rem}
.paginas{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1.2rem}
.estado-pedido,.estado-pago{display:inline-flex;padding:.22rem .65rem;border:1px solid;border-radius:999px;color:var(--rv-navy);font-size:.75rem;font-weight:700;white-space:nowrap}
.estado--pendiente_pago,.pago--pendiente{background:#fff4e0;border-color:#d98a12}
.estado--pendiente_verificacion,.pago--pendiente_verificacion{background:#e8f1ff;border-color:#2f6fdb}
.estado--pagado,.estado--entregado,.pago--aprobado{background:#e6f7f1;border-color:#1f9d74}
.estado--cancelado,.pago--rechazado{background:#f1f2f5;border-color:#9aa3b2}
.enlace{padding:0;border:0;background:none;color:var(--rv-navy);font-weight:800;text-decoration:underline;cursor:pointer}
.nota{color:var(--rv-texto-suave);font-size:.8rem}
.ancho-pedido{width:min(760px,100%)}.meta{margin:.6rem 0 1rem;color:var(--rv-texto-suave);font-size:.85rem}
.items tfoot td{border-bottom:0;font-weight:700}
h3{margin:1.3rem 0 .6rem;font-size:1rem}
.pago{display:flex;flex-wrap:wrap;align-items:center;gap:.8rem;padding:.6rem 0;border-bottom:1px solid var(--rv-borde)}.pago>div:first-child{flex:1}.pago strong,.pago small{display:block}.pago small{color:var(--rv-texto-suave);font-size:.75rem}
.pagar{margin-top:1rem;padding:1rem;border:1px solid var(--rv-borde);border-radius:14px;background:var(--rv-navy-50)}.pagar h3{margin-top:0}
.metodos{display:flex;gap:.5rem;margin-bottom:1rem}.metodos button{flex:1;padding:.7rem;border:1px solid var(--rv-borde);border-radius:10px;background:white;font-weight:800;cursor:pointer}.metodos button.activo{border-color:var(--rv-teal);box-shadow:inset 0 0 0 1px var(--rv-teal);color:var(--rv-teal-700)}
.yape{display:flex;gap:1.2rem;align-items:flex-start}.qr{width:170px;height:170px;object-fit:contain;padding:.4rem;border-radius:12px;background:white}
.monto{margin:0 0 .3rem;font-size:1.3rem;font-weight:800;color:var(--rv-navy)}.yape ol{margin:.5rem 0 0;padding-left:1.1rem;color:var(--rv-texto-suave);font-size:.82rem}
.sub{margin-top:1rem}.sub textarea{font:inherit;resize:vertical}
.acciones{margin-top:1.2rem}
.mensaje{padding:.8rem 1rem;border-left:4px solid #25d366;border-radius:8px;background:#f0fbf4}
.cancelar{margin-top:1.2rem;padding:0;border:0;background:none;color:var(--rv-texto-suave);font-weight:700;cursor:pointer}.cancelar:hover{color:var(--rv-error)}
.capa-2{z-index:110}
.rv-modal__cabecera button{border:0;background:none;font-size:1.5rem;cursor:pointer}
@media(max-width:560px){.yape{flex-direction:column}.qr{align-self:center}}`]})
export class PedidosComponent{
  private api=inject(ApiService);private auth=inject(AuthService);private toast=inject(ToastService);private ruta=inject(ActivatedRoute);
  readonly esCliente=this.auth.rol()===ROLES.CLIENTE;
  readonly estados=Object.keys(ESTADO_PEDIDO);readonly nombreEstado=ESTADO_PEDIDO;readonly estadoPago=ESTADO_PAGO;readonly metodo=METODO_PAGO;
  readonly soles=soles;readonly fechaUtc=fechaUtc;

  pestana=signal<Pestana>('pedidos');
  pedidos=signal<any[]>([]);paginacion=signal<any>(null);cargando=signal(false);error=signal('');filtroEstado='';pagina=1;
  porVerificar=signal<any[]>([]);errorVerificar=signal('');rechazandoPago=signal<number|null>(null);observacionRechazo='';
  detalle=signal<any>(null);errorDetalle=signal('');ocupado=signal(false);
  metodoElegido=signal<Metodo>('');yape=signal<any>(null);errorYape=signal('');mostrarQr=signal(true);qrYape(y:any){return `${API_URL}/pagos/yape/qr?v=${y.qrVersion}`;}codigoOperacion='';
  panelComprobante=signal(false);comprobante=signal<any>(null);telefonoComprobante='';
  panelCancelar=signal(false);motivoCancelacion='';

  constructor(){
    this.cargar(1);
    if(!this.esCliente)this.cargarPorVerificar();
    // Desde el carrito se llega con ?id=<pedido> para pagar en el acto.
    const id=Number(this.ruta.snapshot.queryParamMap.get('id'));
    if(id>0)this.abrir(id);
  }

  async cargar(p=1){this.pagina=p;this.cargando.set(true);this.error.set('');try{
    const r=await firstValueFrom(this.api.get('/pedidos',{pagina:p,limite:15,...(this.filtroEstado?{estado:this.filtroEstado}:{})}));
    this.pedidos.set(r.items??r);this.paginacion.set(r.paginacion);
  }catch(e){this.error.set(mensajeDeError(e));}finally{this.cargando.set(false);}}
  async cargarPorVerificar(){this.errorVerificar.set('');try{this.porVerificar.set(await firstValueFrom(this.api.get('/pagos/pendientes')));}catch(e){this.errorVerificar.set(mensajeDeError(e));}}
  irAVerificar(){this.pestana.set('verificar');this.cargarPorVerificar();}

  async abrir(id:number){this.errorDetalle.set('');this.reiniciarPaneles();try{this.detalle.set(await firstValueFrom(this.api.get(`/pedidos/${id}`)));}catch(e){this.toast.error(mensajeDeError(e,'No se pudo abrir el pedido.'));}}
  cerrar(){this.detalle.set(null);this.reiniciarPaneles();}
  private reiniciarPaneles(){this.metodoElegido.set('');this.codigoOperacion='';this.panelComprobante.set(false);this.comprobante.set(null);this.telefonoComprobante='';this.panelCancelar.set(false);this.motivoCancelacion='';}
  puedeCancelar(p:any){return p.estado==='pendiente_pago'||(!this.esCliente&&p.estado==='pendiente_verificacion');}

  // Toda accion sobre un pedido devuelve el pedido actualizado: se repinta el
  // detalle y se refrescan las listas, sin cerrar el modal.
  private async accion(peticion:()=>Promise<any>,exito:string,porDefecto:string){this.ocupado.set(true);this.errorDetalle.set('');try{
    const p=await peticion();if(p?.id&&this.detalle()?.id===p.id)this.detalle.set(p);
    this.toast.exito(exito);this.reiniciarPaneles();await this.cargar(this.pagina);if(!this.esCliente)await this.cargarPorVerificar();
  }catch(e){this.errorDetalle.set(mensajeDeError(e,porDefecto));}finally{this.ocupado.set(false);}}

  async elegirYape(){this.metodoElegido.set('yape');if(this.yape()||this.errorYape())return;try{this.yape.set(await firstValueFrom(this.api.get('/pagos/yape')));}catch(e){this.errorYape.set(mensajeDeError(e));}}
  pagarYape(){const id=this.detalle().id;this.accion(()=>firstValueFrom(this.api.post(`/pedidos/${id}/pagos/yape`,{codigoOperacion:this.codigoOperacion.trim()})),'Pago registrado. Recepción lo confirmará en breve.','No se pudo registrar el pago.');}
  async pagarConTarjeta(){const id=this.detalle().id;this.ocupado.set(true);this.errorDetalle.set('');try{
    const r=await firstValueFrom(this.api.post(`/pedidos/${id}/pagos/pasarela`));
    // Checkout HOSPEDADO: la tarjeta se escribe en la pagina de la pasarela.
    window.location.href=r.urlCheckout;
  }catch(e){this.errorDetalle.set(mensajeDeError(e,'No se pudo iniciar el pago con tarjeta.'));this.ocupado.set(false);}}

  cobrarEfectivo(){const p=this.detalle();if(!confirm(`¿Confirmas que recibiste ${soles(p.total)} en efectivo por el pedido ${p.codigo}?`))return;this.accion(()=>firstValueFrom(this.api.post(`/pedidos/${p.id}/pagos/efectivo`)),'Cobro en efectivo registrado.','No se pudo registrar el cobro.');}
  entregar(){const p=this.detalle();this.accion(()=>firstValueFrom(this.api.post(`/pedidos/${p.id}/entregar`)),`Pedido ${p.codigo} entregado.`,'No se pudo marcar como entregado.');}
  cancelar(){const p=this.detalle();this.accion(()=>firstValueFrom(this.api.post(`/pedidos/${p.id}/cancelar`,{motivo:this.motivoCancelacion.trim()})),`Pedido ${p.codigo} cancelado.`,'No se pudo cancelar el pedido.');}

  pedirRechazo(pagoId:number){this.observacionRechazo='';this.rechazandoPago.set(pagoId);}
  async verificar(pagoId:number,aprobado:boolean){this.ocupado.set(true);try{
    const p=await firstValueFrom(this.api.post(`/pagos/${pagoId}/verificar`,{aprobado,observacion:aprobado?null:this.observacionRechazo.trim()}));
    this.toast.exito(aprobado?'Pago aprobado: el pedido quedó pagado.':'Pago rechazado: el pedido volvió a pendiente de pago.');
    this.rechazandoPago.set(null);if(p?.id&&this.detalle()?.id===p.id)this.detalle.set(p);
    await Promise.all([this.cargarPorVerificar(),this.cargar(this.pagina)]);
  }catch(e){this.toast.error(mensajeDeError(e,'No se pudo verificar el pago.'));}finally{this.ocupado.set(false);}}

  abrirComprobante(){this.comprobante.set(null);this.telefonoComprobante='';this.panelComprobante.set(true);}
  // Modo "enlace" (el de produccion): la API arma un wa.me y lo registra; la
  // recepcionista lo abre y lo envia desde el WhatsApp del negocio.
  async enviarComprobante(){const id=this.detalle().id;this.ocupado.set(true);this.errorDetalle.set('');try{
    const tel=this.telefonoComprobante.trim();
    this.comprobante.set(await firstValueFrom(this.api.post(`/pedidos/${id}/comprobante/whatsapp`,tel?{telefono:tel}:{})));
  }catch(e){this.errorDetalle.set(mensajeDeError(e,'No se pudo preparar el comprobante.'));}finally{this.ocupado.set(false);}}
}
