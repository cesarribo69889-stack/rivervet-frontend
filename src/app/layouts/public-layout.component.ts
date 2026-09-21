import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { HORARIO } from '../core/constants';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-public-layout', standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="publico">
      <header class="cabecera"><div class="rv-contenedor fila">
        <a routerLink="/" class="marca"><app-logo [alto]="44"/></a>
        <button class="menu" (click)="abierto.update(v => !v)" aria-label="Abrir menú">☰</button>
        <nav [class.abierto]="abierto()">
          <a routerLink="/" routerLinkActive="activo" [routerLinkActiveOptions]="{exact:true}">Inicio</a>
          <a routerLink="/" fragment="servicios">Servicios</a>
          <a routerLink="/tienda" routerLinkActive="activo">Tienda</a>
          <a routerLink="/" fragment="contacto">Contacto</a>
          <a [routerLink]="auth.autenticado() ? '/panel' : '/login'" class="acceso">{{auth.autenticado() ? 'Ir al panel' : 'Acceso clientes'}} <span>→</span></a>
        </nav>
      </div></header>
      <main><router-outlet/></main>
      <footer id="contacto"><div class="rv-contenedor pie">
        <div class="pie__marca"><app-logo [claro]="true" [alto]="48"/><p>Salud, prevención y cariño para quienes hacen tu hogar más feliz.</p></div>
        <div><h3>Explora</h3><a routerLink="/">Inicio</a><a routerLink="/tienda">Tienda</a><a routerLink="/login">Mi cuenta</a></div>
        <div><h3>Horario</h3><p>{{horario}}</p><p>Lima, Perú</p></div>
      </div><div class="rv-contenedor legal"><span>© {{anio}} Rivervet</span><span>Centro Veterinario</span></div></footer>
    </div>`,
  styles: [`
    .publico{min-height:100vh;display:flex;flex-direction:column;background:white}.cabecera{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.9);backdrop-filter:blur(20px);border-bottom:1px solid rgba(227,234,244,.8)}.fila{min-height:82px;display:flex;align-items:center;justify-content:space-between}.marca{display:flex}nav{display:flex;align-items:center;gap:2rem}nav>a:not(.acceso){position:relative;color:#475467;font-size:.88rem;font-weight:600}nav>a:not(.acceso):hover,.activo{color:var(--rv-navy)!important}nav>a:not(.acceso)::after{content:'';position:absolute;left:0;right:100%;bottom:-8px;height:2px;border-radius:2px;background:var(--rv-teal);transition:.2s}.activo::after,nav>a:hover::after{right:0!important}.acceso{display:flex;align-items:center;gap:.7rem;padding:.65rem 1rem;border-radius:11px;background:var(--rv-navy);color:white;font-size:.82rem;font-weight:700;box-shadow:0 8px 20px rgba(20,41,94,.18)}.acceso:hover{color:white;background:var(--rv-navy-500)}.acceso span{color:var(--rv-teal)}.menu{display:none;border:1px solid var(--rv-borde);border-radius:10px;background:white;width:40px;height:40px}main{flex:1}footer{padding-top:4rem;background:#091735;color:#95a5c3}.pie{display:grid;grid-template-columns:1.7fr .7fr 1fr;gap:4rem;padding-bottom:3rem}.pie__marca p{max-width:380px;margin-top:1.2rem}.pie h3{color:white;font-size:.82rem;text-transform:uppercase;letter-spacing:.1em}.pie a{display:block;margin:.55rem 0;color:#aebbd3}.pie p{font-size:.88rem}.legal{display:flex;justify-content:space-between;padding-block:1.3rem;border-top:1px solid rgba(255,255,255,.1);font-size:.75rem}
    @media(max-width:800px){.menu{display:block}nav{display:none;position:absolute;top:82px;left:0;right:0;padding:1.3rem 20px 1.6rem;background:white;box-shadow:0 20px 40px rgba(16,34,84,.1);flex-direction:column;align-items:stretch;gap:1.1rem}.abierto{display:flex}.pie{grid-template-columns:1fr;gap:2rem}.legal{gap:1rem;flex-wrap:wrap}}
  `]
})
export class PublicLayoutComponent { readonly auth=inject(AuthService); readonly abierto=signal(false); readonly horario=HORARIO; readonly anio=new Date().getFullYear(); }
