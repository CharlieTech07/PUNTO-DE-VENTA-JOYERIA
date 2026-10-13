// client/src/pages/routes.ts
import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../guards/auth.guard';
import { LoginComponent } from './login/login';
import { InicioComponent } from './inicio/inicio';
import { DashboardComponent } from './dashboard/dashboard';
import { ProductosComponent } from './productos/productos';
import { SucursalesComponent } from './sucursales/sucursales';
import { InventarioComponent } from './inventario/inventario';

export const routes: Routes = [
  // Ruta raíz va al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Ruta pública
  { path: 'login', component: LoginComponent },

  // Rutas protegidas por autenticación
  { 
    path: 'inicio', 
    component: InicioComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    data: { roles: ['Administrador', 'Gerente'] } // Cajero no tiene acceso total
  },
  { 
    path: 'productos', 
    component: ProductosComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'inventario', 
    component: InventarioComponent, 
    canActivate: [authGuard]
  },
  { 
    path: 'sucursales', 
    component: SucursalesComponent, 
    canActivate: [authGuard],
    data: { roles: ['Administrador'] } // Solo el Administrador Global
  },

  // Redirección si la URL no existe
  { path: '**', redirectTo: 'login' }
];


