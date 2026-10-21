// client/src/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

// 1. Guard básico: Bloquea si no hay sesión iniciada
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }

  // Si no tiene token o sesión, lo expulsa al Login
  router.navigate(['/login']);
  return false;
};

// 2. Guard por roles: Bloquea según Administrador, Gerente o Cajero
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.obtenerUsuario();
  const rolesPermitidos: string[] = route.data?.['roles'] || [];

  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  // Si no se especificaron roles en la ruta o el rol del usuario está permitido
  if (rolesPermitidos.length === 0 || rolesPermitidos.includes(usuario.rol)) {
    return true;
  }

  // Si no tiene permiso, lo manda a inicio
  alert(`Acceso denegado: Tu perfil (${usuario.rol}) no tiene permisos para esta sección.`);
  router.navigate(['/inicio']);
  return false;
};