import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ROLES } from '../core/constants';
import { edadTexto, fechaHoraLima, fechaUtc, mensajeDeError } from '../core/helpers';
import { ToastService } from '../core/toast.service';

/** Día de Lima de una fecha UTC de la API (llega con 'Z'). */
const diaLima = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Lima' }) : '';

// Historial clínico de una mascota (Sprint 2, HU-006/HU-007).
// - Línea de tiempo, la atención más reciente primero, con búsqueda por
//   palabra y por rango de fechas (en el navegador: el historial de una
//   mascota es corto).
// - "Nueva atención" solo para el veterinario; puede vincularla a una cita
//   programada de la mascota, que así queda atendida (/historial?mascota=&cita=
//   llega desde el calendario o el panel con la cita ya elegida).
// - Corregir y eliminar: solo el veterinario que la registró (la API lo exige;
//   aquí solo se ocultan los botones a los demás).
@Component({selector:'app-historial',standalone:true,imports:[FormsModule],template:`
<header class="rv-pagina-cabecera no-imprimir"><div><h1>Historial clínico</h1><p>Atenciones de cada paciente, de la más reciente a la más antigua.</p></div>
  @if(mascota()){<div class="rv-acciones"><button class="rv-boton rv-boton--contorno" (click)="imprimir()" title="Imprimir o guardar como PDF">Imprimir</button>@if(puedeAtender){<button class="rv-boton rv-boton--primario" (click)="nuevaAtencion()">+ Nueva atención</button>}</div>}
</header>

<section class="selector rv-panel no-imprimir">
  <form class="buscar" (ngSubmit)="buscar()"><input class="rv-input" name="b" [(ngModel)]="textoMascota" placeholder="Buscar mascota por nombre o dueño"><button class="rv-boton rv-boton--contorno">Buscar</button></form>
  <div class="opciones">@for(m of opciones();track m.id){<button type="button" [class.activa]="m.id===mascota()?.id" (click)="elegir(m.id)">🐾 {{m.nombre}} <small>{{m.clienteNombre}}</small></button>}@empty{<span class="tenue">{{buscando()?'Buscando…':'Sin resultados.'}}</span>}</div>
</section>

@if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}

@if(mascota(); as m){
  <section class="paciente rv-panel">
    <div class="avatar">🐾</div>
    <div><h2>{{m.nombre}}</h2><p>{{capitalizar(m.especie)}} · {{m.raza||'Sin raza'}} · {{edad(m.fechaNacimiento)}}@if(m.pesoKg){ · {{m.pesoKg}} kg}</p><small>Dueño: {{m.clienteNombre}}</small></div>
    <div class="conteo"><strong>{{historial().length}}</strong><span>{{historial().length===1?'atención':'atenciones'}}</span></div>
  </section>

  <form class="rv-filtros no-imprimir">
    <input class="rv-input" name="kw" [(ngModel)]="palabra" placeholder="Buscar en diagnóstico, tratamiento…">
    <label>Desde<input class="rv-input" type="date" name="d" [(ngModel)]="desde"></label>
    <label>Hasta<input class="rv-input" type="date" name="h" [(ngModel)]="hasta"></label>
    @if(palabra||desde||hasta){<button type="button" class="rv-boton rv-boton--contorno" (click)="limpiarFiltros()">Limpiar</button>}
  </form>

  @if(cargando()){<div class="esqueletos">@for(i of [1,2,3];track i){<div class="rv-panel"><div class="rv-esqueleto" style="width:40%"></div><div class="rv-esqueleto" style="width:85%;margin-top:.7rem"></div></div>}</div>}
  @else{<ol class="linea">
    @for(h of filtrado();track h.id){<li>
      <button type="button" class="tarjeta rv-panel" (click)="ver(h)" title="Ver detalle completo">
        <div class="cabeza"><strong>{{h.motivo}}</strong><time>{{fechaUtc(h.fechaAtencion)}}</time></div>
        <p class="resumen"><b>Diagnóstico:</b> {{h.diagnostico}}</p>
        <p class="resumen solo-impresion"><b>Tratamiento:</b> {{h.tratamiento}}@if(h.receta){<br><b>Receta:</b> {{h.receta}}}@if(h.observaciones){<br><b>Observaciones:</b> {{h.observaciones}}}</p>
        <small>{{h.veterinarioNombre}}@if(h.citaId){ · Cita vinculada}@if(h.editado){ · <span class="editado" title="Corregida el {{fechaUtc(h.actualizadoEn)}}">editada</span>}</small>
      </button>
    </li>}
    @empty{<li class="rv-vacio rv-panel">{{historial().length?'Ninguna atención coincide con la búsqueda.':'Esta mascota aún no tiene atenciones registradas.'}}</li>}
  </ol>}
}

@if(detalle(); as h){<div class="rv-modal-fondo no-imprimir" (click)="detalle.set(null)"><div class="rv-modal" (click)="$event.stopPropagation()">
  <div class="rv-modal__cabecera"><h2>{{h.motivo}}</h2><button type="button" (click)="detalle.set(null)" title="Cerrar">×</button></div>
  <dl class="ficha">
    <dt>Fecha y hora</dt><dd>{{fechaUtc(h.fechaAtencion)}}</dd>
    <dt>Veterinario</dt><dd>{{h.veterinarioNombre}}</dd>
    <dt>Diagnóstico</dt><dd>{{h.diagnostico}}</dd>
    <dt>Tratamiento</dt><dd>{{h.tratamiento}}</dd>
    <dt>Receta</dt><dd>{{h.receta||'—'}}</dd>
    <dt>Observaciones</dt><dd>{{h.observaciones||'—'}}</dd>
    <dt>Peso</dt><dd>{{h.pesoKg?h.pesoKg+' kg':'—'}}</dd>
    <dt>Temperatura</dt><dd>{{h.temperaturaC?h.temperaturaC+' °C':'—'}}</dd>
    @if(h.citaId){<dt>Cita</dt><dd>Atención de la cita #{{h.citaId}}</dd>}
    @if(h.editado){<dt>Corregida</dt><dd>{{fechaUtc(h.actualizadoEn)}}</dd>}
  </dl>
  @if(esAutor(h)){<div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="editar(h)">Corregir</button><button type="button" class="rv-boton" (click)="eliminar(h)" [disabled]="guardando()">Eliminar</button></div>}
  @else if(puedeAtender){<p class="nota">Solo {{h.veterinarioNombre}} o el administrador pueden corregir o eliminar esta atención.</p>}
</div></div>}

@if(formulario()){<div class="rv-modal-fondo no-imprimir" (click)="formulario.set(false)"><form class="rv-modal" (click)="$event.stopPropagation()" (ngSubmit)="guardar()">
  <div class="rv-modal__cabecera"><h2>{{editandoId?'Corregir atención':'Nueva atención'}} — {{mascota()?.nombre}}</h2><button type="button" (click)="formulario.set(false)" title="Cerrar">×</button></div>
  <div class="rv-form-grid">
    @if(!editandoId){<label class="rv-campo ancho">Vincular con una cita (opcional)<select class="rv-select" name="cita" [(ngModel)]="f.citaId"><option value="">Sin cita (atención sin agendar)</option>@for(c of citasProgramadas();track c.id){<option [value]="c.id">{{fechaHoraLima(c.fechaHoraLima)}} — {{c.motivo}}</option>}</select><small>La cita elegida quedará como atendida.</small></label>}
    <label class="rv-campo ancho">Motivo<input class="rv-input" name="motivo" [(ngModel)]="f.motivo" required maxlength="250"></label>
    <label class="rv-campo ancho">Diagnóstico<textarea class="rv-input" name="diag" [(ngModel)]="f.diagnostico" required maxlength="1000" rows="3"></textarea></label>
    <label class="rv-campo ancho">Tratamiento<textarea class="rv-input" name="trat" [(ngModel)]="f.tratamiento" required maxlength="1000" rows="3"></textarea></label>
    <label class="rv-campo ancho">Receta (opcional)<textarea class="rv-input" name="receta" [(ngModel)]="f.receta" maxlength="2000" rows="3" placeholder="Medicamento, dosis, frecuencia y duración"></textarea></label>
    <label class="rv-campo">Peso kg<input class="rv-input" type="number" step="0.01" min="0.01" max="999.99" name="peso" [(ngModel)]="f.pesoKg"></label>
    <label class="rv-campo">Temperatura °C<input class="rv-input" type="number" step="0.1" min="30" max="45" name="temp" [(ngModel)]="f.temperaturaC"></label>
    <label class="rv-campo ancho">Observaciones<textarea class="rv-input" name="obs" [(ngModel)]="f.observaciones" maxlength="2000" rows="2"></textarea></label>
  </div>
  @if(editandoId){<p class="nota">La corrección queda registrada: la atención se mostrará como “editada” y se guarda lo que decía antes.</p>}
  @if(errorForm()){<p class="rv-aviso rv-aviso--error">{{errorForm()}}</p>}
  <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="formulario.set(false)">Cancelar</button><button class="rv-boton rv-boton--primario" [disabled]="guardando()">{{guardando()?'Guardando…':'Guardar'}}</button></div>
</form></div>}`,
styles:[`.selector{padding:1rem;margin-bottom:1rem}.buscar{display:flex;gap:.6rem}.buscar input{flex:1}
.opciones{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem}.opciones button{padding:.45rem .8rem;border:1px solid var(--rv-borde);border-radius:999px;background:white;cursor:pointer;font:inherit;font-weight:700}.opciones button.activa{border-color:var(--rv-teal);background:var(--rv-teal-50);color:var(--rv-teal-700)}.opciones small,.tenue{color:var(--rv-texto-suave);font-weight:400}
.paciente{display:flex;align-items:center;gap:1rem;margin-bottom:1rem;padding:1.1rem}.paciente h2{margin:0}.paciente p{margin:.2rem 0}.paciente small{color:var(--rv-texto-suave)}
.avatar{display:grid;place-items:center;flex:0 0 56px;height:56px;border-radius:16px;background:var(--rv-teal-50);font-size:1.8rem}
.conteo{margin-left:auto;text-align:center}.conteo strong{display:block;color:var(--rv-navy);font-size:1.6rem}.conteo span{color:var(--rv-texto-suave);font-size:.75rem}
.linea{list-style:none;margin:0;padding:0 0 0 1.1rem;border-left:2px solid var(--rv-borde)}.linea li{position:relative;margin-bottom:.8rem}.linea li::before{content:'';position:absolute;left:-1.47rem;top:1.15rem;width:12px;height:12px;border-radius:50%;background:var(--rv-teal);box-shadow:0 0 0 4px var(--rv-teal-50)}
.tarjeta{display:block;width:100%;padding:1rem;text-align:left;cursor:pointer;font:inherit}.tarjeta:hover{border-color:var(--rv-teal)}
.cabeza{display:flex;justify-content:space-between;gap:1rem}.cabeza time{color:var(--rv-texto-suave);font-size:.8rem;white-space:nowrap}
.resumen{display:-webkit-box;margin:.4rem 0;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical}.solo-impresion{display:none}
.tarjeta small{color:var(--rv-texto-suave)}.editado{padding:.05rem .45rem;border-radius:999px;background:#fff4e0;color:#8a5208;font-weight:700}
.esqueletos{display:grid;gap:.8rem}.esqueletos .rv-panel{padding:1rem}
.ficha{display:grid;grid-template-columns:auto 1fr;gap:.5rem 1rem;margin:1rem 0}.ficha dt{color:var(--rv-texto-suave);font-weight:700}.ficha dd{margin:0;white-space:pre-line}
.nota{color:var(--rv-texto-suave);font-size:.8rem}.rv-modal textarea{font:inherit;resize:vertical}.rv-campo small{color:var(--rv-texto-suave)}
.rv-modal__cabecera button{border:0;background:none;font-size:1.5rem;cursor:pointer}
@media print{.linea{border:0;padding:0}.linea li::before{display:none}.resumen{display:block;-webkit-line-clamp:unset}.solo-impresion{display:block}.tarjeta{break-inside:avoid}}
@media(max-width:600px){.paciente{flex-wrap:wrap}.conteo{margin-left:0}}`]})
export class HistorialComponent{
  private api=inject(ApiService);readonly auth=inject(AuthService);private toast=inject(ToastService);private ruta=inject(ActivatedRoute);private router=inject(Router);
  readonly puedeAtender=this.auth.rol()===ROLES.VETERINARIO||this.auth.rol()===ROLES.ADMIN;
  readonly fechaUtc=fechaUtc;readonly fechaHoraLima=fechaHoraLima;readonly edad=edadTexto;
  opciones=signal<any[]>([]);buscando=signal(false);textoMascota='';
  mascota=signal<any>(null);historial=signal<any[]>([]);citasProgramadas=signal<any[]>([]);
  cargando=signal(false);error=signal('');detalle=signal<any>(null);
  formulario=signal(false);guardando=signal(false);errorForm=signal('');editandoId:number|null=null;f:any={};
  palabra='';desde='';hasta='';
  // Filtro en el navegador: palabra en cualquier texto clínico y rango de días de Lima.
  // Método (no computed): palabra/desde/hasta son propiedades de ngModel, no signals.
  filtrado(){const p=this.palabra.trim().toLowerCase();return this.historial().filter(h=>{const d=diaLima(h.fechaAtencion);
    return(!p||[h.motivo,h.diagnostico,h.tratamiento,h.receta,h.observaciones,h.veterinarioNombre].some(t=>(t??'').toLowerCase().includes(p)))&&(!this.desde||d>=this.desde)&&(!this.hasta||d<=this.hasta);});}

