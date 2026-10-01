import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { GRUPOS, HORARIO, ROLES } from '../core/constants';
import { diaLima, fechaHoraLima, hoyLima, mensajeDeError, paramsLimpios } from '../core/helpers';
import { ToastService } from '../core/toast.service';

type Vista = 'semana' | 'dia' | 'lista';
type ModoDetalle = 'ver' | 'reprogramar' | 'cancelar';

const ESTADOS: Record<string, string> = { programada: 'Programada', atendida: 'Atendida', cancelada: 'Cancelada', no_asistio: 'No asistió' };

// Bloques de 30 minutos de 08:00 a 19:30: el mismo HorarioAtencion del backend.
const BLOQUES = Array.from({ length: 24 }, (_, i) => {
  const minutos = 8 * 60 + i * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
});

// Las fechas viajan como 'AAAA-MM-DD' (hora de Lima). Se construyen con el
// constructor local para sumar dias sin que la zona horaria mueva el dia.
const aFecha = (s: string) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
const aTexto = (f: Date) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
const sumarDias = (s: string, n: number) => { const f = aFecha(s); f.setDate(f.getDate() + n); return aTexto(f); };
const lunesDe = (s: string) => { const dia = aFecha(s).getDay(); return sumarDias(s, dia === 0 ? -6 : 1 - dia); };

