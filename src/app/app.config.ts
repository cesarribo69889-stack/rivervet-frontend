import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { apiInterceptor } from './core/api.interceptor';

export const appConfig: ApplicationConfig = { providers: [provideBrowserGlobalErrorListeners(), provideHttpClient(withInterceptors([apiInterceptor])), provideRouter(routes, withInMemoryScrolling({ anchorScrolling:'enabled', scrollPositionRestoration:'enabled' }))] };
