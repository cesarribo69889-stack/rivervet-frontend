import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { cantidad, mensajeDeError, paramsLimpios, soles } from '../core/helpers';
import { ToastService } from '../core/toast.service';

// HU-013. Consultar el inventario: admin y recepcion. Crear y editar
// productos, ajustar stock y gestionar categorias: solo admin (la API lo exige).
//
// El stock de un producto existente no se edita en el formulario: se mueve con
// un ajuste (entrada o salida) que exige motivo y queda auditado.
@Component({selector:'app-inventario',standalone:true,imports:[FormsModule],template:`
<header class="rv-pagina-cabecera"><div><h1>Inventario</h1><p>Productos, precios y existencias.</p></div>
  @if(auth.esAdmin()){<div class="rv-acciones"><button class="rv-boton rv-boton--contorno" (click)="abrirCategorias()">Categorías</button><button class="rv-boton rv-boton--primario" (click)="nuevo()">+ Nuevo producto</button></div>}
</header>
<form class="rv-filtros" (ngSubmit)="cargar(1)">
  <input class="rv-input" name="texto" [(ngModel)]="filtros.texto" placeholder="Nombre o SKU">
  <select class="rv-select" name="categoria" [(ngModel)]="filtros.categoriaId" (change)="cargar(1)"><option value="">Todas las categorías</option>@for(c of categorias();track c.id){<option [value]="c.id">{{c.nombre}}</option>}</select>
  <label class="check"><input type="checkbox" name="bajo" [(ngModel)]="filtros.soloStockBajo" (change)="cargar(1)"> Solo stock bajo</label>
  <label class="check"><input type="checkbox" name="inactivos" [(ngModel)]="filtros.incluirInactivos" (change)="cargar(1)"> Incluir inactivos</label>
  <button class="rv-boton rv-boton--contorno">Buscar</button>
</form>
@if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
@if(cargando()){<p>Cargando inventario…</p>}@else{<div class="rv-tabla-wrap rv-panel"><table class="rv-tabla"><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead><tbody>
  @for(p of productos();track p.id){<tr [class.inactivo]="!p.activo"><td><strong>{{p.nombre}}</strong><br><small>{{p.sku}}</small></td><td>{{p.categoriaNombre}}</td><td>{{soles(p.precio)}}</td><td>{{cantidad(p.stock)}} <small>/ mín. {{p.stockMinimo}}</small></td><td><span class="rv-chip" [class.alerta]="p.activo&&p.stockBajo" [class.apagado]="!p.activo">{{!p.activo?'Inactivo':(p.stockBajo?'Stock bajo':'Disponible')}}</span></td><td>@if(auth.esAdmin()){<div class="rv-acciones"><button class="rv-boton rv-boton--sm rv-boton--contorno" (click)="editar(p)">Editar</button><button class="rv-boton rv-boton--sm rv-boton--contorno" (click)="abrirAjuste(p)">Stock</button></div>}</td></tr>}
  @empty{<tr><td colspan="6" class="rv-vacio">No hay productos con estos filtros.@if(auth.esAdmin()){ Crea uno con “+ Nuevo producto”.}</td></tr>}
</tbody></table></div>}
@if(paginacion()?.totalPaginas>1){<div class="paginas"><button class="rv-boton rv-boton--sm rv-boton--contorno" [disabled]="filtros.pagina<=1" (click)="cargar(filtros.pagina-1)">Anterior</button><span>Página {{filtros.pagina}} de {{paginacion().totalPaginas}}</span><button class="rv-boton rv-boton--sm rv-boton--contorno" [disabled]="filtros.pagina>=paginacion().totalPaginas" (click)="cargar(filtros.pagina+1)">Siguiente</button></div>}

@if(modalProducto()){<div class="rv-modal-fondo" (click)="modalProducto.set(false)"><form class="rv-modal" (click)="$event.stopPropagation()" (ngSubmit)="guardarProducto()" novalidate>
  <div class="rv-modal__cabecera"><h2>{{editandoId?'Editar producto':'Nuevo producto'}}</h2><button type="button" (click)="modalProducto.set(false)">×</button></div>
  @if(!categorias().length){<p class="rv-aviso rv-aviso--aviso">Primero crea una categoría desde “Categorías”.</p>}
  <div class="rv-form-grid">
    <label class="rv-campo">Categoría<select class="rv-select" name="pCat" [(ngModel)]="form.categoriaId" required><option value="">Selecciona</option>@for(c of categorias();track c.id){<option [value]="c.id">{{c.nombre}}{{c.activo===false?' (inactiva)':''}}</option>}</select></label>
    <label class="rv-campo">SKU<input class="rv-input" name="pSku" [ngModel]="form.sku" (ngModelChange)="form.sku=($event||'').toUpperCase()" maxlength="30" placeholder="ALI-PERRO-15KG"><small>3 a 30 caracteres: letras, números y guiones.</small></label>
    <label class="rv-campo ancho">Nombre<input class="rv-input" name="pNombre" [(ngModel)]="form.nombre" maxlength="120"></label>
    <label class="rv-campo ancho">Descripción<textarea class="rv-input" name="pDesc" [(ngModel)]="form.descripcion" maxlength="1000" rows="2"></textarea></label>
    <label class="rv-campo">Precio (S/)<input class="rv-input" type="number" name="pPrecio" [(ngModel)]="form.precio" min="0.01" max="99999.99" step="0.01" inputmode="decimal"></label>
    @if(!editandoId){<label class="rv-campo">Stock inicial<input class="rv-input" type="number" name="pStock" [(ngModel)]="form.stock" min="0" max="100000" step="1" inputmode="numeric"></label>}
    <label class="rv-campo">Stock mínimo<input class="rv-input" type="number" name="pMin" [(ngModel)]="form.stockMinimo" min="0" max="10000" step="1" inputmode="numeric"><small>Con esta cantidad o menos se marca “stock bajo”.</small></label>
    <label class="rv-campo ancho">Imagen (opcional)<input class="rv-input" name="pImg" [(ngModel)]="form.imagenUrl" maxlength="500" placeholder="https://…"></label>
    @if(editandoId){<label class="check ancho"><input type="checkbox" name="pActivo" [(ngModel)]="form.activo"> Activo: visible en la tienda</label>}
  </div>
  @if(editandoId){<p class="nota">El stock no se cambia aquí: usa “Stock” en la lista para registrar entradas y salidas con su motivo.</p>}
  @if(errorForm()){<p class="rv-aviso rv-aviso--error">{{errorForm()}}</p>}
  <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="modalProducto.set(false)">Cancelar</button><button class="rv-boton rv-boton--primario" [disabled]="ocupado()">{{ocupado()?'Guardando…':'Guardar'}}</button></div>
</form></div>}

@if(modalAjuste()){<div class="rv-modal-fondo" (click)="modalAjuste.set(false)"><form class="rv-modal" (click)="$event.stopPropagation()" (ngSubmit)="guardarAjuste()" novalidate>
  <div class="rv-modal__cabecera"><h2>Stock de {{activo()?.nombre}}</h2><button type="button" (click)="modalAjuste.set(false)">×</button></div>
  <p class="nota">Stock actual: <strong>{{cantidad(activo()?.stock)}}</strong></p>
  <div class="rv-form-grid">
    <label class="rv-campo">Movimiento<select class="rv-select" name="mov" [(ngModel)]="ajuste.movimiento"><option value="entrada">Entrada (reponer)</option><option value="salida">Salida (merma, vencido…)</option></select></label>
    <label class="rv-campo">Unidades<input class="rv-input" type="number" min="1" max="10000" step="1" name="unidades" [(ngModel)]="ajuste.unidades" inputmode="numeric"></label>
    <label class="rv-campo ancho">Motivo<textarea class="rv-input" name="motivo" [(ngModel)]="ajuste.motivo" maxlength="250" rows="2" placeholder="Ej.: llegó pedido del proveedor"></textarea></label>
  </div>
  @if(errorForm()){<p class="rv-aviso rv-aviso--error">{{errorForm()}}</p>}
  <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="modalAjuste.set(false)">Cancelar</button><button class="rv-boton rv-boton--primario" [disabled]="ocupado()">{{ocupado()?'Guardando…':'Guardar ajuste'}}</button></div>
</form></div>}

@if(modalCategorias()){<div class="rv-modal-fondo" (click)="modalCategorias.set(false)"><div class="rv-modal" (click)="$event.stopPropagation()">
  <div class="rv-modal__cabecera"><h2>Categorías</h2><button type="button" (click)="modalCategorias.set(false)">×</button></div>
  <form class="nueva" (ngSubmit)="crearCategoria()"><input class="rv-input" name="cNueva" [(ngModel)]="nuevaCategoria" maxlength="60" placeholder="Nueva categoría, p. ej. Alimentos"><button class="rv-boton rv-boton--primario" [disabled]="ocupado()||!nuevaCategoria.trim()">Agregar</button></form>
  <table class="rv-tabla"><thead><tr><th>Nombre</th><th>Productos</th><th>Estado</th><th></th></tr></thead><tbody>
    @for(c of categorias();track c.id){<tr>
      @if(editandoCategoria()===c.id){<td colspan="3"><input class="rv-input" [(ngModel)]="nombreCategoria" maxlength="60" aria-label="Nuevo nombre"></td><td><div class="rv-acciones"><button type="button" class="rv-boton rv-boton--sm rv-boton--primario" [disabled]="ocupado()||!nombreCategoria.trim()" (click)="guardarCategoria(c,nombreCategoria,c.activo)">Guardar</button><button type="button" class="rv-boton rv-boton--sm rv-boton--contorno" (click)="editandoCategoria.set(null)">Cancelar</button></div></td>}
      @else{<td>{{c.nombre}}</td><td>{{c.totalProductos}}</td><td><span class="rv-chip" [class.apagado]="!c.activo">{{c.activo?'Activa':'Inactiva'}}</span></td><td><div class="rv-acciones"><button type="button" class="rv-boton rv-boton--sm rv-boton--contorno" (click)="editarCategoria(c)">Renombrar</button><button type="button" class="rv-boton rv-boton--sm rv-boton--contorno" [disabled]="ocupado()" (click)="guardarCategoria(c,c.nombre,!c.activo)">{{c.activo?'Desactivar':'Activar'}}</button></div></td>}
    </tr>}@empty{<tr><td colspan="4" class="rv-vacio">Aún no hay categorías.</td></tr>}
  </tbody></table>
  <p class="nota">Una categoría inactiva y sus productos dejan de verse en la tienda.</p>
  @if(errorCategorias()){<p class="rv-aviso rv-aviso--error">{{errorCategorias()}}</p>}
</div></div>}`,
styles:[`small{color:var(--rv-texto-suave)}.check{display:flex;align-items:center;gap:.4rem;font-size:.85rem}
tr.inactivo td{opacity:.6}.rv-chip.alerta{background:#fff4e0;color:#8a5208}.rv-chip.apagado{background:var(--rv-navy-50);color:var(--rv-texto-suave)}
.paginas{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1.2rem}
.nota{color:var(--rv-texto-suave);font-size:.8rem}.rv-modal textarea{font:inherit;resize:vertical}
.nueva{display:flex;gap:.6rem;margin:1rem 0}.nueva input{flex:1}
.rv-modal__cabecera button{border:0;background:none;font-size:1.5rem;cursor:pointer}`]})
export class InventarioComponent{
  private api=inject(ApiService);readonly auth=inject(AuthService);private toast=inject(ToastService);
  productos=signal<any[]>([]);categorias=signal<any[]>([]);paginacion=signal<any>(null);cargando=signal(false);error=signal('');errorForm=signal('');ocupado=signal(false);
  modalProducto=signal(false);modalAjuste=signal(false);modalCategorias=signal(false);activo=signal<any>(null);
  editandoId:number|null=null;form:any=this.vacio();ajuste:any={unidades:1,movimiento:'entrada',motivo:''};
  nuevaCategoria='';nombreCategoria='';editandoCategoria=signal<number|null>(null);errorCategorias=signal('');
  soles=soles;cantidad=cantidad;
  filtros:any={texto:'',categoriaId:'',soloStockBajo:false,incluirInactivos:false,pagina:1,limite:15};

