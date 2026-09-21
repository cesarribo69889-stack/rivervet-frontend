import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  readonly token = signal<string | null>(null);
  set(token: string | null): void { this.token.set(token); }
  clear(): void { this.token.set(null); }
}

export function leerCookie(nombre: string): string | null {
  const prefijo = `${nombre}=`;
  const parte = document.cookie.split('; ').find(x => x.startsWith(prefijo));
  return parte ? decodeURIComponent(parte.slice(prefijo.length)) : null;
}