@Component({selector:'app-citas',standalone:true,imports:[FormsModule],template:`
<header class="rv-pagina-cabecera"><div><h1>Agenda de citas</h1><p>{{horario}} · bloques de 30 minutos.</p></div>@if(puedeGestionar){<button class="rv-boton rv-boton--primario" (click)="abrirAgendar()">+ Agendar cita</button>}</header>

<div class="barra">
  <div class="vistas">@for(v of vistas;track v.id){<button type="button" [class.activa]="vista()===v.id" (click)="cambiarVista(v.id)">{{v.texto}}</button>}</div>
  @if(vista()!=='lista'){<div class="navegacion">
    <button type="button" class="rv-boton rv-boton--sm rv-boton--contorno" (click)="mover(-1)" aria-label="Anterior">‹</button>
    <button type="button" class="rv-boton rv-boton--sm rv-boton--contorno" (click)="irHoy()">Hoy</button>
    <button type="button" class="rv-boton rv-boton--sm rv-boton--contorno" (click)="mover(1)" aria-label="Siguiente">›</button>
    <strong class="rango">{{tituloRango()}}</strong>
  </div>}
</div>

<form class="rv-filtros" (ngSubmit)="cargar()">
  @if(vista()==='lista'){<label>Desde<input class="rv-input" type="date" name="desde" [(ngModel)]="desde"></label><label>Hasta<input class="rv-input" type="date" name="hasta" [(ngModel)]="hasta"></label>}
  <label>Estado<select class="rv-select" name="estado" [(ngModel)]="filtroEstado" (change)="cargar()"><option value="">Todos</option>@for(e of estados;track e){<option [value]="e">{{nombreEstado[e]}}</option>}</select></label>
  @if(auth.esPersonal()){<label>Veterinario<select class="rv-select" name="vet" [(ngModel)]="filtroVet" (change)="cargar()"><option value="">Todos</option>@for(v of veterinarios();track v.id){<option [value]="v.id">{{v.nombre}}</option>}</select></label>}
  @if(vista()==='lista'){<button class="rv-boton rv-boton--contorno">Filtrar</button>}
</form>
<div class="leyenda">@for(e of estados;track e){<span class="cita-chip estado--{{e}}">{{nombreEstado[e]}}</span>}</div>

@if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
@if(cargando()){<p>Cargando citas…</p>}

<!-- HU-010: semana de lunes a sabado (los domingos no se atiende). -->
@if(vista()==='semana'){<div class="semana rv-panel">
  @for(d of dias();track d){<section class="dia" [class.hoy]="d===hoy">
    <button type="button" class="cabecera-dia" (click)="verDia(d)" title="Ver el día completo"><span>{{nombreDia(d)}}</span><strong>{{numeroDia(d)}}</strong></button>
    @for(c of porDia()[d]??[];track c.id){<button type="button" class="cita estado--{{c.estado}}" (click)="verDetalle(c)"><span class="hora">{{horaDe(c)}}</span><span class="titulo">{{c.mascotaNombre}}</span><small>{{c.veterinarioNombre}}</small></button>}
    @empty{<p class="libre">Sin citas</p>}
  </section>}
</div>}

@if(vista()==='dia'){@if(esDomingo()){<p class="rv-vacio rv-panel">Los domingos no hay atención.</p>}@else{<div class="dia-agenda rv-panel">
  @for(b of bloques;track b){<div class="bloque"><span class="hora">{{b}}</span><div class="contenido">
    @for(c of porBloque()[b]??[];track c.id){<button type="button" class="cita estado--{{c.estado}}" (click)="verDetalle(c)"><span class="titulo">{{c.mascotaNombre}} · {{c.motivo}}</span><small>{{c.veterinarioNombre}} · {{c.clienteNombre}}</small></button>}
  </div></div>}
</div>}}

@if(vista()==='lista'){<div class="rv-tabla-wrap rv-panel"><table class="rv-tabla"><thead><tr><th>Fecha</th><th>Mascota</th><th>Veterinario</th><th>Motivo</th><th>Estado</th><th></th></tr></thead><tbody>
  @for(c of listaOrdenada();track c.id){<tr><td>{{fechaHoraLima(c.fechaHoraLima)}}</td><td><strong>{{c.mascotaNombre}}</strong><br><small>{{c.clienteNombre}}</small></td><td>{{c.veterinarioNombre}}</td><td>{{c.motivo}}</td><td><span class="cita-chip estado--{{c.estado}}">{{nombreEstado[c.estado]||c.estado}}</span></td><td><button class="rv-boton rv-boton--sm rv-boton--contorno" (click)="verDetalle(c)">Ver</button></td></tr>}
  @empty{<tr><td colspan="6" class="rv-vacio">No hay citas en este periodo.</td></tr>}
</tbody></table></div>}

<!-- Detalle de la cita: ver, reprogramar (HU-009) o cancelar con confirmacion. -->
@if(detalle(); as c){<div class="rv-modal-fondo" (click)="cerrarDetalle()"><div class="rv-modal" (click)="$event.stopPropagation()">
  <div class="rv-modal__cabecera"><h2>Cita de {{c.mascotaNombre}}</h2><button type="button" (click)="cerrarDetalle()">×</button></div>
  <span class="cita-chip estado--{{c.estado}}">{{nombreEstado[c.estado]||c.estado}}</span>

  @if(modoDetalle()==='ver'){
    <dl class="ficha">
      <dt>Fecha y hora</dt><dd>{{fechaHoraLima(c.fechaHoraLima)}}</dd>
      <dt>Mascota</dt><dd>{{c.mascotaNombre}}@if(c.mascotaEspecie){ ({{c.mascotaEspecie}})}</dd>
      <dt>Dueño</dt><dd>{{c.clienteNombre}}@if(c.clienteTelefono){ · {{c.clienteTelefono}}}</dd>
      <dt>Veterinario</dt><dd>{{c.veterinarioNombre}}</dd>
      <dt>Motivo</dt><dd>{{c.motivo}}</dd>
      @if(c.motivoCancelacion){<dt>Cancelación</dt><dd>{{c.motivoCancelacion}}</dd>}
    </dl>
    @if(c.estado==='programada'&&(puedeGestionar||puedeCancelar)){<div class="rv-acciones">
      @if(puedeGestionar){<button type="button" class="rv-boton rv-boton--contorno" (click)="iniciarReprogramar()">Reprogramar</button>}
      @if(puedeCancelar){<button type="button" class="rv-boton" (click)="iniciarCancelacion()">Cancelar cita</button>}
    </div>}
  }

  @if(modoDetalle()==='reprogramar'){<form class="sub" (ngSubmit)="guardarReprogramacion()">
    <div class="rv-form-grid">
      <label>Veterinario<select class="rv-select" name="rVet" [(ngModel)]="edicion.veterinarioId" (change)="cargarHorariosEdicion()" required>@for(v of veterinarios();track v.id){<option [value]="v.id">{{v.nombre}}</option>}</select></label>
      <label>Fecha<input class="rv-input" type="date" name="rFecha" [(ngModel)]="edicion.fecha" [min]="hoy" (change)="cargarHorariosEdicion()" required></label>
      <label>Hora<select class="rv-select" name="rHora" [(ngModel)]="edicion.hora" required><option value="">Selecciona</option>@for(h of horariosEdicion();track h){<option [value]="h">{{h}}</option>}</select></label>
      <label>Motivo<input class="rv-input" name="rMotivo" [(ngModel)]="edicion.motivo" required maxlength="250"></label>
    </div>
    @if(avisoHorarioEdicion()){<p class="rv-aviso rv-aviso--aviso">{{avisoHorarioEdicion()}}</p>}
    @if(errorDetalle()){<p class="rv-aviso rv-aviso--error">{{errorDetalle()}}</p>}
    <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="modoDetalle.set('ver')">Volver</button><button class="rv-boton rv-boton--primario" [disabled]="guardandoDetalle()||!edicion.hora">{{guardandoDetalle()?'Guardando…':'Guardar cambios'}}</button></div>
  </form>}

  @if(modoDetalle()==='cancelar'){<form class="sub" (ngSubmit)="confirmarCancelacion()">
    <p>¿Seguro que quieres cancelar esta cita? El horario quedará libre para otra mascota.</p>
    <label class="rv-campo">Motivo de la cancelación<textarea class="rv-input" name="cMotivo" [(ngModel)]="motivoCancelacion" required maxlength="250" rows="2"></textarea></label>
    @if(errorDetalle()){<p class="rv-aviso rv-aviso--error">{{errorDetalle()}}</p>}
    <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="modoDetalle.set('ver')">Volver</button><button class="rv-boton" [disabled]="guardandoDetalle()||!motivoCancelacion.trim()">{{guardandoDetalle()?'Cancelando…':'Sí, cancelar cita'}}</button></div>
  </form>}
</div></div>}

<!-- HU-008: agendar. -->
@if(modal()){<div class="rv-modal-fondo" (click)="modal.set(false)"><form class="rv-modal" (click)="$event.stopPropagation()" (ngSubmit)="agendar()">
  <div class="rv-modal__cabecera"><h2>Agendar cita</h2><button type="button" (click)="modal.set(false)">×</button></div>
  <div class="rv-form-grid">
    <label class="ancho">Buscar mascota<div class="rv-acciones"><input class="rv-input" name="buscar" [(ngModel)]="busquedaMascota"><button type="button" class="rv-boton" (click)="buscarMascotas()">Buscar</button></div></label>
    <label class="ancho">Mascota<select class="rv-select" name="mascota" [(ngModel)]="nueva.mascotaId" required><option value="">Selecciona</option>@for(m of mascotas();track m.id){<option [value]="m.id">{{m.nombre}} — {{m.clienteNombre}}</option>}</select></label>
    <label>Veterinario<select class="rv-select" name="veterinario" [(ngModel)]="nueva.veterinarioId" (change)="disponibilidad()" required><option value="">Selecciona</option>@for(v of veterinarios();track v.id){<option [value]="v.id">{{v.nombre}}</option>}</select></label>
    <label>Fecha<input class="rv-input" type="date" name="fecha" [(ngModel)]="nueva.fecha" [min]="hoy" (change)="disponibilidad()" required></label>
    <label>Hora<select class="rv-select" name="hora" [(ngModel)]="nueva.hora" required><option value="">Selecciona</option>@for(h of horarios();track h){<option [value]="h">{{h}}</option>}</select></label>
    <label>Motivo<input class="rv-input" name="motivo" [(ngModel)]="nueva.motivo" required maxlength="250"></label>
  </div>
  @if(avisoHorario()){<p class="rv-aviso rv-aviso--aviso">{{avisoHorario()}}</p>}
  @if(errorForm()){<p class="rv-aviso rv-aviso--error">{{errorForm()}}</p>}
  <button class="rv-boton rv-boton--primario" [disabled]="guardandoNueva()">{{guardandoNueva()?'Agendando…':'Agendar'}}</button>
</form></div>}`,
styles:[`small{color:var(--rv-texto-suave)}
.barra{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}
.vistas{display:inline-flex;padding:.25rem;border:1px solid var(--rv-borde);border-radius:12px;background:white}
.vistas button{padding:.45rem .9rem;border:0;border-radius:9px;background:none;color:var(--rv-texto-suave);font-weight:700;cursor:pointer}
.vistas button.activa{background:var(--rv-navy);color:white}
.navegacion{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem}
.rango{margin-left:.5rem;color:var(--rv-navy);text-transform:capitalize}
.leyenda{display:flex;flex-wrap:wrap;gap:.5rem;margin:-.25rem 0 1rem}
.semana{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.6rem;padding:.75rem}
.dia{display:flex;flex-direction:column;gap:.4rem;min-height:220px;padding:.5rem;border:1px solid var(--rv-borde);border-radius:12px;background:white}
.dia.hoy{border-color:var(--rv-teal);box-shadow:inset 0 3px var(--rv-teal)}
.cabecera-dia{display:flex;justify-content:space-between;align-items:baseline;padding:.15rem .2rem .4rem;border:0;background:none;color:var(--rv-navy);text-transform:capitalize;cursor:pointer;font:inherit}
.cabecera-dia:hover{color:var(--rv-teal-700)}
.libre{margin:auto 0;color:var(--rv-texto-tenue);font-size:.78rem;text-align:center}
.cita{display:flex;flex-direction:column;align-items:flex-start;gap:.1rem;width:100%;padding:.45rem .55rem;border:0;border-left:4px solid;border-radius:8px;text-align:left;cursor:pointer;font:inherit}
.cita:hover{filter:brightness(.97)}
.cita .hora{font-size:.72rem;font-weight:800}.cita .titulo{color:var(--rv-navy);font-size:.82rem;font-weight:700}.cita small{font-size:.72rem}
.cita-chip{display:inline-flex;align-items:center;padding:.22rem .65rem;border:1px solid;border-radius:999px;color:var(--rv-navy);font-size:.75rem;font-weight:700}
.estado--programada{background:#e8f1ff;border-color:#2f6fdb}
.estado--atendida{background:#e6f7f1;border-color:#1f9d74}
.estado--cancelada{background:#f1f2f5;border-color:#9aa3b2}
.cita.estado--cancelada .titulo{color:var(--rv-texto-suave);text-decoration:line-through}
.estado--no_asistio{background:#fff4e0;border-color:#d98a12}
.dia-agenda{padding:.5rem 1rem}
.bloque{display:grid;grid-template-columns:4rem 1fr;gap:.75rem;min-height:2.4rem;padding:.35rem 0;border-bottom:1px dashed var(--rv-borde)}
.bloque .hora{padding-top:.45rem;color:var(--rv-texto-suave);font-size:.8rem;font-weight:700}
.bloque .contenido{display:grid;gap:.35rem}
.ficha{display:grid;grid-template-columns:auto 1fr;gap:.45rem 1rem;margin:1rem 0}.ficha dt{color:var(--rv-texto-suave);font-weight:700}.ficha dd{margin:0}
.sub{margin-top:1rem}.sub textarea{font:inherit;resize:vertical}
.rv-modal__cabecera button{border:0;background:none;font-size:1.5rem;cursor:pointer}
@media(max-width:900px){.semana{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:520px){.semana{grid-template-columns:1fr}}`]})
export class CitasComponent{
  private api=inject(ApiService);auth=inject(AuthService);private toast=inject(ToastService);
  readonly horario=HORARIO;readonly hoy=hoyLima();readonly bloques=BLOQUES;readonly fechaHoraLima=fechaHoraLima;
  readonly estados=Object.keys(ESTADOS);readonly nombreEstado=ESTADOS;
  readonly vistas:{id:Vista;texto:string}[]=[{id:'semana',texto:'Semana'},{id:'dia',texto:'Día'},{id:'lista',texto:'Lista'}];
  // Mismos permisos que la API: agendar y reprogramar, admin y recepcion;
  // cancelar, ademas el propio cliente. El veterinario solo consulta.
  readonly puedeGestionar=this.auth.puede(GRUPOS.ADMIN_O_RECEPCION);
  readonly puedeCancelar=this.auth.puede([...GRUPOS.ADMIN_O_RECEPCION,ROLES.CLIENTE]);