  constructor(){this.cargar();this.cargarCategorias();}
  vacio(){return{categoriaId:'',sku:'',nombre:'',descripcion:'',precio:null,stock:0,stockMinimo:5,imagenUrl:'',activo:true};}

  async cargar(p=this.filtros.pagina){this.filtros.pagina=p;this.cargando.set(true);this.error.set('');try{
    const r=await firstValueFrom(this.api.get('/productos/inventario',paramsLimpios({...this.filtros,soloStockBajo:this.filtros.soloStockBajo||null,incluirInactivos:this.filtros.incluirInactivos||null})));
    this.productos.set(r.items??r);this.paginacion.set(r.paginacion);
  }catch(e){this.error.set(mensajeDeError(e));}finally{this.cargando.set(false);}}
  // El admin ve tambien las categorias inactivas (para reactivarlas); recepcion, solo las activas.
  async cargarCategorias(){try{this.categorias.set(await firstValueFrom(this.api.get(this.auth.esAdmin()?'/categorias/todas':'/categorias')));}catch{/* el filtro queda sin categorias */}}

  nuevo(){this.editandoId=null;this.form=this.vacio();this.errorForm.set('');this.modalProducto.set(true);}
  editar(p:any){this.editandoId=p.id;this.form={categoriaId:String(p.categoriaId),sku:p.sku,nombre:p.nombre,descripcion:p.descripcion??'',precio:p.precio,stock:p.stock,stockMinimo:p.stockMinimo,imagenUrl:p.imagenUrl??'',activo:p.activo};this.errorForm.set('');this.modalProducto.set(true);}

