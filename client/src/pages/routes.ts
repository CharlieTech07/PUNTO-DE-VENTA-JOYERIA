// client/src/pages/routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { InicioComponent } from './inicio/inicio';
import { DashboardComponent } from './dashboard/dashboard';
import { ProductosComponent } from './productos/productos';
import { SucursalesComponent } from './sucursales/sucursales';
import { InventarioComponent } from './inventario/inventario';

export const routes: Routes = [
  // Ruta por defecto: al entrar a http://localhost:4200/ te redirige directo a login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Cuando visites http://localhost:4200/login se muestra este componente
  { path: 'login', component: LoginComponent },

  // Cuando visites http://localhost:4200/inicio se muestra este componente
  { path: 'inicio', component: InicioComponent },

  // Cuando visites http://localhost:4200/dashboard se muestra este componente
  { path: 'dashboard', component: DashboardComponent },

  // Cuando visites http://localhost:4200/productos se muestra este componente
  { path: 'productos', component: ProductosComponent },

  // Cuando visites http://localhost:4200/sucursales se muestra este componente
  { path: 'sucursales', component: SucursalesComponent },

  // Cuando visites http://localhost:4200/inventario se muestra este componente
  { path: 'inventario', component: InventarioComponent },


  // Comodín: si escriben cualquier otra ruta inexistente, regresa a productos
  { path: '**', redirectTo: 'login' }
];