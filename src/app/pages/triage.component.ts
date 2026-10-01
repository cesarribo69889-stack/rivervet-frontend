import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ESPECIES, HORARIO, WHATSAPP_CLINICA } from '../core/constants';
import { mensajeDeError } from '../core/helpers';

// HU-021: triage ORIENTATIVO y publico (sirve a quien aun no es cliente).
// La API no guarda nada de lo consultado y devuelve siempre un descargo que
// debe mostrarse. Las reglas son conservadoras: ante la duda, urgencia alta.
//
// "Agendar desde el resultado": la API no deja agendar al cliente (solo
// admin y recepcion), asi que se deriva a la clinica por WhatsApp si
// WHATSAPP_CLINICA esta configurado, o al horario y contacto si no.
const TITULOS: Record<string, string> = { alta: 'Señales de alarma', media: 'Molestias', baja: 'Cosas leves' };

@Component({selector:'app-triage',standalone:true,imports:[FormsModule,RouterLink],template:`
<section class="triage"><div class="rv-contenedor angosto">
  <header class="encabezado"><span class="etiqueta">Orientación</span><h1>¿Mi mascota necesita atención urgente?</h1><p>Marca lo que observas y te diremos qué tan pronto conviene llevarla a consulta.</p></header>
  @if(descargo()){<p class="descargo">{{descargo()}}</p>}
  @if(errorCatalogo()){<p class="rv-aviso rv-aviso--error">{{errorCatalogo()}}</p>}

  @if(resultado(); as r){<div class="resultado urgencia--{{r.urgencia}}">
    <span class="nivel">Urgencia {{r.urgencia}}</span>
    <h2>{{r.recomendacion}}</h2>
    @if(r.motivos?.length){<p class="por">Por lo que marcaste:</p><ul>@for(m of r.motivos;track $index){<li>{{m}}</li>}</ul>}
    <div class="rv-acciones">
      @if(whatsapp){<a class="rv-boton rv-boton--primario" [href]="enlaceWhatsApp()" target="_blank" rel="noopener">{{r.urgencia==='alta'?'Avisar a la clínica por WhatsApp':'Pedir una cita por WhatsApp'}}</a>}
      @else{<a class="rv-boton rv-boton--primario" routerLink="/" fragment="contacto">Ver horario y contacto</a>}
      <button type="button" class="rv-boton rv-boton--contorno" (click)="reiniciar()">Hacer otra consulta</button>
    </div>
    @if(!whatsapp){<p class="horario">Atendemos {{horario.toLowerCase()}}. Acércate a recepción para agendar.</p>}
  </div>}
  @else{<form class="rv-panel formulario" (ngSubmit)="evaluar()">
    <div class="datos">
      <label class="rv-campo">Especie<select class="rv-select" name="especie" [(ngModel)]="especie" required>@for(e of especies;track e){<option [value]="e">{{capitalizar(e)}}</option>}</select></label>
      <label class="rv-campo">Edad aproximada<span class="edad"><input class="rv-input" type="number" min="0" max="50" name="anios" [(ngModel)]="anios" placeholder="Años"><input class="rv-input" type="number" min="0" max="11" name="meses" [(ngModel)]="meses" placeholder="Meses"></span></label>
      <label class="rv-campo">¿Desde cuándo?<select class="rv-select" name="horas" [(ngModel)]="horas"><option value="">No lo sé</option><option value="3">Hace unas horas</option><option value="12">Desde hoy</option><option value="48">Uno o dos días</option><option value="120">Varios días</option></select></label>
    </div>
    @for(g of grupos();track g.nivel){<fieldset><legend>{{g.titulo}}</legend><div class="sintomas">
      @for(s of g.sintomas;track s.codigo){<label class="sintoma" [class.marcado]="marcados().has(s.codigo)"><input type="checkbox" [checked]="marcados().has(s.codigo)" (change)="alternar(s.codigo)"><span>{{s.descripcion}}</span></label>}
    </div></fieldset>}
    @if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
    <button class="rv-boton rv-boton--primario" [disabled]="evaluando()||marcados().size===0">{{evaluando()?'Evaluando…':'Ver orientación'}}</button>
    @if(marcados().size===0){<small class="ayuda">Marca al menos un síntoma.</small>}
  </form>}
</div></section>`,
styles:[`.triage{min-height:70vh;padding:3rem 0;background:var(--rv-fondo)}.angosto{max-width:860px}
.encabezado{margin-bottom:1.2rem;text-align:center}.etiqueta{color:var(--rv-teal-700);font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em}.encabezado h1{margin:.4rem 0}.encabezado p{color:var(--rv-texto-suave)}
.descargo{margin:0 0 1.2rem;padding:.75rem 1rem;border-radius:12px;background:var(--rv-navy-50);color:var(--rv-texto-suave);font-size:.82rem;text-align:center}
.datos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-bottom:.6rem}.edad{display:flex;gap:.5rem}
fieldset{margin:1rem 0 0;padding:0;border:0}legend{margin-bottom:.6rem;font-weight:800;color:var(--rv-navy)}
.sintomas{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.5rem}
.sintoma{display:flex;align-items:flex-start;gap:.55rem;padding:.6rem .7rem;border:1px solid var(--rv-borde);border-radius:10px;background:white;font-size:.85rem;cursor:pointer}.sintoma input{margin-top:.15rem}.sintoma.marcado{border-color:var(--rv-teal);background:var(--rv-teal-50)}
.formulario>button{margin-top:1.4rem}.ayuda{display:block;margin-top:.5rem;color:var(--rv-texto-suave)}
.resultado{padding:1.6rem;border:1px solid var(--rv-borde);border-left:6px solid;border-radius:16px;background:white}
.nivel{display:inline-block;padding:.25rem .7rem;border-radius:999px;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.resultado h2{margin:.8rem 0;font-size:1.35rem;line-height:1.35}.por{margin:0;color:var(--rv-texto-suave);font-size:.85rem}.resultado ul{margin:.4rem 0 1.2rem;padding-left:1.2rem}
.horario{margin:1rem 0 0;color:var(--rv-texto-suave);font-size:.85rem}
.urgencia--alta{border-left-color:#d64545}.urgencia--alta .nivel{background:#fdeaea;color:#a62b2b}
.urgencia--media{border-left-color:#d98a12}.urgencia--media .nivel{background:#fff4e0;color:#8a5208}
.urgencia--baja{border-left-color:#1f9d74}.urgencia--baja .nivel{background:#e6f7f1;color:#0b5f47}
@media(max-width:700px){.datos{grid-template-columns:1fr}}`]})
export class TriageComponent{
  private api=inject(ApiService);
  readonly especies=ESPECIES;readonly horario=HORARIO;readonly whatsapp=WHATSAPP_CLINICA;
  sintomas=signal<any[]>([]);descargo=signal('');errorCatalogo=signal('');
  marcados=signal(new Set<string>());resultado=signal<any>(null);evaluando=signal(false);error=signal('');
  especie='perro';anios:number|null=null;meses:number|null=null;horas='';
  readonly grupos=computed(()=>['alta','media','baja'].map(nivel=>({nivel,titulo:TITULOS[nivel],sintomas:this.sintomas().filter(s=>s.nivel===nivel)})).filter(g=>g.sintomas.length));

