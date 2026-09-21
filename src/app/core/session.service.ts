import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, map, Observable, shareReplay } from 'rxjs';
import { API_URL } from './constants';
import { desempaquetar } from './helpers';
import { leerCookie, TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly raw: HttpClient;
  private enCurso?: Observable<any>;

  constructor(handler: HttpBackend, private tokens: TokenService) { this.raw = new HttpClient(handler); }

  refresh(): Observable<any> {
    if (!this.enCurso) {
      const csrf = leerCookie('rv_csrf');
      let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      if (csrf) headers = headers.set('X-CSRF-Token', csrf);
      this.enCurso = this.raw.post(`${API_URL}/auth/refresh`, null, { headers, withCredentials: true }).pipe(
        map(desempaquetar),
        map((sesion: any) => { this.tokens.set(sesion.accessToken); return sesion; }),
        finalize(() => { this.enCurso = undefined; }),
        shareReplay(1)
      );
    }
    return this.enCurso;
  }
}