  citas=signal<any[]>([]);veterinarios=signal<any[]>([]);mascotas=signal<any[]>([]);horarios=signal<string[]>([]);
  error=signal('');cargando=signal(false);
  vista=signal<Vista>('semana');ancla=signal(hoyLima());
  filtroEstado='';filtroVet='';desde=hoyLima();hasta=diaLima(14);

  modal=signal(false);errorForm=signal('');avisoHorario=signal('');guardandoNueva=signal(false);
  nueva:any=this.citaVacia();busquedaMascota='';

  detalle=signal<any>(null);modoDetalle=signal<ModoDetalle>('ver');
  edicion:any={};horariosEdicion=signal<string[]>([]);avisoHorarioEdicion=signal('');
  motivoCancelacion='';errorDetalle=signal('');guardandoDetalle=signal(false);

  readonly dias=computed(()=>{const a=this.ancla();if(this.vista()==='dia')return[a];const lunes=lunesDe(a);return Array.from({length:6},(_,i)=>sumarDias(lunes,i));});
  readonly porDia=computed(()=>{const r:Record<string,any[]>={};for(const c of this.citas())(r[this.diaDe(c)]??=[]).push(c);for(const k in r)r[k].sort((x,y)=>this.horaDe(x).localeCompare(this.horaDe(y)));return r;});
  readonly porBloque=computed(()=>{const r:Record<string,any[]>={};for(const c of this.porDia()[this.ancla()]??[])(r[this.horaDe(c)]??=[]).push(c);return r;});
  readonly listaOrdenada=computed(()=>[...this.citas()].sort((x,y)=>(x.fechaHoraLima??'').localeCompare(y.fechaHoraLima??'')));
  readonly esDomingo=computed(()=>aFecha(this.ancla()).getDay()===0);
  readonly tituloRango=computed(()=>{
    const d=this.dias();
    if(this.vista()==='dia')return aFecha(d[0]).toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const corto=(s:string)=>aFecha(s).toLocaleDateString('es-PE',{day:'numeric',month:'short'});
    return `${corto(d[0])} – ${corto(d[d.length-1])} ${aFecha(d[d.length-1]).getFullYear()}`;
  });