  constructor(){firstValueFrom(this.api.get('/triage/sintomas')).then(r=>{this.sintomas.set(r.sintomas??[]);this.descargo.set(r.descargo??'');}).catch(e=>this.errorCatalogo.set(mensajeDeError(e,'No se pudo cargar la lista de síntomas.')));}
  capitalizar(t:string){return t.charAt(0).toUpperCase()+t.slice(1);}
  alternar(codigo:string){const s=new Set(this.marcados());s.has(codigo)?s.delete(codigo):s.add(codigo);this.marcados.set(s);}
  private edadMeses():number|null{if(this.anios==null&&this.meses==null)return null;return Math.max(0,Math.trunc(Number(this.anios??0))*12+Math.trunc(Number(this.meses??0)));}

  async evaluar(){this.evaluando.set(true);this.error.set('');try{
    const r=await firstValueFrom(this.api.post('/triage',{especie:this.especie,sintomas:[...this.marcados()],edadMeses:this.edadMeses(),horasConSintomas:this.horas?Number(this.horas):null}));
    this.resultado.set(r);if(r?.descargo)this.descargo.set(r.descargo);window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){this.error.set(mensajeDeError(e,'No se pudo evaluar.'));}finally{this.evaluando.set(false);}}
  reiniciar(){this.resultado.set(null);this.marcados.set(new Set());}
  // Solo especie y nivel de urgencia: los sintomas los cuenta el dueño si quiere.
  enlaceWhatsApp(){const r=this.resultado();const texto=`Hola, quisiera una cita para mi ${this.especie}. La orientación de la web indicó urgencia ${r?.urgencia}.`;return `https://wa.me/51${this.whatsapp}?text=${encodeURIComponent(texto)}`;}
}
