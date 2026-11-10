// client/src/components/menu/menu.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { puedeVer } from '../../models/permisos';

export interface UsuarioSesionLocal {
  id: number | string;
  nombreCompleto: string;
  correo: string;
  rol: 'Administrador' | 'Gerente' | 'Cajero';
  id_sucursal: number | null;
  nombre_sucursal: string;
}

export interface MenuItem {
  vista: string;
  titulo: string;
  ruta: string;
  fragmento?: string;
  svgPath: string[];
  insignia?: number;
  rolesPermitidos?: ('Administrador' | 'Gerente' | 'Cajero')[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class MenuComponent implements OnInit {
  private readonly CLAVE_TEMA = 'olimpo:tema';
  private authService = inject(AuthService);
  private router = inject(Router);

  public usuarioActual: UsuarioSesionLocal | null = null;

  // Orden del menú: Home, Productos, Inventario, Sucursales, Empleados, Precio del metal, Módulos.
  // Qué ve cada rol se define en models/permisos.ts
  public readonly todosLosItems: MenuItem[] = [
    {
      vista: 'home',
      titulo: 'Inicio',
      ruta: '/inicio',
      svgPath: [
        'M3 10.5 12 3l9 7.5',
        'M5.5 9.5V20a1 1 0 001 1h11a1 1 0 001-1V9.5',
        'M9.5 21v-6h5v6'
      ]
    },
    {
      vista: 'productos',
      titulo: 'Productos',
      ruta: '/dashboard',
      fragmento: 'productos',
      svgPath: [
        'M21 8l-9-5-9 5v8l9 5 9-5z',
        'M3 8l9 5 9-5',
        'M12 13v8'
      ]
    },
    {
      vista: 'inventario',
      titulo: 'Inventario',
      ruta: '/dashboard',
      fragmento: 'inventario',
      svgPath: [
        'M6 3h12l3 6-9 12L3 9z',
        'M3 9h18',
        'M12 3l-3 6 3 12 3-12-3-6z'
      ]
    },
    {
      vista: 'sucursales',
      titulo: 'Sucursales',
      ruta: '/dashboard',
      fragmento: 'sucursales',
      svgPath: [
        'M3 21h18',
        'M5 21V8l7-5 7 5v13',
        'M10 21v-6h4v6'
      ]
    },
    {
      vista: 'empleados',
      titulo: 'Empleados',
      ruta: '/dashboard',
      fragmento: 'empleados',
      svgPath: [
        'M2.5 20a6.5 6.5 0 0113 0',
        'M16 5.5a3.4 3.4 0 010 5.6',
        'M17.5 14.2A6.5 6.5 0 0121.5 20'
      ]
    },
    {
      vista: 'metal',
      titulo: 'Precio del metal',
      ruta: '/dashboard',
      fragmento: 'metal',
      svgPath: [
        'M12 3v18',
        'M5 7h14',
        'M5 7l-2.5 6a3.2 3.2 0 005 0z',
        'M19 7l-2.5 6a3.2 3.2 0 005 0z',
        'M8 21h8'
      ]
    },
    {
      vista: 'apartados',
      titulo: 'Módulos',
      ruta: '/dashboard',
      fragmento: 'apartados',
      svgPath: ['M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z']
    }
  ];

  ngOnInit(): void {
    this.inicializarTema();
    this.usuarioActual = this.authService.obtenerUsuario();
  }

  get itemsMenu(): MenuItem[] {
    const rol = this.usuarioActual?.rol;
    // Sin sesión no se muestra ningún módulo; Home es para todos los roles
    return this.todosLosItems.filter(item => item.vista === 'home' ? !!rol : puedeVer(rol, item.vista));
  }

  public cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  private inicializarTema(): void {
    try {
      const valor = localStorage.getItem(this.CLAVE_TEMA);
      const tema = valor === 'claro' || valor === 'oscuro' ? valor : 'oscuro';
      document.documentElement.dataset['tema'] = tema;
    } catch {
      document.documentElement.dataset['tema'] = 'oscuro';
    }
  }
}
