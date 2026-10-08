import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { mensajeDeError, soles } from '../core/helpers';
import { ToastService } from '../core/toast.service';

// HU-015 (carrito) y HU-016 (confirmar pedido). Solo rol cliente.
// Los precios y avisos ("Agotado", "Solo quedan N") los calcula la API con el
// stock ACTUAL: aqui solo se muestran. Confirmar deja el pedido pendiente de
// pago y lleva a su detalle para elegir como pagar.
@Component({selector:'app-carrito',standalone:true,imports:[RouterLink],template:`
<header class="rv-pagina-cabecera"><div><h1>Mi carrito</h1><p>Revisa tu compra antes de confirmarla.</p></div><a routerLink="/tienda" class="rv-boton rv-boton--contorno">Seguir comprando</a></header>
@if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
@if(!carrito()&&!error()){<p>Cargando tu carrito…</p>}
@if(carrito(); as c){
  @if(!c.items?.length){<div class="rv-panel vacio"><p>Tu carrito está vacío.</p><a routerLink="/tienda" class="rv-boton rv-boton--primario">Ir a la tienda</a></div>}
  @else{<div class="carrito">
    <div class="rv-panel">
      @for(i of c.items;track i.productoId){<article class="item">
        <div class="foto">@if(i.imagenUrl){<img [src]="i.imagenUrl" [alt]="i.nombre">}@else{🐾}</div>
        <div class="info"><strong>{{i.nombre}}</strong><small>{{soles(i.precioUnitario)}} c/u</small>@if(i.advertencia){<span class="advertencia">{{i.advertencia}}</span>}</div>
        <div class="cantidad"><button type="button" (click)="cambiar(i,i.cantidad-1)" [disabled]="ocupado()||i.cantidad<=1" aria-label="Quitar una unidad">−</button><span>{{i.cantidad}}</span><button type="button" (click)="cambiar(i,i.cantidad+1)" [disabled]="ocupado()||i.cantidad>=99" aria-label="Agregar una unidad">+</button></div>
        <strong class="subtotal">{{soles(i.subtotal)}}</strong>
        <button type="button" class="quitar" (click)="quitar(i)" [disabled]="ocupado()" [attr.aria-label]="'Quitar '+i.nombre">×</button>
      </article>}
      <button type="button" class="vaciar" (click)="vaciar()" [disabled]="ocupado()">Vaciar carrito</button>
    </div>
    <aside class="rv-panel resumen">
      <h2>Resumen</h2>
      <div class="linea"><span>Productos</span><span>{{c.cantidadProductos}}</span></div>
      <div class="linea total"><span>Total</span><strong>{{soles(c.total)}}</strong></div>
      @if(!c.listoParaConfirmar){<p class="rv-aviso rv-aviso--aviso">Revisa los productos marcados: alguno ya no tiene stock suficiente.</p>}
      @if(errorConfirmar()){<p class="rv-aviso rv-aviso--error">{{errorConfirmar()}}</p>}
      <button class="rv-boton rv-boton--primario rv-boton--bloque" (click)="confirmar()" [disabled]="ocupado()||!c.listoParaConfirmar">{{confirmando()?'Confirmando…':'Confirmar pedido'}}</button>
      <small>Después de confirmar eliges cómo pagar.</small>
    </aside>
  </div>}
}`,
styles:[`.vacio{padding:3rem 1rem;text-align:center}
.carrito{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:1.2rem;align-items:start}
.item{display:grid;grid-template-columns:56px minmax(0,1fr) auto 90px 32px;align-items:center;gap:1rem;padding:.9rem 0;border-bottom:1px solid var(--rv-borde)}
.foto{display:grid;place-items:center;width:56px;height:56px;overflow:hidden;border-radius:12px;background:var(--rv-navy-50);font-size:1.6rem}.foto img{width:100%;height:100%;object-fit:cover}
.info strong,.info small{display:block}.info small{color:var(--rv-texto-suave);font-size:.78rem}
.advertencia{display:inline-block;margin-top:.25rem;padding:.12rem .5rem;border-radius:999px;background:#fff4e0;color:#a5600d;font-size:.72rem;font-weight:700}
.cantidad{display:flex;align-items:center;gap:.5rem}.cantidad span{min-width:1.6rem;font-weight:800;text-align:center}
.cantidad button,.quitar{display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--rv-borde);border-radius:8px;background:white;font-size:1rem;cursor:pointer}
.cantidad button:disabled,.quitar:disabled{opacity:.45;cursor:default}
.subtotal{text-align:right}.quitar{color:var(--rv-texto-suave)}.quitar:hover:not(:disabled){color:var(--rv-error);border-color:#efc1bd}
.vaciar{margin-top:.9rem;border:0;background:none;color:var(--rv-texto-suave);font-weight:700;cursor:pointer}.vaciar:hover{color:var(--rv-error)}
.resumen{position:sticky;top:calc(var(--rv-topbar) + 1rem)}.resumen h2{margin:0 0 1rem;font-size:1.1rem}
.linea{display:flex;justify-content:space-between;padding:.45rem 0}.linea.total{margin:.4rem 0 1rem;padding-top:.8rem;border-top:1px solid var(--rv-borde);font-size:1.1rem}
.resumen small{display:block;margin-top:.7rem;color:var(--rv-texto-suave);text-align:center}
@media(max-width:900px){.carrito{grid-template-columns:1fr}.resumen{position:static}}
@media(max-width:560px){.item{grid-template-columns:48px minmax(0,1fr) 32px;grid-template-areas:'f i q' 'c c s'}.foto{grid-area:f;width:48px;height:48px}.info{grid-area:i}.quitar{grid-area:q}.cantidad{grid-area:c}.subtotal{grid-area:s}}`]})
export class CarritoComponent{
  private api=inject(ApiService);private toast=inject(ToastService);private router=inject(Router);
  carrito=signal<any>(null);error=signal('');errorConfirmar=signal('');ocupado=signal(false);confirmando=signal(false);soles=soles;
  constructor(){this.cargar();}
  async cargar(){this.error.set('');try{this.carrito.set(await firstValueFrom(this.api.get('/carrito')));}catch(e){this.error.set(mensajeDeError(e));}}
  // Cada cambio devuelve el carrito ya recalculado por la API.
  private async aplicar(peticion:Promise<any>,mensajeError:string){this.ocupado.set(true);try{const c=await peticion;if(c?.items)this.carrito.set(c);else await this.cargar();}catch(e){this.toast.error(mensajeDeError(e,mensajeError));await this.cargar();}finally{this.ocupado.set(false);}}
  cambiar(i:any,cantidad:number){if(cantidad<1||cantidad>99)return;this.aplicar(firstValueFrom(this.api.put(`/carrito/items/${i.productoId}`,{cantidad})),'No se pudo cambiar la cantidad.');}
  quitar(i:any){this.aplicar(firstValueFrom(this.api.delete(`/carrito/items/${i.productoId}`)),'No se pudo quitar el producto.');}
  vaciar(){if(!confirm('¿Vaciar el carrito?'))return;this.aplicar(firstValueFrom(this.api.delete('/carrito')),'No se pudo vaciar el carrito.');}
  async confirmar(){this.confirmando.set(true);this.ocupado.set(true);this.errorConfirmar.set('');try{
    const pedido=await firstValueFrom(this.api.post('/pedidos'));
    this.toast.exito(`Pedido ${pedido.codigo} creado. Ahora elige cómo pagar.`);
    await this.router.navigate(['/mis-pedidos'],{queryParams:{id:pedido.id}});
  }catch(e){this.errorConfirmar.set(mensajeDeError(e,'No se pudo confirmar el pedido.'));await this.cargar();}finally{this.confirmando.set(false);this.ocupado.set(false);}}
}