  constructor(){
    this.cargarOpciones();
    const q=this.ruta.snapshot.queryParamMap;const id=Number(q.get('mascota'));const cita=Number(q.get('cita'));
    if(id>0)this.elegir(id).then(()=>{if(cita>0&&this.puedeAtender)this.nuevaAtencion(cita);});
  }
  capitalizar(t?:string){return t?t.charAt(0).toUpperCase()+t.slice(1):'';}
  esAutor(h:any){return this.puedeAtender&&(this.auth.esAdmin()||this.auth.usuario()?.id===h.veterinarioId);}
  limpiarFiltros(){this.palabra='';this.desde='';this.hasta='';}

  async cargarOpciones(){try{const r=await firstValueFrom(this.api.get('/mascotas',{pagina:1,limite:12}));this.opciones.set(r.items??r);}catch{/* el buscador sigue disponible */}}
  async buscar(){const t=this.textoMascota.trim();if(t.length<2){await this.cargarOpciones();return;}this.buscando.set(true);try{const r=await firstValueFrom(this.api.post('/mascotas/buscar',{texto:t,pagina:1,limite:12}));this.opciones.set(r.items??r);}catch(e){this.toast.error(mensajeDeError(e));}finally{this.buscando.set(false);}}

  async elegir(id:number){this.error.set('');this.cargando.set(true);this.detalle.set(null);this.limpiarFiltros();
    // La URL refleja la mascota elegida: se puede volver o compartir el enlace.
    this.router.navigate([],{queryParams:{mascota:id},replaceUrl:true});
    try{const[m,h]=await Promise.all([firstValueFrom(this.api.get(`/mascotas/${id}`)),firstValueFrom(this.api.get(`/mascotas/${id}/historial`,{orden:'desc'}))]);this.mascota.set(m);this.historial.set(h.items??h);}
    catch(e){this.mascota.set(null);this.historial.set([]);this.error.set(mensajeDeError(e,'No se pudo cargar el historial.'));}finally{this.cargando.set(false);}}
  private async recargar(){const m=this.mascota();if(!m)return;try{const h=await firstValueFrom(this.api.get(`/mascotas/${m.id}/historial`,{orden:'desc'}));this.historial.set(h.items??h);}catch(e){this.toast.error(mensajeDeError(e));}}

