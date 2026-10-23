// client/src/services/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// 1) Agrega el token de sesión a todas las peticiones a la API.
// 2) Si el servidor responde 401 (sesión vencida o inválida), cierra sesión y manda al login.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const esApiPropia = req.url.includes('/api/');
  const esLogin = req.url.includes('/api/auth/login');
  const token = authService.obtenerToken();

  let peticion = req;
  if (esApiPropia && !esLogin && token && !req.headers.has('Authorization')) {
    peticion = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && esApiPropia && !esLogin) {
        authService.cerrarSesion();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
