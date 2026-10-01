import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ROLES } from '../core/constants';
import { mensajeDeError, paramsLimpios, soles } from '../core/helpers';
import { ToastService } from '../core/toast.service';
import { IconComponent } from '../shared/icon.component';

// HU-014 (catalogo) y entrada de HU-015 (carrito).
// El catalogo publico NO expone el stock exacto, solo "disponible": se
// muestra disponible/agotado. El carrito es solo del rol cliente (la API lo
// exige); a quien no inicio sesion se le invita a entrar para comprar.
@Component({selector:'app-catalogo',standalone:true,imports:[FormsModule,RouterLink,IconComponent],template:`
<section class="catalogo"><div class="rv-contenedor">
  <header class="encabezado"><h1>Tienda Rivervet</h1><p>Alimento, accesorios y cuidado para tu mascota.</p></header>
  <form class="rv-filtros" (ngSubmit)="cargar(1)">
    <input class="rv-input" name="texto" [(ngModel)]="filtros.texto" placeholder="Buscar producto">
    <select class="rv-select" name="categoria" [(ngModel)]="filtros.categoriaId" (change)="cargar(1)"><option value="">Todas las categorías</option>@for(c of categorias();track c.id){<option [value]="c.id">{{c.nombre}}</option>}</select>
    <button class="rv-boton rv-boton--primario">Buscar</button>
  </form>
  @if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
  @if(cargando()){<p>Cargando productos…</p>}@else{
    @for(g of grupos();track g.categoria){<section class="grupo">
      @if(grupos().length>1){<h2>{{g.categoria}}</h2>}
      <div class="productos">@for(p of g.productos;track p.id){<article (click)="abrir(p)" tabindex="0" (keydown.enter)="abrir(p)">
        <div class="foto">@if(p.imagenUrl){<img [src]="p.imagenUrl" [alt]="p.nombre">}@else{🐾}</div>
        <span class="rv-chip">{{p.categoriaNombre}}</span><h3>{{p.nombre}}</h3>@if(p.descripcion){<p class="descripcion">{{p.descripcion}}</p>}
        <footer><strong>{{soles(p.precio)}}</strong><span class="stock" [class.agotado]="!p.disponible">{{p.disponible?'Disponible':'Agotado'}}</span></footer>
        @if(esCliente&&p.disponible){<button type="button" class="rv-boton rv-boton--contorno rv-boton--bloque agregar" (click)="$event.stopPropagation();agregar(p,1)" [disabled]="agregando()===p.id">{{agregando()===p.id?'Agregando…':'Agregar al carrito'}}</button>}
      </article>}</div>
    </section>}@empty{<p class="rv-vacio">No se encontraron productos.</p>}
  }
  @if(paginacion()?.totalPaginas>1){<div class="paginas"><button class="rv-boton rv-boton--sm rv-boton--contorno" [disabled]="filtros.pagina<=1" (click)="cargar(filtros.pagina-1)">Anterior</button><span>Página {{filtros.pagina}} de {{paginacion().totalPaginas}}</span><button class="rv-boton rv-boton--sm rv-boton--contorno" [disabled]="filtros.pagina>=paginacion().totalPaginas" (click)="cargar(filtros.pagina+1)">Siguiente</button></div>}
</div></section>

@if(esCliente&&enCarrito()>0){<a routerLink="/carrito" class="carrito-flotante"><app-icon name="cart"/> Ver carrito <span>{{enCarrito()}}</span></a>}

@if(detalle(); as p){<div class="rv-modal-fondo" (click)="detalle.set(null)"><div class="rv-modal ficha" (click)="$event.stopPropagation()">
  <div class="rv-modal__cabecera"><h2>{{p.nombre}}</h2><button type="button" (click)="detalle.set(null)">×</button></div>
  <div class="ficha-cuerpo">
    <div class="foto grande">@if(p.imagenUrl){<img [src]="p.imagenUrl" [alt]="p.nombre">}@else{🐾}</div>
    <div>
      <span class="rv-chip">{{p.categoriaNombre}}</span>
      <p class="precio">{{soles(p.precio)}}</p>
      <p class="stock" [class.agotado]="!p.disponible">{{p.disponible?'Disponible':'Agotado por ahora'}}</p>
      @if(p.descripcion){<p>{{p.descripcion}}</p>}
      <small>Código: {{p.sku}}</small>
      @if(p.disponible){
        @if(esCliente){<div class="comprar"><label>Cantidad<input class="rv-input" type="number" min="1" max="99" [(ngModel)]="cantidad" name="cantidad"></label><button type="button" class="rv-boton rv-boton--primario" (click)="agregar(p,cantidad)" [disabled]="agregando()===p.id">{{agregando()===p.id?'Agregando…':'Agregar al carrito'}}</button></div>}
        @else if(!auth.autenticado()){<a class="rv-boton rv-boton--primario comprar" routerLink="/login" [queryParams]="{redirect:'/tienda'}">Inicia sesión para comprar</a>}
      }
    </div>
  </div>
</div></div>}`,
styles:[`.catalogo{min-height:70vh;padding:3rem 0;background:var(--rv-fondo)}.encabezado{margin-bottom:2rem;text-align:center}
.grupo+.grupo{margin-top:2.2rem}.grupo h2{margin:0 0 1rem;font-size:1.2rem}
.productos{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1rem}
.productos article{display:flex;flex-direction:column;padding:1rem;border:1px solid var(--rv-borde);border-radius:var(--rv-radio);background:white;cursor:pointer;transition:box-shadow .15s}.productos article:hover,.productos article:focus{box-shadow:0 10px 26px rgba(16,34,84,.09);outline:none}
.productos h3{margin:.6rem 0 .3rem;font-size:1rem}
.descripcion{display:-webkit-box;margin:0 0 .6rem;overflow:hidden;color:var(--rv-texto-suave);font-size:.82rem;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.foto{display:grid;place-items:center;height:130px;margin:-1rem -1rem 1rem;overflow:hidden;background:var(--rv-navy-50);font-size:3rem;border-radius:var(--rv-radio) var(--rv-radio) 0 0}.foto img{width:100%;height:100%;object-fit:cover}
.productos footer{display:flex;align-items:center;justify-content:space-between;margin-top:auto}.productos strong{color:var(--rv-teal-700);font-size:1.2rem}
.stock{color:var(--rv-teal-700);font-size:.75rem;font-weight:700}.stock.agotado{color:var(--rv-texto-tenue)}
.agregar{margin-top:.8rem}
.paginas{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:2rem}
.carrito-flotante{position:fixed;right:1.5rem;bottom:1.5rem;z-index:30;display:flex;align-items:center;gap:.55rem;padding:.8rem 1.1rem;border-radius:999px;background:var(--rv-navy);color:white;font-weight:800;box-shadow:0 14px 30px rgba(20,41,94,.3)}.carrito-flotante:hover{color:white;background:var(--rv-navy-500)}.carrito-flotante span{display:grid;place-items:center;min-width:1.5rem;height:1.5rem;padding:0 .35rem;border-radius:999px;background:var(--rv-teal);color:#073d35;font-size:.78rem}
.ficha-cuerpo{display:grid;grid-template-columns:220px 1fr;gap:1.4rem;margin-top:1rem}.foto.grande{height:220px;margin:0;border-radius:14px}
.precio{margin:.6rem 0 .2rem;color:var(--rv-teal-700);font-size:1.6rem;font-weight:800}
.ficha small{color:var(--rv-texto-tenue)}
.comprar{display:flex;align-items:end;gap:.8rem;margin-top:1.2rem}.comprar label{display:grid;gap:.3rem;width:6rem;font-size:.8rem;font-weight:700}
.rv-modal__cabecera button{border:0;background:none;font-size:1.5rem;cursor:pointer}
@media(max-width:620px){.ficha-cuerpo{grid-template-columns:1fr}.foto.grande{height:170px}}`]})
export class CatalogoComponent{
  private api=inject(ApiService);readonly auth=inject(AuthService);private toast=inject(ToastService);
  productos=signal<any[]>([]);categorias=signal<any[]>([]);paginacion=signal<any>(null);cargando=signal(false);error=signal('');
  detalle=signal<any>(null);agregando=signal<number|null>(null);enCarrito=signal(0);cantidad=1;soles=soles;
  filtros:any={texto:'',categoriaId:'',orden:'nombre',soloDisponibles:true,pagina:1,limite:12};
  readonly esCliente=this.auth.rol()===ROLES.CLIENTE;
  // Agrupa por categoria la pagina actual, respetando el orden de llegada.
  readonly grupos=computed(()=>{const g=new Map<string,any[]>();for(const p of this.productos()){const k=p.categoriaNombre||'Otros';if(!g.has(k))g.set(k,[]);g.get(k)!.push(p);}return[...g].map(([categoria,productos])=>({categoria,productos}));});