  constructor(){this.cargar();if(this.auth.esPersonal())firstValueFrom(this.api.get('/veterinarios')).then(x=>this.veterinarios.set(x)).catch(()=>{});}

  horaDe(c:any){return(c.fechaHoraLima??'').slice(11,16);}
  diaDe(c:any){return(c.fechaHoraLima??'').slice(0,10);}
  nombreDia(d:string){return aFecha(d).toLocaleDateString('es-PE',{weekday:'short'}).replace('.','');}
  numeroDia(d:string){const f=aFecha(d);return `${f.getDate()}/${f.getMonth()+1}`;}

  async cargar(){this.cargando.set(true);this.error.set('');
    const d=this.dias();const [desde,hasta]=this.vista()==='lista'?[this.desde,this.hasta]:[d[0],d[d.length-1]];
    try{const r=await firstValueFrom(this.api.get('/citas',paramsLimpios({desde,hasta,estado:this.filtroEstado,veterinarioId:this.filtroVet})));this.citas.set(r.items??r);}
    catch(e){this.error.set(mensajeDeError(e));}finally{this.cargando.set(false);}}
  cambiarVista(v:Vista){this.vista.set(v);this.cargar();}
  mover(paso:number){this.ancla.set(sumarDias(this.ancla(),this.vista()==='semana'?7*paso:paso));this.cargar();}
  irHoy(){this.ancla.set(hoyLima());this.cargar();}
  verDia(d:string){this.ancla.set(d);this.vista.set('dia');this.cargar();}

