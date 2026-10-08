import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService); const router = inject(Router);
  await auth.initialize();
  return auth.autenticado() ? true : router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService); const router = inject(Router);
  return auth.puede(route.data['roles']) ? true : router.createUrlTree(['/sin-permiso']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService); const router = inject(Router);
  await auth.initialize();
  return auth.autenticado() ? router.createUrlTree([auth.inicio()]) : true;
};
