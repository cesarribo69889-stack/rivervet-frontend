import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_URL } from './constants';
import { SessionService } from './session.service';
import { leerCookie, TokenService } from './token.service';

const ES_REINTENTO = new HttpContextToken<boolean>(() => false);

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);
  const tokens = inject(TokenService); const session = inject(SessionService); const router = inject(Router);
  const csrf = leerCookie('rv_csrf');
  const setHeaders: Record<string, string> = {};
  if (tokens.token()) setHeaders['Authorization'] = `Bearer ${tokens.token()}`;
  if (csrf) setHeaders['X-CSRF-Token'] = csrf;
  const solicitud = req.clone({ withCredentials: true, setHeaders });
  return next(solicitud).pipe(catchError((e: HttpErrorResponse) => {
    const sesion = /\/auth\/(login|refresh|logout)/.test(req.url);
    if (e.status !== 401 || sesion || req.context.get(ES_REINTENTO)) return throwError(() => e);
    return session.refresh().pipe(
      switchMap(() => next(req.clone({ withCredentials: true, context: req.context.set(ES_REINTENTO, true), setHeaders: { ...setHeaders, Authorization: `Bearer ${tokens.token()}` } }))),
      catchError(err => { tokens.clear(); router.navigate(['/login'], { queryParams: { redirect: router.url } }); return throwError(() => err); })
    );
  }));
};
