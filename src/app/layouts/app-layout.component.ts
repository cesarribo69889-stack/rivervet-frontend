import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { GRUPOS, NOMBRE_ROL, ROLES } from '../core/constants';
import { ToastService } from '../core/toast.service';
import { IconComponent } from '../shared/icon.component';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  template: `
    <div class="shell" [class.shell--menu]="menu()">
      <aside class="sidebar">
        <a routerLink="/" class="sidebar__marca"><app-logo [claro]="true" [alto]="42"/></a>

        <div class="sidebar__etiqueta">Navegación</div>
        <nav>
          @for (enlace of visibles(); track enlace.url) {
            <a [routerLink]="enlace.url" routerLinkActive="activo" (click)="menu.set(false)">
              <span class="nav-icon"><app-icon [name]="enlace.icono"/></span>
              <span>{{enlace.texto}}</span>
            </a>
          }
        </nav>

        <div class="sidebar__ayuda">
          <span class="ayuda-icon">+</span>
          <strong>¿Necesitas ayuda?</strong>
          <small>Contacta con recepción</small>
        </div>
        <a routerLink="/tienda" class="sidebar__tienda"><app-icon name="shop"/> Ir a la tienda</a>
      </aside>

      <section class="workspace">
        <header class="topbar">
          <button class="menu-btn" (click)="menu.update(v => !v)" aria-label="Abrir menú" title="Abrir menú">☰</button>
          <div class="topbar__titulo"><nav class="migas" aria-label="Estás en"><a [routerLink]="auth.inicio()">Inicio</a>@if(titulo()!=='Panel'&&titulo()!=='Resumen'){<span aria-hidden="true">›</span><span>{{titulo()}}</span>}</nav><h1>{{titulo()}}</h1></div>
          <div class="topbar__usuario">
            <a routerLink="/perfil" class="perfil-link" title="Mi cuenta">
              <img src="rivervet-profile.png" alt="Perfil de Rivervet">
              <span><strong>{{auth.nombre()}}</strong><small>{{rol()}}</small></span>
            </a>
            <button class="salir" (click)="salir()" aria-label="Cerrar sesión" title="Cerrar sesión">Salir</button>
          </div>
        </header>
        <main class="contenido"><router-outlet/></main>
      </section>

      @if (menu()) { <button class="velo" (click)="menu.set(false)" aria-label="Cerrar menú"></button> }
    </div>`,
  styles: [`
    .shell{min-height:100vh;background:var(--rv-fondo)}
    .sidebar{position:fixed;inset:0 auto 0 0;width:var(--rv-sidebar);z-index:50;display:flex;flex-direction:column;padding:1.35rem 1rem;background:#0c1b42;color:white;box-shadow:10px 0 40px rgba(8,19,47,.08)}
    .sidebar__marca{display:flex;padding:.15rem .55rem 1.65rem;border-bottom:1px solid rgba(255,255,255,.09)}
    .sidebar__etiqueta{padding:1.5rem .75rem .55rem;color:#7184ac;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.14em}
    nav{display:grid;gap:.35rem}nav a{display:flex;align-items:center;gap:.8rem;padding:.72rem .75rem;border:1px solid transparent;border-radius:12px;color:#aebbd5;font-size:.91rem;font-weight:600;transition:.18s ease}
    nav a:hover{color:white;background:rgba(255,255,255,.055)}nav a.activo{color:white;background:linear-gradient(135deg,rgba(35,195,165,.25),rgba(35,195,165,.12));border-color:rgba(65,217,187,.22);box-shadow:inset 3px 0 var(--rv-teal)}
    .nav-icon{display:grid;place-items:center;width:31px;height:31px;border-radius:9px;background:rgba(255,255,255,.055);color:#8da0c6}nav a.activo .nav-icon{background:var(--rv-teal);color:#073d35}
    .sidebar__ayuda{margin-top:auto;padding:1rem;border:1px solid rgba(123,220,200,.16);border-radius:15px;background:linear-gradient(145deg,rgba(35,195,165,.11),rgba(255,255,255,.025))}.sidebar__ayuda strong,.sidebar__ayuda small{display:block}.sidebar__ayuda strong{font-size:.82rem}.sidebar__ayuda small{margin-top:.2rem;color:#8da0c6;font-size:.72rem}.ayuda-icon{float:right;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--rv-teal);color:#073d35;font-weight:800}
    .sidebar__tienda{display:flex;align-items:center;justify-content:center;gap:.55rem;margin-top:.7rem;padding:.65rem;color:#95a6c7;font-size:.8rem;font-weight:700}.sidebar__tienda:hover{color:var(--rv-teal)}
    .workspace{min-height:100vh;margin-left:var(--rv-sidebar)}.topbar{position:sticky;top:0;z-index:30;height:var(--rv-topbar);display:flex;align-items:center;padding:0 2rem;background:rgba(255,255,255,.86);backdrop-filter:blur(18px);border-bottom:1px solid rgba(213,219,229,.75)}
    .migas{display:flex;align-items:center;gap:.35rem;color:var(--rv-texto-tenue);font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.11em}.migas a{color:var(--rv-texto-tenue)}.migas a:hover{color:var(--rv-teal-700)}.topbar h1{margin:.08rem 0 0;font-size:1.18rem;letter-spacing:-.025em}.topbar__usuario{margin-left:auto;display:flex;align-items:center;gap:.8rem}.perfil-link{display:flex;align-items:center;gap:.65rem;padding:.3rem .5rem;border-radius:12px}.perfil-link:hover{background:var(--rv-navy-50)}.perfil-link img{width:40px;height:40px;border-radius:11px;object-fit:cover;background:white;border:1px solid var(--rv-borde)}.perfil-link strong,.perfil-link small{display:block}.perfil-link strong{color:var(--rv-navy);font-size:.84rem}.perfil-link small{color:var(--rv-texto-tenue);font-size:.7rem}.salir{padding:.48rem .75rem;border:1px solid var(--rv-borde);border-radius:9px;background:white;color:var(--rv-texto-suave);font-size:.78rem;font-weight:700;cursor:pointer}.salir:hover{color:var(--rv-error);border-color:#efc1bd}
    .contenido{width:min(100%,1400px);padding:2.25rem 2rem 4rem}.menu-btn{display:none}.velo{position:fixed;inset:0;z-index:45;border:0;background:rgba(8,19,47,.5)}
    @media(max-width:960px){.sidebar{transform:translateX(-100%);transition:transform .22s ease}.shell--menu .sidebar{transform:none}.workspace{margin-left:0}.menu-btn{display:grid;place-items:center;margin-right:1rem;width:38px;height:38px;border:1px solid var(--rv-borde);border-radius:10px;background:white}.contenido{padding:1.5rem 1rem 3rem}.topbar{padding:0 1rem}.perfil-link span{display:none}}
  `]
})
export class AppLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly menu = signal(false);
  readonly titulo = signal('Panel');
  readonly enlaces: { url: string; texto: string; icono: string; roles: readonly string[] }[] = [
    { url: '/panel', texto: 'Resumen', icono: 'home', roles: GRUPOS.PERSONAL },
    { url: '/citas', texto: 'Agenda y citas', icono: 'calendar', roles: GRUPOS.PERSONAL },
    { url: '/mascotas', texto: 'Mascotas', icono: 'paw', roles: GRUPOS.PERSONAL },
    { url: '/historial', texto: 'Historial clínico', icono: 'medical', roles: GRUPOS.PERSONAL },
    { url: '/vacunas', texto: 'Vacunas', icono: 'vaccine', roles: GRUPOS.PERSONAL },
    { url: '/clientes', texto: 'Clientes', icono: 'users', roles: GRUPOS.PERSONAL },
    { url: '/inventario', texto: 'Inventario', icono: 'box', roles: GRUPOS.ADMIN_O_RECEPCION },
    { url: '/pedidos', texto: 'Pedidos', icono: 'receipt', roles: GRUPOS.ADMIN_O_RECEPCION },
    { url: '/metodos-pago', texto: 'Métodos de pago', icono: 'wallet', roles: [ROLES.ADMIN] },
    { url: '/usuarios', texto: 'Usuarios', icono: 'shield', roles: [ROLES.ADMIN] }
  ];
  // Este diseño es solo del personal. El cliente usa el de la tienda
  // (carrito, mis pedidos y mi cuenta en AreaClienteComponent).
  readonly visibles = computed(() => this.enlaces.filter(e => e.roles.includes(this.auth.rol())));
  readonly rol = computed(() => NOMBRE_ROL[this.auth.rol()] ?? '');

  constructor() {
    this.actualizarTitulo();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.actualizarTitulo());
  }
  private actualizarTitulo(): void {
    let ruta = this.router.routerState.snapshot.root;
    while (ruta.firstChild) ruta = ruta.firstChild;
    this.titulo.set(ruta.data['titulo'] ?? 'Panel');
  }
  async salir(): Promise<void> {
    await this.auth.logout();
    this.toast.exito('Sesión cerrada. ¡Hasta pronto!');
    await this.router.navigateByUrl('/');
  }
}