  ver(h:any){this.detalle.set(h);}
  imprimir(){window.print();}

  private vacio(){return{citaId:'',motivo:'',diagnostico:'',tratamiento:'',receta:'',observaciones:'',pesoKg:'',temperaturaC:''};}
  async nuevaAtencion(citaId?:number){const m=this.mascota();if(!m)return;this.editandoId=null;this.f=this.vacio();this.errorForm.set('');this.formulario.set(true);
    try{const c=await firstValueFrom(this.api.get(`/citas/mascota/${m.id}`,{estado:'programada'}));this.citasProgramadas.set(c);
      if(citaId){const cita=(c as any[]).find(x=>x.id===citaId);if(cita){this.f.citaId=String(citaId);this.f.motivo=cita.motivo;}}}catch{this.citasProgramadas.set([]);}}
  editar(h:any){this.detalle.set(null);this.editandoId=h.id;this.f={citaId:'',motivo:h.motivo,diagnostico:h.diagnostico,tratamiento:h.tratamiento,receta:h.receta??'',observaciones:h.observaciones??'',pesoKg:h.pesoKg??'',temperaturaC:h.temperaturaC??''};this.errorForm.set('');this.formulario.set(true);}

  async guardar(){const m=this.mascota();if(!m)return;this.guardando.set(true);this.errorForm.set('');
    const datos:any={motivo:this.f.motivo,diagnostico:this.f.diagnostico,tratamiento:this.f.tratamiento,receta:this.f.receta||null,observaciones:this.f.observaciones||null,pesoKg:this.f.pesoKg!==''&&this.f.pesoKg!=null?Number(this.f.pesoKg):null,temperaturaC:this.f.temperaturaC!==''&&this.f.temperaturaC!=null?Number(this.f.temperaturaC):null};
    try{
      if(this.editandoId)await firstValueFrom(this.api.put(`/mascotas/${m.id}/historial/${this.editandoId}`,datos));
      else await firstValueFrom(this.api.post(`/mascotas/${m.id}/historial`,{...datos,citaId:this.f.citaId?Number(this.f.citaId):null}));
      this.toast.exito(this.editandoId?'Atención corregida.':(this.f.citaId?'Atención registrada y cita marcada como atendida.':'Atención registrada.'));
      this.formulario.set(false);await this.recargar();
    }catch(e){this.errorForm.set(mensajeDeError(e,'No se pudo guardar la atención.'));}finally{this.guardando.set(false);}}

  async eliminar(h:any){const m=this.mascota();if(!m||!confirm(`¿Eliminar la atención "${h.motivo}"? Quedará constancia en la auditoría.`))return;this.guardando.set(true);
    try{await firstValueFrom(this.api.delete(`/mascotas/${m.id}/historial/${h.id}`));this.toast.exito('Atención eliminada.');this.detalle.set(null);await this.recargar();}
    catch(e){this.toast.error(mensajeDeError(e,'No se pudo eliminar.'));}finally{this.guardando.set(false);}}
}
