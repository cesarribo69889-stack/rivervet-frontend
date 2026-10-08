import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { API_URL, GRUPOS, ROLES } from './constants';
import { desempaquetar } from './helpers';
import { SessionService } from './session.service';
import { leerCookie, TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly usuario = signal<any | null>(null);
  readonly inicializando = signal(false);
  readonly autenticado = computed(() => !!this.tokens.token() && !!this.usuario());
  readonly rol = computed(() => this.usuario()?.rol ?? null);
  readonly nombre = computed(() => this.usuario()?.nombre ?? '');
  readonly esAdmin = computed(() => this.rol() === ROLES.ADMIN);
  readonly esPersonal = computed(() => GRUPOS.PERSONAL.includes(this.rol()));
  // Página de entrada: el personal llega a su panel; el cliente, a la tienda
  // (ninguna HU le pide un panel: las suyas son catálogo, carrito, pedidos y pagos).
  readonly inicio = computed(() => this.rol() === ROLES.CLIENTE ? '/tienda' : '/panel');
  private arranque?: Promise<any>;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(private http: HttpClient, private tokens: TokenService, private session: SessionService) {}

  login(datos: any): Promise<any> {
    return firstValueFrom(this.http.post(`${API_URL}/auth/login`, datos).pipe(map(desempaquetar))).then(s => { this.aplicar(s); return s; });
  }
  initialize(): Promise<any> {
    this.arranque ??= (async () => {
      if (!leerCookie('rv_csrf')) return null;
      this.inicializando.set(true);
      try { const s = await firstValueFrom(this.session.refresh()); this.aplicar(s); return s; }
      catch { this.limpiar(); return null; }
      finally { this.inicializando.set(false); }
    })();
    return this.arranque;
  }
  async logout(): Promise<void> {
    try { await firstValueFrom(this.http.post(`${API_URL}/auth/logout`, null)); } catch { /* limpieza local */ }
    this.limpiar();
  }
  async cambiarPassword(datos: any): Promise<any> {
    const r = await firstValueFrom(this.http.put(`${API_URL}/auth/password`, datos).pipe(map(desempaquetar)));
    this.limpiar(); return r;
  }
  puede(roles?: string[]): boolean { return this.autenticado() && (!roles?.length || roles.includes(this.rol())); }
  private aplicar(s: any): void {
    this.tokens.set(s.accessToken); this.usuario.set(s.usuario);
    if (this.timer) clearTimeout(this.timer);
    const ms = Math.max((s.expiraEn ?? 900) - 60, 30) * 1000;
    this.timer = setTimeout(() => firstValueFrom(this.session.refresh()).then(x => this.aplicar(x)).catch(() => this.limpiar()), ms);
  }
  private limpiar(): void { if (this.timer) clearTimeout(this.timer); this.tokens.clear(); this.usuario.set(null); }
}
