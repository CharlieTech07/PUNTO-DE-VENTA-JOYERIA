// client/src/pages/routes.ts
import { Routes } from '@angular/router';
import { ProductosComponent } from './productos/productos';
import { SucursalesComponent } from './sucursales/sucursales';

export const routes: Routes = [
  // Ruta por defecto: al entrar a http://localhost:4200/ te redirige directo a productos
  { path: '', redirectTo: 'productos', pathMatch: 'full' },

  // Cuando visites http://localhost:4200/productos se muestra este componente
  { path: 'productos', component: ProductosComponent },

  // Cuando visites http://localhost:4200/sucursales se muestra este componente
  { path: 'sucursales', component: SucursalesComponent },

  // Comodín: si escriben cualquier otra ruta inexistente, regresa a productos
  { path: '**', redirectTo: 'productos' }
];