  // HU-013: "precio y stock deben ser numericos". Se valida antes de enviar
  // con las mismas reglas que la API, para dar el error junto al formulario.
  private validarProducto():string{
    const f=this.form;const vacio=(v:any)=>v===null||v===undefined||v==='';
    if(!f.categoriaId)return'Elige una categoría.';
    if(!/^[A-Z0-9][A-Z0-9-]{2,29}$/.test(f.sku??''))return'SKU: de 3 a 30 caracteres, solo letras, números y guiones.';
    if(!(f.nombre??'').trim())return'El nombre es obligatorio.';
    if(vacio(f.precio)||!/^\d+(\.\d{1,2})?$/.test(String(f.precio))||Number(f.precio)<=0||Number(f.precio)>99999.99)return'El precio debe ser un número mayor a 0, con hasta dos decimales.';
    if(!this.editandoId&&(vacio(f.stock)||!Number.isInteger(Number(f.stock))||Number(f.stock)<0||Number(f.stock)>100000))return'El stock inicial debe ser un número entero entre 0 y 100 000.';
    if(vacio(f.stockMinimo)||!Number.isInteger(Number(f.stockMinimo))||Number(f.stockMinimo)<0||Number(f.stockMinimo)>10000)return'El stock mínimo debe ser un número entero entre 0 y 10 000.';
    if(f.imagenUrl&&!/^https:\/\//i.test(f.imagenUrl.trim()))return'La imagen debe ser una dirección que empiece con https://';
    return'';
  }
  async guardarProducto(){const problema=this.validarProducto();this.errorForm.set(problema);if(problema)return;
    const f=this.form;const comun={categoriaId:Number(f.categoriaId),sku:f.sku,nombre:f.nombre.trim(),descripcion:f.descripcion?.trim()||null,precio:Number(f.precio),stockMinimo:Number(f.stockMinimo),imagenUrl:f.imagenUrl?.trim()||null};
    this.ocupado.set(true);try{
      if(this.editandoId)await firstValueFrom(this.api.put(`/productos/${this.editandoId}`,{...comun,activo:!!f.activo}));
      else await firstValueFrom(this.api.post('/productos',{...comun,stock:Number(f.stock),activo:true}));
      this.toast.exito(this.editandoId?'Producto actualizado.':'Producto creado.');this.modalProducto.set(false);await Promise.all([this.cargar(),this.cargarCategorias()]);
    }catch(e){this.errorForm.set(mensajeDeError(e,'No se pudo guardar el producto.'));}finally{this.ocupado.set(false);}}

  abrirAjuste(p:any){this.activo.set(p);this.ajuste={unidades:1,movimiento:'entrada',motivo:''};this.errorForm.set('');this.modalAjuste.set(true);}
  async guardarAjuste(){const n=Number(this.ajuste.unidades);
    if(!Number.isInteger(n)||n<1||n>10000){this.errorForm.set('Las unidades deben ser un número entero entre 1 y 10 000.');return;}
    if(!this.ajuste.motivo.trim()){this.errorForm.set('Indica el motivo del ajuste.');return;}
    this.ocupado.set(true);this.errorForm.set('');try{
      await firstValueFrom(this.api.post(`/productos/${this.activo().id}/stock`,{cantidad:(this.ajuste.movimiento==='salida'?-1:1)*n,motivo:this.ajuste.motivo.trim()}));
      this.toast.exito('Stock actualizado.');this.modalAjuste.set(false);await this.cargar();
    }catch(e){this.errorForm.set(mensajeDeError(e,'No se pudo ajustar el stock.'));}finally{this.ocupado.set(false);}}

  abrirCategorias(){this.nuevaCategoria='';this.editandoCategoria.set(null);this.errorCategorias.set('');this.modalCategorias.set(true);this.cargarCategorias();}
  editarCategoria(c:any){this.nombreCategoria=c.nombre;this.editandoCategoria.set(c.id);}
  async crearCategoria(){this.ocupado.set(true);this.errorCategorias.set('');try{
    await firstValueFrom(this.api.post('/categorias',{nombre:this.nuevaCategoria.trim(),activo:true}));
    this.toast.exito('Categoría creada.');this.nuevaCategoria='';await this.cargarCategorias();
  }catch(e){this.errorCategorias.set(mensajeDeError(e,'No se pudo crear la categoría.'));}finally{this.ocupado.set(false);}}
  async guardarCategoria(c:any,nombre:string,activo:boolean){this.ocupado.set(true);this.errorCategorias.set('');try{
    await firstValueFrom(this.api.put(`/categorias/${c.id}`,{nombre:nombre.trim(),activo}));
    this.toast.exito('Categoría actualizada.');this.editandoCategoria.set(null);await Promise.all([this.cargarCategorias(),this.cargar()]);
  }catch(e){this.errorCategorias.set(mensajeDeError(e,'No se pudo actualizar la categoría.'));}finally{this.ocupado.set(false);}}
}
