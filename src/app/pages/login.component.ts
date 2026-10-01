import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { mensajeDeError } from '../core/helpers';
import { ToastService } from '../core/toast.service';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector:'app-login', standalone:true, imports:[FormsModule, RouterLink, LogoComponent],
  template:`
    <div class="login">
      <section class="marca-panel">
        <a routerLink="/" class="volver">← Volver al inicio</a>
        <div class="decor decor--uno"></div><div class="decor decor--dos"></div>
        <div class="marca-contenido"><span class="mini">SALUD · PREVENCIÓN · CARIÑO</span><h2>Cuidamos a quienes<br>hacen tu hogar <em>feliz.</em></h2><p>Gestiona sus citas y mantén toda su historia clínica siempre contigo.</p><div class="mascotas"><img src="rivervet-profile.png" alt="Mascotas Rivervet"></div></div>
      </section>
      <main><form (ngSubmit)="entrar()">
        <app-logo [alto]="48"/><div class="encabezado"><span>Bienvenido de nuevo</span><h1>Inicia sesión</h1><p>Ingresa tus datos para acceder al panel.</p></div>
        @if(estadoApi()==='despertando'){<div class="rv-aviso rv-aviso--aviso">Despertando el servidor… La base de datos se pausa tras una hora sin uso y tarda unos segundos en volver. Puedes iniciar sesión igualmente.</div>}@if(estadoApi()==='caida'){<div class="rv-aviso rv-aviso--error">No se pudo contactar con la API. Si estás en local, inicia el backend.</div>}
        <label class="rv-campo"><span class="rv-campo__etiqueta">Correo electrónico</span><input class="rv-input" type="email" name="email" [(ngModel)]="datos.email" required autocomplete="username" placeholder="nombre@correo.com"></label>
        <label class="rv-campo"><span class="rv-campo__etiqueta">Contraseña</span><input class="rv-input" type="password" name="password" [(ngModel)]="datos.password" required autocomplete="current-password" placeholder="Tu contraseña"></label>
        @if(error()){<p class="rv-aviso rv-aviso--error">{{error()}}</p>}
        <button class="entrar" [disabled]="enviando()">{{enviando()?'Ingresando…':'Ingresar al panel'}} <span>→</span></button>
        <p class="seguridad">🔒 Tus datos están protegidos y viajan de forma segura.</p>
      </form></main>
    </div>`,
  styles:[`
    .login{min-height:100vh;display:grid;grid-template-columns:1.08fr .92fr;background:white}.marca-panel{position:relative;overflow:hidden;display:flex;min-height:100vh;padding:2.2rem 3rem;background:linear-gradient(145deg,#0b1b40,#10275b);color:white}.volver{position:relative;z-index:2;color:#aebbd3;font-size:.8rem;font-weight:700}.volver:hover{color:white}.marca-contenido{position:relative;z-index:2;margin:auto;max-width:580px}.mini{color:var(--rv-teal);font-size:.67rem;font-weight:800;letter-spacing:.14em}.marca-contenido h2{margin:1rem 0 1.2rem;color:white;font-size:clamp(2.7rem,5vw,4.5rem);line-height:1.06;letter-spacing:-.06em}.marca-contenido h2 em{color:var(--rv-teal);font-style:normal}.marca-contenido>p{max-width:480px;color:#aebbd3;font-size:1rem;line-height:1.7}.mascotas{width:310px;height:220px;margin:2.2rem auto -4rem;overflow:hidden;border-radius:50% 50% 0 0;background:white;box-shadow:0 20px 50px rgba(0,0,0,.25)}.mascotas img{width:100%;height:100%;object-fit:cover}.decor{position:absolute;border-radius:50%;border:1px solid rgba(35,195,165,.16)}.decor--uno{width:540px;height:540px;right:-180px;top:-190px}.decor--dos{width:320px;height:320px;left:-170px;bottom:-120px;background:rgba(35,195,165,.05)}main{display:grid;place-items:center;padding:3rem;background:linear-gradient(160deg,#fff,#f8fbfd)}form{width:min(430px,100%)}.encabezado{margin:2.8rem 0 2rem}.encabezado>span{color:var(--rv-teal-700);font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.encabezado h1{margin:.5rem 0 .6rem;font-size:2.5rem;letter-spacing:-.05em}.encabezado p{color:var(--rv-texto-suave)}.rv-campo{margin-bottom:1.15rem}.entrar{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:.8rem;padding:.9rem 1.1rem;border:0;border-radius:12px;background:var(--rv-navy);color:white;font-weight:800;cursor:pointer;box-shadow:0 12px 25px rgba(20,41,94,.2)}.entrar:hover{background:var(--rv-navy-500)}.entrar span{color:var(--rv-teal)}.entrar:disabled{opacity:.6}.seguridad{text-align:center;margin-top:1.2rem;color:var(--rv-texto-tenue);font-size:.72rem}
    @media(max-width:850px){.login{grid-template-columns:1fr}.marca-panel{display:none}main{padding:2rem 1.2rem}}
  `]
})
export class LoginComponent {
  private readonly auth=inject(AuthService); private readonly api=inject(ApiService); private readonly router=inject(Router); private readonly route=inject(ActivatedRoute); private readonly toast=inject(ToastService);
  readonly datos={email:'',password:''}; readonly enviando=signal(false); readonly error=signal('');
  // La base es serverless y se pausa a los 60 min de inactividad: la primera
  // visita recibe 503 mientras despierta. Eso NO es una caida, asi que se
  // reintenta en silencio antes de alarmar a nadie.
  readonly estadoApi=signal<'probando'|'ok'|'despertando'|'caida'>('probando');
  constructor(){this.comprobarApi();}
  private async comprobarApi(intento=1):Promise<void>{try{await firstValueFrom(this.api.get('/health'));this.estadoApi.set('ok');}catch(e){const codigo=(e as any)?.status;const despertando=codigo===503||codigo===504||codigo===0;if(despertando&&intento<8){this.estadoApi.set('despertando');setTimeout(()=>this.comprobarApi(intento+1),5000);}else{this.estadoApi.set(despertando?'despertando':'caida');}}}
  async entrar():Promise<void>{this.enviando.set(true);this.error.set('');try{const s=await this.intentarLogin();this.toast.exito(`¡Hola, ${s.usuario.nombre}!`);await this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirect')||'/panel');}catch(e){this.error.set(mensajeDeError(e,'No se pudo iniciar sesión.'));}finally{this.enviando.set(false);}}
  // Mientras la base despierta, el login puede responder 500 (la consulta
  // falla), no solo 503. Para no reintentar un 500 genuino se pregunta antes a
  // /health: si la base ya responde, el error es real y se muestra tal cual.
  private async intentarLogin(intento=1):Promise<any>{try{return await this.auth.login(this.datos);}catch(e){const codigo=(e as any)?.status;if([500,503,504].includes(codigo)&&intento<4&&!(await this.baseDisponible())){this.estadoApi.set('despertando');await new Promise(r=>setTimeout(r,6000));return this.intentarLogin(intento+1);}throw e;}}
  private async baseDisponible():Promise<boolean>{try{await firstValueFrom(this.api.get('/health'));return true;}catch{return false;}}

}
