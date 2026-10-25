// client/src/pages/routes.ts
import { inject } from '@angular/core';
import { Routes, Router, CanActivateFn } from '@angular/router';
import { authGuard, roleGuard } from '../guards/auth.guard';
import { LoginComponent } from './login/login';
import { InicioComponent } from './inicio/inicio';
import { DashboardComponent } from './dashboard/dashboard';
import { ProductosComponent } from './productos/productos';
import { SucursalesComponent } from './sucursales/sucursales';
import { InventarioComponent } from './inventario/inventario';
import { LegalComponent } from './legal/legal';
import { ConfirmarLecturaComponent } from './confirmar-lectura/confirmar-lectura';

// Las sucursales ahora viven dentro del dashboard: esta ruta solo redirige hacia allá
const irASucursalesEnDashboard: CanActivateFn = () =>
  inject(Router).createUrlTree(['/dashboard'], { fragment: 'sucursales' });

export const routes: Routes = [
  // Ruta raíz va al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Ruta pública
  { path: 'login', component: LoginComponent },

  // Avisos legales: también públicos, se abren desde los enlaces del login
  { path: 'privacidad', component: LegalComponent, data: { documento: 'privacidad' } },
  { path: 'terminos', component: LegalComponent, data: { documento: 'terminos' } },

  // Confirmación de lectura de los términos: se abre desde el correo de bienvenida (con
  // ?clave=) o al entrar sin haberlos aceptado (el authGuard manda aquí)
  { path: 'confirmar-lectura', component: ConfirmarLecturaComponent },

  // Todas las demás rutas exigen sesión iniciada
  {
    path: 'inicio',
    component: InicioComponent,
    canActivate: [authGuard]
  },
  // El dashboard lo usan los tres roles; cada rol solo ve sus módulos dentro de él
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  // Productos: solo Administrador
  {
    path: 'productos',
    component: ProductosComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'] }
  },
  // Inventario: solo Gerente
  {
    path: 'inventario',
    component: InventarioComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Gerente'] }
  },
  {
    path: 'sucursales',
    component: SucursalesComponent,
    canActivate: [authGuard, irASucursalesEnDashboard]
  },
  // Redirección si la URL no existe
  { path: '**', redirectTo: 'login' }
];
