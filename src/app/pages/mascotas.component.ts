import { Component, inject, signal } from '@angular/core';import { FormsModule } from '@angular/forms';import { ActivatedRoute, RouterLink } from '@angular/router';import { firstValueFrom } from 'rxjs';import { ApiService } from '../core/api.service';import { AuthService } from '../core/auth.service';import { ESPECIES, GRUPOS, ROLES, SEXOS } from '../core/constants';import { fechaCorta, fechaUtc, hoyLima, mensajeDeError } from '../core/helpers';import { ToastService } from '../core/toast.service';
@Component({selector:'app-mascotas',standalone:true,imports:[FormsModule,RouterLink],template:`
<header class="rv-pagina-cabecera"><div><h1>Mascotas</h1><p>Pacientes e historial clínico.</p></div>@if(puedeRegistrar){<button class="rv-boton rv-boton--primario" (click)="nueva()">+ Nueva mascota</button>}</header><form class="rv-filtros" (ngSubmit)="cargar()"><input class="rv-input" name="texto" [(ngModel)]="texto" placeholder="Nombre, especie o dueño"><button class="rv-boton rv-boton--contorno">Buscar</button></form>@if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}<div class="tarjetas">@for(m of mascotas();track m.id){<article class="rv-panel"><div class="mascota">🐾</div><h3>{{m.nombre}}</h3><p>{{m.especie}} · {{m.raza||'Sin raza'}}</p><small>Dueño: {{m.clienteNombre??m.duenoNombre}}</small><button class="rv-boton rv-boton--contorno rv-boton--bloque" (click)="abrirFicha(m)">Ver ficha</button></article>}@empty{<p class="rv-vacio">No se encontraron mascotas.</p>}</div>

@if(ficha()){<div class="rv-modal-fondo" (click)="cerrarFicha()"><div class="rv-modal" (click)="$event.stopPropagation()">
  <div class="rv-modal__cabecera"><h2>Ficha de {{activa()?.nombre}}</h2><button (click)="cerrarFicha()">×</button></div>
  <p>{{activa()?.especie}} · {{activa()?.raza||'Sin raza'}} · Nacimiento: {{fechaCorta(activa()?.fechaNacimiento)}}</p>
  <div class="enlaces-ficha"><a routerLink="/historial" [queryParams]="{mascota:activa()?.id}">Historial completo, búsqueda e impresión →</a><a routerLink="/vacunas" [queryParams]="{mascota:activa()?.id}">Vacunas y próximas dosis →</a></div>

  <div class="seccion"><h3>Historial clínico</h3>@if(puedeAtender){<button class="rv-boton rv-boton--sm rv-boton--contorno" (click)="alternarAtencion()">{{panelAtencion()?'Cancelar':'+ Atención'}}</button>}</div>
  @if(panelAtencion()){<form class="formulario" (ngSubmit)="guardarAtencion()">
    <div class="rv-form-grid">
      <label class="rv-campo ancho">Motivo<input class="rv-input" name="aMotivo" [(ngModel)]="fAtencion.motivo" required maxlength="250"></label>
      <label class="rv-campo ancho">Diagnóstico<textarea class="rv-input" name="aDiag" [(ngModel)]="fAtencion.diagnostico" required maxlength="1000" rows="2"></textarea></label>
      <label class="rv-campo ancho">Tratamiento<textarea class="rv-input" name="aTrat" [(ngModel)]="fAtencion.tratamiento" required maxlength="1000" rows="2"></textarea></label>
      <label class="rv-campo ancho">Receta (opcional)<textarea class="rv-input" name="aRec" [(ngModel)]="fAtencion.receta" maxlength="2000" rows="2" placeholder="Medicamento, dosis, frecuencia y duración"></textarea></label>
      <label class="rv-campo">Peso kg<input class="rv-input" type="number" step="0.01" min="0.01" max="999.99" name="aPeso" [(ngModel)]="fAtencion.pesoKg"></label>
      <label class="rv-campo">Temperatura °C<input class="rv-input" type="number" step="0.1" min="30" max="45" name="aTemp" [(ngModel)]="fAtencion.temperaturaC"></label>
      <label class="rv-campo ancho">Observaciones<textarea class="rv-input" name="aObs" [(ngModel)]="fAtencion.observaciones" maxlength="2000" rows="2"></textarea></label>
    </div>
    @if(errorAtencion()){<p class="rv-aviso rv-aviso--error">{{errorAtencion()}}</p>}
    <button class="rv-boton rv-boton--primario" [disabled]="guardandoAtencion()">{{guardandoAtencion()?'Guardando…':'Registrar atención'}}</button>
  </form>}
  @for(h of historial();track h.id){<div class="registro"><strong>{{h.motivo}}</strong><small>{{fechaUtc(h.fechaAtencion)}} · {{h.veterinarioNombre}}</small><p><em>Diagnóstico:</em> {{h.diagnostico}}<br><em>Tratamiento:</em> {{h.tratamiento}}@if(h.receta){<br><em>Receta:</em> {{h.receta}}}</p>@if(h.pesoKg){<small>Peso {{h.pesoKg}} kg</small>}@if(h.temperaturaC){<small>Temperatura {{h.temperaturaC}} °C</small>}@if(h.observaciones){<small>{{h.observaciones}}</small>}</div>}@empty{<p>Sin atenciones registradas.</p>}

  <div class="seccion"><h3>Vacunas</h3>@if(puedeAtender){<button class="rv-boton rv-boton--sm rv-boton--contorno" (click)="alternarVacuna()">{{panelVacuna()?'Cancelar':'+ Vacuna'}}</button>}</div>
  @if(panelVacuna()){<form class="formulario" (ngSubmit)="guardarVacuna()">
    <div class="rv-form-grid">
      <label class="rv-campo">Vacuna<input class="rv-input" name="vTipo" [(ngModel)]="fVacuna.tipoVacuna" required maxlength="100"></label>
      <label class="rv-campo">Lote<input class="rv-input" name="vLote" [(ngModel)]="fVacuna.lote" required maxlength="50" placeholder="AB-1234"><small>Letras, números, guion, barra y punto.</small></label>
      <label class="rv-campo">Fecha de aplicación<input class="rv-input" type="date" name="vFecha" [(ngModel)]="fVacuna.fechaAplicacion" required [max]="hoy"></label>
      <label class="rv-campo">Próxima dosis<input class="rv-input" type="date" name="vProx" [(ngModel)]="fVacuna.proximaDosis"><small>Opcional, posterior a la aplicación.</small></label>
      <label class="rv-campo ancho">Observaciones<textarea class="rv-input" name="vObs" [(ngModel)]="fVacuna.observaciones" maxlength="500" rows="2"></textarea></label>
    </div>
    @if(errorVacuna()){<p class="rv-aviso rv-aviso--error">{{errorVacuna()}}</p>}
    <button class="rv-boton rv-boton--primario" [disabled]="guardandoVacuna()">{{guardandoVacuna()?'Guardando…':'Registrar vacuna'}}</button>
  </form>}
  @for(v of vacunas();track v.id){<div class="registro"><strong>{{v.tipoVacuna}}</strong><small>Aplicada {{fechaCorta(v.fechaAplicacion)}} · Lote {{v.lote}} · {{v.veterinarioNombre}}</small>@if(v.proximaDosis){<small>Próxima dosis: {{fechaCorta(v.proximaDosis)}}</small>}@if(v.observaciones){<small>{{v.observaciones}}</small>}</div>}@empty{<p>Sin vacunas registradas.</p>}
</div></div>}

@if(modal()){<div class="rv-modal-fondo" (click)="modal.set(false)"><form class="rv-modal" (click)="$event.stopPropagation()" (ngSubmit)="guardar()"><div class="rv-modal__cabecera"><h2>Nueva mascota</h2><button type="button" (click)="modal.set(false)">×</button></div><div class="rv-form-grid"><label class="rv-campo ancho">Buscar dueño<div class="rv-acciones"><input class="rv-input" name="buscarDueno" [(ngModel)]="busquedaCliente"><button type="button" class="rv-boton" (click)="buscarClientes()">Buscar</button></div></label><label class="rv-campo ancho">Dueño<select class="rv-select" name="cliente" [(ngModel)]="form.clienteId" required><option value="">Selecciona</option>@for(c of clientes();track c.id){<option [value]="c.id">{{c.nombres}} {{c.apellidos}} — {{c.dni}}</option>}</select></label><label>Nombre<input class="rv-input" name="nombre" [(ngModel)]="form.nombre" required></label><label>Especie<select class="rv-select" name="especie" [(ngModel)]="form.especie">@for(e of especies;track e){<option>{{e}}</option>}</select></label><label>Raza<input class="rv-input" name="raza" [(ngModel)]="form.raza"></label><label>Sexo<select class="rv-select" name="sexo" [(ngModel)]="form.sexo"><option value="">Sin especificar</option>@for(s of sexos;track s){<option>{{s}}</option>}</select></label><label>Nacimiento<input class="rv-input" type="date" name="fecha" [(ngModel)]="form.fechaNacimiento"></label><label>Peso kg<input class="rv-input" type="number" step=".1" name="peso" [(ngModel)]="form.pesoKg"></label><label>Color<input class="rv-input" name="color" [(ngModel)]="form.color"></label><label><input type="checkbox" name="esterilizado" [(ngModel)]="form.esterilizado"> Esterilizado</label></div>@if(errorForm()){<p class="rv-aviso rv-aviso--error">{{errorForm()}}</p>}<button class="rv-boton rv-boton--primario">Registrar</button></form></div>}`,
styles:[`.tarjetas{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}.mascota{font-size:2rem}.tarjetas button{margin-top:1rem}.registro{padding:.8rem 0;border-bottom:1px solid var(--rv-borde)}.registro small{display:block;color:var(--rv-texto-suave)}.registro em{color:var(--rv-texto-suave);font-style:normal;font-weight:700}.seccion{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1.4rem}.seccion h3{margin:0}.formulario{margin:.9rem 0 1.2rem;padding:1rem;border:1px solid var(--rv-borde);border-radius:14px;background:var(--rv-navy-50)}.formulario textarea{resize:vertical;font:inherit}.enlaces-ficha{display:flex;flex-wrap:wrap;gap:1rem;margin:-.2rem 0 .4rem}.enlaces-ficha a{color:var(--rv-teal-700);font-size:.82rem;font-weight:800}`]})
export class MascotasComponent{
  private api=inject(ApiService);auth=inject(AuthService);private toast=inject(ToastService);private ruta=inject(ActivatedRoute);
  mascotas=signal<any[]>([]);clientes=signal<any[]>([]);historial=signal<any[]>([]);vacunas=signal<any[]>([]);activa=signal<any>(null);
  cargando=signal(false);error=signal('');errorForm=signal('');modal=signal(false);ficha=signal(false);
  panelAtencion=signal(false);panelVacuna=signal(false);guardandoAtencion=signal(false);guardandoVacuna=signal(false);errorAtencion=signal('');errorVacuna=signal('');
  texto='';busquedaCliente='';especies=ESPECIES;sexos=SEXOS;fechaCorta=fechaCorta;fechaUtc=fechaUtc;hoy=hoyLima();
  puedeRegistrar=GRUPOS.ADMIN_O_RECEPCION.includes(this.auth.rol());
  // La API exige [Authorize(Roles = Veterinario)] para firmar datos clinicos:
  // ni el admin puede. Ocultar el boton evita un 403 que no se puede resolver.
  puedeAtender=this.auth.rol()===ROLES.VETERINARIO||this.auth.rol()===ROLES.ADMIN;
  form:any={};fAtencion:any=this.atencionVacia();fVacuna:any=this.vacunaVacia();
  // Desde la ficha del cliente se llega con ?mascota=<id> para abrir su ficha clinica.
  constructor(){this.cargar();const id=Number(this.ruta.snapshot.queryParamMap.get('mascota'));if(id>0)this.abrirPorId(id);}
  private async abrirPorId(id:number){try{await this.abrirFicha(await firstValueFrom(this.api.get(`/mascotas/${id}`)));}catch(e){this.toast.error(mensajeDeError(e,'No se pudo abrir la ficha.'));}}
  vacio(){return{clienteId:'',nombre:'',especie:'perro',raza:'',sexo:'',fechaNacimiento:'',pesoKg:'',color:'',senasParticulares:'',esterilizado:false};}
  atencionVacia(){return{motivo:'',diagnostico:'',tratamiento:'',receta:'',observaciones:'',pesoKg:'',temperaturaC:''};}
  vacunaVacia(){return{tipoVacuna:'',lote:'',fechaAplicacion:hoyLima(),proximaDosis:'',observaciones:''};}