  constructor(){this.cargar();firstValueFrom(this.api.get('/categorias')).then(x=>this.categorias.set(x)).catch(()=>{});if(this.esCliente)this.cargarCarrito();}
  async cargar(p=1){this.filtros.pagina=p;this.cargando.set(true);this.error.set('');try{const r=await firstValueFrom(this.api.get('/productos',paramsLimpios(this.filtros)));this.productos.set(r.items??r);this.paginacion.set(r.paginacion);}catch(e){this.error.set(mensajeDeError(e));}finally{this.cargando.set(false);}}
  abrir(p:any){this.cantidad=1;this.detalle.set(p);}
  private async cargarCarrito(){try{const c=await firstValueFrom(this.api.get('/carrito'));this.enCarrito.set(c?.cantidadProductos??0);}catch{/* sin carrito no hay boton flotante */}}
  async agregar(p:any,cantidad:number){const n=Math.trunc(Number(cantidad));if(!(n>=1&&n<=99)){this.toast.error('La cantidad debe estar entre 1 y 99.');return;}
    this.agregando.set(p.id);try{const c=await firstValueFrom(this.api.post('/carrito/items',{productoId:p.id,cantidad:n}));this.enCarrito.set(c?.cantidadProductos??this.enCarrito()+n);this.toast.exito(`${p.nombre} agregado al carrito.`);this.detalle.set(null);}
    catch(e){this.toast.error(mensajeDeError(e,'No se pudo agregar.'));}finally{this.agregando.set(null);}}
}
