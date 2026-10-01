import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { cantidad, diaLima, fechaCorta, fechaHoraLima, hoyLima, mensajeDeError, soles } from '../core/helpers';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector:'app-panel', standalone:true, imports:[IconComponent],
  template:`
    <header class="bienvenida"><div><span>{{saludo()}}, {{auth.nombre().split(' ')[0]}}</span><h1>Este es el pulso de Rivervet</h1><p>Revisa la actividad reciente y organiza la atención del día.</p></div><button class="actualizar" (click)="cargar()"><app-icon name="refresh"/> Actualizar</button></header>

    <!-- HU-018: ventas, pedidos pendientes y citas DEL DIA. -->
    @if(auth.esAdmin()){
      <section class="indicadores">
        <article><div class="indicador-icon indicador-icon--teal"><app-icon name="shop"/></div><div><small>Ventas de hoy</small><strong>{{soles(ind()?.ventas?.total)}}</strong><span>{{cantidad(ind()?.ventas?.pedidos)}} pedidos cobrados</span></div></article>
        <article><div class="indicador-icon indicador-icon--violeta"><app-icon name="receipt"/></div><div><small>Pedidos pendientes</small><strong>{{cantidad(pendientes())}}</strong><span>Por cobrar o verificar</span></div></article>
        <article><div class="indicador-icon indicador-icon--azul"><app-icon name="calendar"/></div><div><small>Citas de hoy</small><strong>{{cantidad(citasHoy())}}</strong><span>{{cantidad(ind()?.citas?.atendidas)}} atendidas · {{cantidad(ind()?.citas?.programadas)}} por atender</span></div></article>
        <article><div class="indicador-icon indicador-icon--naranja"><app-icon name="box"/></div><div><small>Stock bajo</small><strong>{{cantidad(ind()?.productosStockBajo?.length)}}</strong><span>Productos por reponer</span></div></article>
      </section>
      @if(errorIndicadores()){<p class="rv-aviso rv-aviso--error">{{errorIndicadores()}}</p>}
    }

    <div class="panel-grid">
      <section class="agenda">
        <header><div><span>Agenda</span><h2>Próximas citas</h2></div><a href="/citas">Ver agenda completa →</a></header>
        @if(errorCitas()){<p class="rv-aviso rv-aviso--error">{{errorCitas()}}</p>}
        <div class="lista-citas">@for(c of citas();track c.id){<article><div class="fecha"><strong>{{dia(c.fechaHoraLima)}}</strong><span>{{mes(c.fechaHoraLima)}}</span></div><div class="paciente"><span class="pet"><app-icon name="paw"/></span><div><strong>{{c.mascotaNombre}}</strong><small>{{c.clienteNombre}}</small></div></div><div class="doctor"><small>Veterinario</small><strong>{{c.veterinarioNombre}}</strong></div><time>{{hora(c.fechaHoraLima)}}</time><span class="estado">Programada</span></article>}@empty{<div class="vacio"><span><app-icon name="calendar"/></span><strong>Agenda despejada</strong><p>No hay citas programadas para los próximos días.</p></div>}</div>
      </section>

      <aside class="resumen-dia"><div class="resumen-top"><span>Hoy</span><strong>{{fechaHoy}}</strong></div><div class="resumen-ilustracion"><img src="rivervet-profile.png" alt="Rivervet"></div><h3>Todo bajo control</h3><p>Tu agenda y los datos de tus pacientes están sincronizados.</p><div class="estado-api"><i></i><span>Sistema conectado</span></div></aside>
    </div>

    <!-- HU-012: vacunas y citas por vencer. El personal ve todas (con telefono
         para llamar al cliente); el cliente, solo las de sus mascotas. -->
    <section class="recordatorios">
      <header><div><span>Recordatorios</span><h2>Vacunas y citas por venir</h2></div>
        <label>Próximos <select [value]="dias()" (change)="cambiarDias($any($event.target).value)"><option value="7">7 días</option><option value="15">15 días</option><option value="30">30 días</option></select></label>
      </header>
      @if(errorRecordatorios()){<p class="rv-aviso rv-aviso--error">{{errorRecordatorios()}}</p>}
      <div class="recordatorios-grid">
        <div><h3>Vacunas por vencer</h3>
          @for(v of recordatorios()?.vacunas??[];track v.vacunaId){<article class="recordatorio"><span class="cuando" [class.cerca]="v.diasRestantes<=2">{{textoDias(v.diasRestantes)}}</span><div><strong>{{v.mascotaNombre}} · {{v.tipoVacuna}}</strong><small>Próxima dosis {{fechaCorta(v.proximaDosis)}}@if(auth.esPersonal()){ · {{v.clienteNombre}}}</small></div>@if(auth.esPersonal()&&v.clienteTelefono){<a class="contactar" [href]="'tel:'+v.clienteTelefono">{{v.clienteTelefono}}</a>}</article>}
          @empty{<p class="vacio-mini">Ninguna vacuna vence en este periodo.</p>}
        </div>
        <div><h3>Citas próximas</h3>
          @for(c of recordatorios()?.citas??[];track c.citaId){<article class="recordatorio"><span class="cuando">{{dia(c.fechaHoraLima)}} {{mes(c.fechaHoraLima)}}</span><div><strong>{{c.mascotaNombre}} · {{hora(c.fechaHoraLima)}}</strong><small>{{c.veterinarioNombre}}@if(auth.esPersonal()){ · {{c.clienteNombre}}}</small></div>@if(auth.esPersonal()&&c.clienteTelefono){<a class="contactar" [href]="'tel:'+c.clienteTelefono">{{c.clienteTelefono}}</a>}</article>}
          @empty{<p class="vacio-mini">No hay citas en este periodo.</p>}
        </div>
      </div>
    </section>`,
  styles:[`
    .bienvenida{display:flex;align-items:end;justify-content:space-between;gap:1rem;margin-bottom:2rem}.bienvenida>div>span{color:var(--rv-teal-700);font-size:.73rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.bienvenida h1{margin:.38rem 0 .45rem;font-size:2.15rem;letter-spacing:-.045em}.bienvenida p{margin:0;color:var(--rv-texto-suave)}.actualizar{display:flex;align-items:center;gap:.55rem;padding:.65rem .9rem;border:1px solid var(--rv-borde);border-radius:10px;background:white;color:var(--rv-navy);font-size:.78rem;font-weight:700;cursor:pointer}.actualizar app-icon{width:15px}.indicadores{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.4rem}.indicadores article{display:flex;align-items:flex-start;gap:.85rem;padding:1.15rem;border:1px solid var(--rv-borde);border-radius:16px;background:white;box-shadow:0 8px 24px rgba(16,34,84,.045)}.indicador-icon{display:grid;place-items:center;flex:0 0 40px;height:40px;border-radius:11px}.indicador-icon--teal{background:#e7f9f5;color:#0f8f77}.indicador-icon--azul{background:#edf4ff;color:#477cc1}.indicador-icon--violeta{background:#f3edff;color:#7856b8}.indicador-icon--naranja{background:#fff3e7;color:#ca7228}.indicadores small,.indicadores strong,.indicadores span{display:block}.indicadores small{color:var(--rv-texto-suave);font-size:.72rem}.indicadores strong{margin:.18rem 0;font:800 1.35rem var(--rv-fuente-titulo);color:var(--rv-navy);letter-spacing:-.035em}.indicadores span{color:var(--rv-texto-tenue);font-size:.65rem}
    .panel-grid{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:1.2rem}.agenda,.resumen-dia,.recordatorios{border:1px solid var(--rv-borde);border-radius:18px;background:white;box-shadow:0 10px 30px rgba(16,34,84,.045)}.agenda>header,.recordatorios>header{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.3rem 1.4rem;border-bottom:1px solid var(--rv-borde)}.agenda>header span,.recordatorios>header span{color:var(--rv-teal-700);font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.agenda h2,.recordatorios h2{margin:.2rem 0 0;font-size:1.15rem}.agenda>header a{color:var(--rv-navy);font-size:.72rem;font-weight:700}.lista-citas article{display:grid;grid-template-columns:52px minmax(150px,1.2fr) minmax(130px,1fr) 70px 80px;align-items:center;gap:1rem;padding:1rem 1.4rem;border-bottom:1px solid var(--rv-borde)}.lista-citas article:last-child{border:0}.fecha{display:grid;place-items:center;height:50px;border-radius:12px;background:var(--rv-navy-50)}.fecha strong,.fecha span{display:block}.fecha strong{font:800 1rem var(--rv-fuente-titulo);line-height:1}.fecha span{color:var(--rv-texto-tenue);font-size:.6rem;text-transform:uppercase}.paciente{display:flex;align-items:center;gap:.65rem}.pet{display:grid;place-items:center;width:35px;height:35px;border-radius:10px;background:var(--rv-teal-50);color:var(--rv-teal-700)}.paciente strong,.paciente small,.doctor strong,.doctor small{display:block}.paciente strong,.doctor strong{font-size:.78rem}.paciente small,.doctor small{color:var(--rv-texto-tenue);font-size:.67rem}time{color:var(--rv-navy);font-size:.78rem;font-weight:800}.estado{padding:.28rem .5rem;border-radius:99px;background:var(--rv-teal-50);color:var(--rv-teal-700);font-size:.62rem;font-weight:800;text-align:center}.vacio{text-align:center;padding:3.5rem 1rem}.vacio>span{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 1rem;border-radius:15px;background:var(--rv-navy-50);color:var(--rv-navy)}.vacio strong{display:block}.vacio p{color:var(--rv-texto-suave);font-size:.8rem}
    .resumen-dia{overflow:hidden;padding:1.3rem;text-align:center;background:linear-gradient(165deg,#fff,#f5fbfa)}.resumen-top{display:flex;justify-content:space-between;align-items:center}.resumen-top span{color:var(--rv-teal-700);font-size:.68rem;font-weight:800;text-transform:uppercase}.resumen-top strong{font-size:.72rem;color:var(--rv-texto-suave)}.resumen-ilustracion{width:150px;height:150px;margin:1.5rem auto .8rem;border-radius:50%;overflow:hidden;background:white;border:7px solid white;box-shadow:0 15px 35px rgba(20,41,94,.1)}.resumen-ilustracion img{width:100%;height:100%;object-fit:cover}.resumen-dia h3{font-size:1rem}.resumen-dia p{color:var(--rv-texto-suave);font-size:.76rem;line-height:1.6}.estado-api{display:flex;align-items:center;justify-content:center;gap:.45rem;margin-top:1.2rem;padding:.55rem;border-radius:10px;background:white;border:1px solid var(--rv-borde);font-size:.67rem;font-weight:700;color:var(--rv-texto-suave)}.estado-api i{width:7px;height:7px;border-radius:50%;background:var(--rv-teal);box-shadow:0 0 0 4px var(--rv-teal-100)}
    .recordatorios{margin-top:1.2rem}.recordatorios>header label{display:flex;align-items:center;gap:.5rem;color:var(--rv-texto-suave);font-size:.78rem;font-weight:700}.recordatorios select{padding:.35rem .5rem;border:1px solid var(--rv-borde);border-radius:8px;background:white;font:inherit}.recordatorios-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.4rem;padding:1.1rem 1.4rem 1.4rem}.recordatorios h3{margin:0 0 .6rem;font-size:.85rem}.recordatorio{display:flex;align-items:center;gap:.8rem;padding:.65rem 0;border-bottom:1px solid var(--rv-borde)}.recordatorio:last-child{border:0}.recordatorio strong,.recordatorio small{display:block}.recordatorio strong{font-size:.8rem}.recordatorio small{color:var(--rv-texto-tenue);font-size:.7rem}.cuando{flex:0 0 74px;padding:.3rem .4rem;border-radius:8px;background:var(--rv-navy-50);color:var(--rv-navy);font-size:.68rem;font-weight:800;text-align:center;text-transform:uppercase}.cuando.cerca{background:#fff3e7;color:#b05f17}.contactar{margin-left:auto;color:var(--rv-teal-700);font-size:.72rem;font-weight:800;white-space:nowrap}.vacio-mini{color:var(--rv-texto-suave);font-size:.78rem}
    @media(max-width:1150px){.indicadores{grid-template-columns:1fr 1fr}.panel-grid{grid-template-columns:1fr}.resumen-dia{display:none}}@media(max-width:760px){.bienvenida{align-items:start;flex-direction:column}.indicadores,.recordatorios-grid{grid-template-columns:1fr}.lista-citas article{grid-template-columns:48px 1fr 65px}.doctor,.estado{display:none}.recordatorios>header{flex-direction:column;align-items:start}}
  `]
})
export class PanelComponent {
  readonly auth=inject(AuthService); private readonly api=inject(ApiService);
  readonly ind=signal<any>(null); readonly pendientes=signal(0); readonly citas=signal<any[]>([]);
  readonly recordatorios=signal<any>(null); readonly dias=signal(7);
  readonly errorIndicadores=signal(''); readonly errorCitas=signal(''); readonly errorRecordatorios=signal('');
  readonly soles=soles; readonly cantidad=cantidad; readonly fechaHoraLima=fechaHoraLima; readonly fechaCorta=fechaCorta;
  readonly fechaHoy=new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short'}).format(new Date());
  constructor(){this.cargar();}
  saludo():string{const h=new Date().getHours();return h<12?'Buenos días':h<19?'Buenas tardes':'Buenas noches';}
  dia(fecha:string):string{return fecha?.slice(8,10)??'--';} mes(fecha:string):string{const m=Number(fecha?.slice(5,7));return ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][m-1]??'';} hora(fecha:string):string{return fecha?.slice(11,16)??'--:--';}
  citasHoy():number{const c=this.ind()?.citas;return c?(c.programadas??0)+(c.atendidas??0)+(c.noAsistio??0):0;}
  textoDias(n:number):string{return n<=0?'Hoy':n===1?'Mañana':`En ${n} días`;}

  async cargar():Promise<void>{
    if(this.auth.esAdmin())this.cargarIndicadores();
    this.cargarRecordatorios();
    try{const r=await firstValueFrom(this.api.get('/citas',{desde:hoyLima(),hasta:diaLima(7),estado:'programada'}));this.citas.set((r.items??r).slice(0,6));}catch(e){this.errorCitas.set(mensajeDeError(e));}
  }
  // La API da los indicadores de un rango; sin parametros devuelve el mes en
  // curso, asi que se pide solo HOY. "Pedidos pendientes" no se limita a hoy:
  // un pedido de ayer sin cobrar sigue pendiente, por eso se cuenta aparte.
  private async cargarIndicadores():Promise<void>{this.errorIndicadores.set('');try{
    const hoy=hoyLima();
    const [ind,porPagar,porVerificar]=await Promise.all([
      firstValueFrom(this.api.get('/indicadores',{desde:hoy,hasta:hoy})),
      firstValueFrom(this.api.get('/pedidos',{estado:'pendiente_pago',pagina:1,limite:1})),
      firstValueFrom(this.api.get('/pedidos',{estado:'pendiente_verificacion',pagina:1,limite:1}))]);
    this.ind.set(ind);this.pendientes.set((porPagar?.paginacion?.total??0)+(porVerificar?.paginacion?.total??0));
  }catch(e){this.errorIndicadores.set(mensajeDeError(e));}}
  private async cargarRecordatorios():Promise<void>{this.errorRecordatorios.set('');try{this.recordatorios.set(await firstValueFrom(this.api.get('/recordatorios',{dias:this.dias()})));}catch(e){this.errorRecordatorios.set(mensajeDeError(e));}}
  cambiarDias(valor:string):void{this.dias.set(Number(valor));this.cargarRecordatorios();}
}