  // La API devuelve TODOS los bloques del dia como {hora, fechaHoraLima, libre}.
  // Solo se ofrecen los libres; 'incluir' agrega el bloque que ocupa la propia
  // cita al reprogramarla, que figura ocupado justamente por ella.
  private async horasLibres(veterinarioId:any,fecha:string,incluir?:string):Promise<{horas:string[];aviso:string}>{
    if(!veterinarioId||!fecha)return{horas:[],aviso:''};
    try{
      const r=await firstValueFrom(this.api.get('/citas/disponibilidad',{veterinarioId,fecha}));
      if(!r.atiende)return{horas:[],aviso:'Ese día no hay atención (domingo).'};
      const horas=(r.horarios as any[]).filter(h=>h.libre||h.hora===incluir).map(h=>h.hora as string);
      return{horas,aviso:horas.length?'':'No quedan horarios libres ese día para este veterinario.'};
    }catch(e){return{horas:[],aviso:mensajeDeError(e)};}
  }

  citaVacia(){return{mascotaId:'',veterinarioId:'',fecha:hoyLima(),hora:'',motivo:''};}
  abrirAgendar(){this.nueva=this.citaVacia();this.mascotas.set([]);this.horarios.set([]);this.avisoHorario.set('');this.errorForm.set('');this.modal.set(true);}
  async buscarMascotas(){if(this.busquedaMascota.trim().length<2)return;try{const r=await firstValueFrom(this.api.post('/mascotas/buscar',{texto:this.busquedaMascota.trim(),pagina:1,limite:10}));this.mascotas.set(r.items??r);}catch(e){this.toast.error(mensajeDeError(e));}}
  async disponibilidad(){this.nueva.hora='';const r=await this.horasLibres(this.nueva.veterinarioId,this.nueva.fecha);this.horarios.set(r.horas);this.avisoHorario.set(r.aviso);}
  async agendar(){this.guardandoNueva.set(true);this.errorForm.set('');try{
    await firstValueFrom(this.api.post('/citas',{mascotaId:Number(this.nueva.mascotaId),veterinarioId:Number(this.nueva.veterinarioId),fechaHora:`${this.nueva.fecha}T${this.nueva.hora}`,motivo:this.nueva.motivo}));
    this.toast.exito('Cita agendada.');this.modal.set(false);
    // Se salta a la fecha agendada para que la cita se vea en el calendario.
    if(this.vista()!=='lista')this.ancla.set(this.nueva.fecha);await this.cargar();
  }catch(e){this.errorForm.set(mensajeDeError(e));}finally{this.guardandoNueva.set(false);}}

