import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { NOMBRE_ROL } from '../core/constants';
import { fechaUtc, mensajeDeError, paramsLimpios } from '../core/helpers';
import { ToastService } from '../core/toast.service';

// Personal con acceso al sistema. Solo admin (la API ya lo exige con
// [Authorize(Roles = Admin)]; el guard de la ruta evita el viaje inútil).
//
// Las cuentas de CLIENTE no se crean aquí sino desde Clientes, porque un
// cliente necesita además DNI, teléfono y consentimiento de datos. Por eso
// el alta solo ofrece los tres roles de personal.
@Component({selector:'app-usuarios',standalone:true,imports:[FormsModule],template:`
  <header class="rv-pagina-cabecera"><div><h1>Usuarios</h1><p>Personal con acceso al sistema.</p></div><button class="rv-boton rv-boton--primario" (click)="nuevo()">+ Nuevo usuario</button></header>
  <form class="rv-filtros" (ngSubmit)="cargar(1)"><label class="rv-campo"><span class="rv-campo__etiqueta">Rol</span><select class="rv-input" name="rol" [(ngModel)]="filtroRol" (change)="cargar(1)"><option value="">Todos</option>@for(r of rolesFiltro;track r){<option [value]="r">{{nombreRol[r]}}</option>}</select></label></form>
  @if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
  @if(cargando()){<p>Cargando usuarios…</p>}@else{<div class="rv-tabla-wrap rv-panel"><table class="rv-tabla"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th></th></tr></thead><tbody>
    @for(u of usuarios();track u.id){<tr><td><strong>{{u.nombre}}</strong></td><td>{{u.email}}</td><td><span class="rv-chip">{{nombreRol[u.rol]||u.rol}}</span></td><td><span class="rv-chip" [class.inactivo]="!u.activo">{{u.activo?'Activo':'Inactivo'}}</span></td><td><small>{{fecha(u.ultimoLoginEn)}}</small></td><td><div class="rv-acciones"><button class="rv-boton rv-boton--sm rv-boton--contorno" (click)="editar(u)">Editar</button></div></td></tr>}
    @empty{<tr><td colspan="6" class="rv-vacio">No hay usuarios con ese filtro.</td></tr>}
  </tbody></table></div>}
  @if(modal()){<div class="rv-modal-fondo" (click)="modal.set(false)"><form class="rv-modal" (click)="$event.stopPropagation()" (ngSubmit)="guardar()">
    <div class="rv-modal__cabecera"><h2>{{editandoId?'Editar':'Nuevo'}} usuario</h2><button type="button" (click)="modal.set(false)">×</button></div>
    <div class="rv-form-grid">
      <label class="rv-campo ancho">Nombre completo<input class="rv-input" name="nombre" [(ngModel)]="form.nombre" required maxlength="100"></label>
      @if(!editandoId){<label class="rv-campo ancho">Correo electrónico<input class="rv-input" type="email" name="email" [(ngModel)]="form.email" required></label>
      <label class="rv-campo ancho">Contraseña<input class="rv-input" type="password" name="password" [(ngModel)]="form.password" required><small>Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo.</small></label>}
      <label class="rv-campo">Rol<select class="rv-input" name="rol" [(ngModel)]="form.rol" required>@for(r of rolesAsignables();track r){<option [value]="r">{{nombreRol[r]}}</option>}</select></label>
      @if(editandoId){<label class="rv-campo">Estado<select class="rv-input" name="activo" [(ngModel)]="form.activo"><option [ngValue]="true">Activo</option><option [ngValue]="false">Inactivo</option></select></label>}
    </div>
    @if(editandoId){<p class="nota">El correo no se cambia desde aquí: es el identificador de la sesión. Desactivar a alguien le cierra el acceso sin borrar su historial.</p>}
    @if(errorForm()){<p class="rv-aviso rv-aviso--error">{{errorForm()}}</p>}
    <div class="rv-acciones"><button type="button" class="rv-boton rv-boton--contorno" (click)="modal.set(false)">Cancelar</button><button class="rv-boton rv-boton--primario" [disabled]="guardando()">{{guardando()?'Guardando…':'Guardar'}}</button></div>
  </form></div>}
`,styles:[`small{color:var(--rv-texto-suave)}.rv-modal__cabecera button{border:0;background:none;font-size:1.5rem;cursor:pointer}.rv-chip.inactivo{background:var(--rv-navy-50);color:var(--rv-texto-suave)}.nota{margin:.9rem 0 0;color:var(--rv-texto-suave);font-size:.78rem}`]})
export class UsuariosComponent{
  private api=inject(ApiService);private toast=inject(ToastService);
  usuarios=signal<any[]>([]);paginacion=signal<any>(null);cargando=signal(false);error=signal('');
  modal=signal(false);guardando=signal(false);errorForm=signal('');
  nombreRol=NOMBRE_ROL;fecha=fechaUtc;filtroRol='';editandoId:number|null=null;form:any=this.vacio();
  // El alta solo crea personal; 'cliente' aparece unicamente al editar a
  // alguien que ya lo es, para no degradarlo sin querer al guardar.
  readonly rolesPersonal=['admin','veterinario','recepcionista'];
  readonly rolesFiltro=['admin','veterinario','recepcionista','cliente'];
  rolEditado='';

  constructor(){this.cargar();}
  vacio(){return{nombre:'',email:'',password:'',rol:'veterinario',activo:true};}
  rolesAsignables(){return this.rolEditado==='cliente'?[...this.rolesPersonal,'cliente']:this.rolesPersonal;}

  async cargar(p=1){this.cargando.set(true);this.error.set('');try{
    const r=await firstValueFrom(this.api.get('/usuarios',paramsLimpios({pagina:p,limite:20,rol:this.filtroRol})));
    this.usuarios.set(r.items??r);this.paginacion.set(r.paginacion);
  }catch(e){this.error.set(mensajeDeError(e));}finally{this.cargando.set(false);}}

  nuevo(){this.editandoId=null;this.rolEditado='';this.form=this.vacio();this.errorForm.set('');this.modal.set(true);}
  editar(u:any){this.editandoId=u.id;this.rolEditado=u.rol;this.form={...this.vacio(),nombre:u.nombre,rol:u.rol,activo:u.activo};this.errorForm.set('');this.modal.set(true);}

  async guardar(){this.guardando.set(true);this.errorForm.set('');try{
    if(this.editandoId)await firstValueFrom(this.api.put(`/usuarios/${this.editandoId}`,{nombre:this.form.nombre,rol:this.form.rol,activo:this.form.activo}));
    else await firstValueFrom(this.api.post('/usuarios',{nombre:this.form.nombre,email:this.form.email,password:this.form.password,rol:this.form.rol}));
    this.toast.exito('Usuario guardado.');this.modal.set(false);await this.cargar(this.paginacion()?.pagina??1);
  }catch(e){this.errorForm.set(mensajeDeError(e,'No se pudo guardar.'));}finally{this.guardando.set(false);}}
}