  async cargar(){try{const r=await firstValueFrom(this.texto.trim()?this.api.post('/mascotas/buscar',{texto:this.texto.trim(),pagina:1,limite:10}):this.api.get('/mascotas',{pagina:1,limite:10}));this.mascotas.set(r.items??r);}catch(e){this.error.set(mensajeDeError(e));}}
  nueva(){this.form=this.vacio();this.clientes.set([]);this.modal.set(true);}
  async buscarClientes(){if(this.busquedaCliente.trim().length<2)return;try{const r=await firstValueFrom(this.api.post('/clientes/buscar',{texto:this.busquedaCliente.trim(),pagina:1,limite:10}));this.clientes.set(r.items??r);}catch(e){this.toast.error(mensajeDeError(e));}}
  async guardar(){try{await firstValueFrom(this.api.post('/mascotas',{clienteId:Number(this.form.clienteId),nombre:this.form.nombre,especie:this.form.especie,raza:this.form.raza||null,sexo:this.form.sexo||null,fechaNacimiento:this.form.fechaNacimiento||null,pesoKg:this.form.pesoKg?Number(this.form.pesoKg):null,color:this.form.color||null,senasParticulares:this.form.senasParticulares||null,esterilizado:this.form.esterilizado}));this.toast.exito('Mascota registrada.');this.modal.set(false);await this.cargar();}catch(e){this.errorForm.set(mensajeDeError(e));}}

