import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ROLES, VACUNAS_COMUNES } from '../core/constants';
import { fechaCorta, hoyLima, mensajeDeError } from '../core/helpers';
import { ToastService } from '../core/toast.service';

/** Días entre hoy (Lima) y una fecha 'AAAA-MM-DD'. */
function diasHasta(fecha?: string | null): number | null {
  if (!fecha) return null;
  const a = new Date(`${hoyLima()}T00:00:00`), b = new Date(`${fecha}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// Gestión de vacunas (Sprint 2, HU-011 y HU-012).
// - Alertas: vacunas cuya próxima dosis vence en 30 días ("Urgente" si faltan
//   menos de 7). El personal ve todas, con el teléfono del dueño para llamarlo;
//   un cliente, solo las de sus mascotas (la API filtra).
// - Tabla por mascota, registro con sugerencias según la especie, y corrección
//   o eliminación solo para el veterinario que la registró.
@Component({selector:'app-vacunas',standalone:true,imports:[FormsModule],template:`
<header class="rv-pagina-cabecera"><div><h1>Vacunas</h1><p>Dosis aplicadas, próximas fechas y alertas.</p></div>@if(puedeAtender&&mascota()){<button class="rv-boton rv-boton--primario" (click)="nueva()">+ Registrar vacuna</button>}</header>

<section class="alertas rv-panel">
  <header><h2>Próximas dosis <small>(30 días)</small></h2>@if(urgentes()){<span class="urgente">{{urgentes()}} urgente{{urgentes()===1?'':'s'}}</span>}</header>
  @if(cargandoAlertas()){<div class="rv-esqueleto" style="width:70%"></div>}
  @else{<div class="lista-alertas">@for(a of alertas();track a.vacunaId){<button type="button" class="alerta" [class.es-urgente]="a.diasRestantes<7" (click)="elegir(a.mascotaId)" title="Ver las vacunas de {{a.mascotaNombre}}">
    <span class="cuando">{{a.diasRestantes<=0?'Hoy':a.diasRestantes===1?'Mañana':'En '+a.diasRestantes+' días'}}</span>
    <span class="que"><strong>{{a.mascotaNombre}}</strong> · {{a.tipoVacuna}}<small>{{fechaCorta(a.proximaDosis)}}@if(esPersonal){ · {{a.clienteNombre}}@if(a.clienteTelefono){ · {{a.clienteTelefono}}}}</small></span>
    @if(a.diasRestantes<7){<span class="etiqueta">Urgente</span>}
  </button>}@empty{<p class="tenue">Ninguna vacuna vence en los próximos 30 días.</p>}</div>}
</section>

<section class="selector rv-panel">
  <form class="buscar" (ngSubmit)="buscar()"><input class="rv-input" name="b" [(ngModel)]="textoMascota" placeholder="Filtrar por mascota o dueño"><button class="rv-boton rv-boton--contorno">Buscar</button></form>
  <div class="opciones">@for(m of opciones();track m.id){<button type="button" [class.activa]="m.id===mascota()?.id" (click)="elegir(m.id)">🐾 {{m.nombre}} <small>{{m.clienteNombre}}</small></button>}@empty{<span class="tenue">Sin resultados.</span>}</div>
</section>

@if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
@if(mascota(); as m){
  <h2 class="titulo">{{m.nombre}} <small>{{m.especie}} · {{m.clienteNombre}}</small></h2>
  @if(cargando()){<div class="rv-panel"><div class="rv-esqueleto"></div></div>}
  @else{<div class="rv-tabla-wrap rv-panel"><table class="rv-tabla"><thead><tr><th>Vacuna</th><th>Aplicación</th><th>Próxima dosis</th><th>Lote</th><th>Veterinario</th><th></th></tr></thead><tbody>
    @for(v of vacunas();track v.id){<tr>
      <td><strong>{{v.tipoVacuna}}</strong>@if(v.observaciones){<br><small>{{v.observaciones}}</small>}</td>
      <td>{{fechaCorta(v.fechaAplicacion)}}</td>
      <td>@if(v.proximaDosis){<span>{{fechaCorta(v.proximaDosis)}}</span><br><small [class.texto-urgente]="dias(v.proximaDosis)!<7">{{estadoDosis(v.proximaDosis)}}</small>}@else{—}</td>
      <td><code>{{v.lote}}</code></td><td>{{v.veterinarioNombre}}</td>
      <td>@if(esAutor(v)){<div class="rv-acciones"><button class="rv-boton rv-boton--sm rv-boton--contorno" (click)="editar(v)">Corregir</button><button class="rv-boton rv-boton--sm" (click)="eliminar(v)" [disabled]="guardando()">Eliminar</button></div>}</td>
    </tr>}@empty{<tr><td colspan="6" class="rv-vacio">Sin vacunas registradas.</td></tr>}
  </tbody></table></div>}
}@else{<p class="rv-vacio rv-panel">Elige una mascota para ver sus vacunas.</p>}

@if(formulario()){<div class="rv-modal-fondo" (click)="formulario.set(false)"><form class="rv-modal" (click)="$event.stopPropagation()" (ngSubmit)="guardar()">
  <div class="rv-modal__cabecera"><h2>{{editandoId?'Corregir vacuna':'Registrar vacuna'}} — {{mascota()?.nombre}}</h2><button type="button" (click)="formulario.set(false)" title="Cerrar">×</button></div>
  <div class="rv-form-grid">
    <label class="rv-campo ancho">Vacuna<input class="rv-input" name="tipo" [(ngModel)]="f.tipoVacuna" required maxlength="100" list="vacunas-comunes" placeholder="Escribe o elige una"><datalist id="vacunas-comunes">@for(s of sugerencias();track s){<option [value]="s"></option>}</datalist></label>
    <label class="rv-campo">Fecha de aplicación<input class="rv-input" type="date" name="ap" [(ngModel)]="f.fechaAplicacion" required [max]="hoy"></label>
    <label class="rv-campo">Próxima dosis<input class="rv-input" type="date" name="px" [(ngModel)]="f.proximaDosis" [min]="f.fechaAplicacion"></label>
    <label class="rv-campo">Lote<input class="rv-input" name="lote" [(ngModel)]="f.lote" required maxlength="50" placeholder="AB-1234"><small>Letras, números, guion, barra y punto.</small></label>
    <label class="rv-campo ancho">Observaciones<textarea class="rv-input" name="obs" [(ngModel)]="f.observaciones" maxlength="500" rows="2"></textarea></label>
  </div>
  @if(errorForm()){<p class="rv-aviso rv-aviso--error">{{errorForm()}}</p>}
  <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="formulario.set(false)">Cancelar</button><button class="rv-boton rv-boton--primario" [disabled]="guardando()">{{guardando()?'Guardando…':'Guardar'}}</button></div>
</form></div>}`,
styles:[`.alertas,.selector{padding:1rem;margin-bottom:1rem}.alertas>header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.6rem}.alertas h2{margin:0;font-size:1.05rem}.alertas h2 small{color:var(--rv-texto-suave);font-weight:400}
.urgente{padding:.2rem .6rem;border-radius:999px;background:#fdeaea;color:#a62b2b;font-size:.75rem;font-weight:800}
.lista-alertas{display:grid;gap:.4rem}.alerta{display:flex;align-items:center;gap:.8rem;width:100%;padding:.55rem .7rem;border:1px solid var(--rv-borde);border-radius:10px;background:white;text-align:left;cursor:pointer;font:inherit}.alerta:hover{border-color:var(--rv-teal)}
.alerta.es-urgente{border-color:#efc1bd;background:#fff8f7}.cuando{flex:0 0 78px;color:var(--rv-navy);font-size:.75rem;font-weight:800;text-transform:uppercase}.que small{display:block;color:var(--rv-texto-suave);font-size:.75rem}
.etiqueta{margin-left:auto;padding:.15rem .55rem;border-radius:999px;background:#d64545;color:white;font-size:.7rem;font-weight:800}
.buscar{display:flex;gap:.6rem}.buscar input{flex:1}.opciones{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem}.opciones button{padding:.45rem .8rem;border:1px solid var(--rv-borde);border-radius:999px;background:white;cursor:pointer;font:inherit;font-weight:700}.opciones button.activa{border-color:var(--rv-teal);background:var(--rv-teal-50);color:var(--rv-teal-700)}.opciones small,.tenue{color:var(--rv-texto-suave);font-weight:400}
.titulo{margin:1.2rem 0 .6rem;font-size:1.2rem}.titulo small{color:var(--rv-texto-suave);font-size:.85rem;font-weight:400;text-transform:capitalize}
small{color:var(--rv-texto-suave)}.texto-urgente{color:#a62b2b;font-weight:700}
.rv-modal textarea{font:inherit;resize:vertical}.rv-modal__cabecera button{border:0;background:none;font-size:1.5rem;cursor:pointer}`]})
export class VacunasComponent{
  private api=inject(ApiService);readonly auth=inject(AuthService);private toast=inject(ToastService);private ruta=inject(ActivatedRoute);private router=inject(Router);
  readonly puedeAtender=this.auth.rol()===ROLES.VETERINARIO||this.auth.rol()===ROLES.ADMIN;readonly esPersonal=this.auth.esPersonal();
  readonly fechaCorta=fechaCorta;readonly hoy=hoyLima();readonly dias=diasHasta;
  alertas=signal<any[]>([]);cargandoAlertas=signal(false);urgentes=signal(0);
  opciones=signal<any[]>([]);textoMascota='';
  mascota=signal<any>(null);vacunas=signal<any[]>([]);cargando=signal(false);error=signal('');
  formulario=signal(false);guardando=signal(false);errorForm=signal('');editandoId:number|null=null;f:any={};

  constructor(){
    this.cargarAlertas();this.cargarOpciones();
    const id=Number(this.ruta.snapshot.queryParamMap.get('mascota'));if(id>0)this.elegir(id);
  }
  esAutor(v:any){return this.puedeAtender&&(this.auth.esAdmin()||this.auth.usuario()?.id===v.veterinarioId);}
  sugerencias(){const e=this.mascota()?.especie;return VACUNAS_COMUNES[e]??VACUNAS_COMUNES['otro'];}
  estadoDosis(fecha:string){const d=diasHasta(fecha)!;return d<0?`Vencida hace ${-d} día${d===-1?'':'s'}`:d===0?'Vence hoy':`En ${d} día${d===1?'':'s'}`;}

  async cargarAlertas(){this.cargandoAlertas.set(true);try{const r=await firstValueFrom(this.api.get('/recordatorios',{dias:30}));const v=r.vacunas??[];this.alertas.set(v);this.urgentes.set(v.filter((a:any)=>a.diasRestantes<7).length);}catch{this.alertas.set([]);}finally{this.cargandoAlertas.set(false);}}
  async cargarOpciones(){try{const r=await firstValueFrom(this.api.get('/mascotas',{pagina:1,limite:12}));this.opciones.set(r.items??r);}catch{/* queda el buscador */}}
  async buscar(){const t=this.textoMascota.trim();if(t.length<2){await this.cargarOpciones();return;}try{const r=await firstValueFrom(this.api.post('/mascotas/buscar',{texto:t,pagina:1,limite:12}));this.opciones.set(r.items??r);}catch(e){this.toast.error(mensajeDeError(e));}}

  async elegir(id:number){this.error.set('');this.cargando.set(true);this.router.navigate([],{queryParams:{mascota:id},replaceUrl:true});
    try{const[m,v]=await Promise.all([firstValueFrom(this.api.get(`/mascotas/${id}`)),firstValueFrom(this.api.get(`/mascotas/${id}/vacunas`))]);this.mascota.set(m);this.vacunas.set(v.items??v);}
    catch(e){this.mascota.set(null);this.vacunas.set([]);this.error.set(mensajeDeError(e,'No se pudieron cargar las vacunas.'));}finally{this.cargando.set(false);}}
  private async recargar(){const m=this.mascota();if(!m)return;try{this.vacunas.set(await firstValueFrom(this.api.get(`/mascotas/${m.id}/vacunas`)));}catch(e){this.toast.error(mensajeDeError(e));}await this.cargarAlertas();}

  nueva(){this.editandoId=null;this.f={tipoVacuna:'',fechaAplicacion:hoyLima(),proximaDosis:'',lote:'',observaciones:''};this.errorForm.set('');this.formulario.set(true);}
  editar(v:any){this.editandoId=v.id;this.f={tipoVacuna:v.tipoVacuna,fechaAplicacion:v.fechaAplicacion,proximaDosis:v.proximaDosis??'',lote:v.lote,observaciones:v.observaciones??''};this.errorForm.set('');this.formulario.set(true);}
  async guardar(){const m=this.mascota();if(!m)return;this.guardando.set(true);this.errorForm.set('');
    const datos={tipoVacuna:this.f.tipoVacuna,fechaAplicacion:this.f.fechaAplicacion,lote:this.f.lote,proximaDosis:this.f.proximaDosis||null,observaciones:this.f.observaciones||null};
    try{
      if(this.editandoId)await firstValueFrom(this.api.put(`/mascotas/${m.id}/vacunas/${this.editandoId}`,datos));
      else await firstValueFrom(this.api.post(`/mascotas/${m.id}/vacunas`,datos));
      this.toast.exito(this.editandoId?'Vacuna corregida.':'Vacuna registrada.');this.formulario.set(false);await this.recargar();
    }catch(e){this.errorForm.set(mensajeDeError(e,'No se pudo guardar la vacuna.'));}finally{this.guardando.set(false);}}
  async eliminar(v:any){const m=this.mascota();if(!m||!confirm(`¿Eliminar la vacuna "${v.tipoVacuna}" del ${fechaCorta(v.fechaAplicacion)}? Quedará constancia en la auditoría.`))return;this.guardando.set(true);
    try{await firstValueFrom(this.api.delete(`/mascotas/${m.id}/vacunas/${v.id}`));this.toast.exito('Vacuna eliminada.');await this.recargar();}
    catch(e){this.toast.error(mensajeDeError(e,'No se pudo eliminar.'));}finally{this.guardando.set(false);}}
}