  verDetalle(c:any){this.detalle.set(c);this.modoDetalle.set('ver');this.errorDetalle.set('');}
  cerrarDetalle(){this.detalle.set(null);}
  async iniciarReprogramar(){const c=this.detalle();this.edicion={veterinarioId:String(c.veterinarioId),fecha:this.diaDe(c),hora:this.horaDe(c),motivo:c.motivo};this.errorDetalle.set('');this.modoDetalle.set('reprogramar');await this.cargarHorariosEdicion(true);}
  async cargarHorariosEdicion(conservarHora=false){const c=this.detalle();if(!c)return;
    const mismoBloque=String(c.veterinarioId)===String(this.edicion.veterinarioId)&&this.diaDe(c)===this.edicion.fecha;
    if(!conservarHora)this.edicion.hora='';
    const r=await this.horasLibres(this.edicion.veterinarioId,this.edicion.fecha,mismoBloque?this.horaDe(c):undefined);
    this.horariosEdicion.set(r.horas);this.avisoHorarioEdicion.set(r.aviso);}
  async guardarReprogramacion(){const c=this.detalle();this.guardandoDetalle.set(true);this.errorDetalle.set('');try{
    await firstValueFrom(this.api.put(`/citas/${c.id}`,{veterinarioId:Number(this.edicion.veterinarioId),fechaHora:`${this.edicion.fecha}T${this.edicion.hora}`,motivo:this.edicion.motivo}));
    this.toast.exito('Cita reprogramada.');this.detalle.set(null);
    if(this.vista()!=='lista')this.ancla.set(this.edicion.fecha);await this.cargar();
  }catch(e){this.errorDetalle.set(mensajeDeError(e,'No se pudo reprogramar.'));}finally{this.guardandoDetalle.set(false);}}
  iniciarCancelacion(){this.motivoCancelacion='';this.errorDetalle.set('');this.modoDetalle.set('cancelar');}
  async confirmarCancelacion(){const c=this.detalle();this.guardandoDetalle.set(true);this.errorDetalle.set('');try{
    await firstValueFrom(this.api.post(`/citas/${c.id}/cancelar`,{motivo:this.motivoCancelacion.trim()}));
    this.toast.exito('Cita cancelada.');this.detalle.set(null);await this.cargar();
  }catch(e){this.errorDetalle.set(mensajeDeError(e,'No se pudo cancelar.'));}finally{this.guardandoDetalle.set(false);}}
}