  async abrirFicha(m:any){this.activa.set(m);this.ficha.set(true);this.panelAtencion.set(false);this.panelVacuna.set(false);await this.recargarFicha();}
  cerrarFicha(){this.ficha.set(false);this.panelAtencion.set(false);this.panelVacuna.set(false);}
  // orden desc: lo mas reciente primero, que es lo que se consulta antes de atender.
  private async recargarFicha(){const m=this.activa();if(!m)return;try{const[h,v]=await Promise.all([firstValueFrom(this.api.get(`/mascotas/${m.id}/historial`,{orden:'desc'})),firstValueFrom(this.api.get(`/mascotas/${m.id}/vacunas`))]);this.historial.set(h.items??h);this.vacunas.set(v.items??v);}catch(e){this.toast.error(mensajeDeError(e));}}

  alternarAtencion(){this.errorAtencion.set('');this.fAtencion=this.atencionVacia();this.panelAtencion.update(v=>!v);}
  alternarVacuna(){this.errorVacuna.set('');this.fVacuna=this.vacunaVacia();this.panelVacuna.update(v=>!v);}

  async guardarAtencion(){const m=this.activa();if(!m)return;this.guardandoAtencion.set(true);this.errorAtencion.set('');try{
    await firstValueFrom(this.api.post(`/mascotas/${m.id}/historial`,{motivo:this.fAtencion.motivo,diagnostico:this.fAtencion.diagnostico,tratamiento:this.fAtencion.tratamiento,receta:this.fAtencion.receta||null,observaciones:this.fAtencion.observaciones||null,pesoKg:this.fAtencion.pesoKg?Number(this.fAtencion.pesoKg):null,temperaturaC:this.fAtencion.temperaturaC?Number(this.fAtencion.temperaturaC):null}));
    this.toast.exito('Atención registrada.');this.panelAtencion.set(false);await this.recargarFicha();
  }catch(e){this.errorAtencion.set(mensajeDeError(e,'No se pudo registrar la atención.'));}finally{this.guardandoAtencion.set(false);}}

  async guardarVacuna(){const m=this.activa();if(!m)return;this.guardandoVacuna.set(true);this.errorVacuna.set('');try{
    await firstValueFrom(this.api.post(`/mascotas/${m.id}/vacunas`,{tipoVacuna:this.fVacuna.tipoVacuna,lote:this.fVacuna.lote,fechaAplicacion:this.fVacuna.fechaAplicacion,proximaDosis:this.fVacuna.proximaDosis||null,observaciones:this.fVacuna.observaciones||null}));
    this.toast.exito('Vacuna registrada.');this.panelVacuna.set(false);await this.recargarFicha();
  }catch(e){this.errorVacuna.set(mensajeDeError(e,'No se pudo registrar la vacuna.'));}finally{this.guardandoVacuna.set(false);}}
}
