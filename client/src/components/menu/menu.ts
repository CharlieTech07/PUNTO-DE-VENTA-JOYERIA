import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UsuarioSesion } from '../../services/auth.service';

export type TemaOlimpo = 'oscuro' | 'claro';

export interface MenuItem {
  vista: string;
  titulo: string;
  ruta: string;
  fragmento?: string;
  svgPath: string[];
  insignia?: number;
  rolesPermitidos?: ('Administrador' | 'Gerente' | 'Cajero')[]; // Control de acceso por rol
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class MenuComponent implements OnInit {
  private readonly CLAVE_TEMA = 'olimpo:tema';
  private authService: AuthService = inject(AuthService) as AuthService;
  private router = inject(Router);

  public temaActual: TemaOlimpo = 'oscuro';
  public usuarioActual: UsuarioSesion | null = null;

  // Catálogo completo de items del menú con sus permisos
  public readonly todosLosItems: MenuItem[] = [
    {
      vista: 'home',
      titulo: 'Home',
      ruta: '/inicio',
      svgPath: [
        'M3 10.5 12 3l9 7.5',
        'M5.5 9.5V20a1 1 0 001 1h11a1 1 0 001-1V9.5',
        'M9.5 21v-6h5v6'
      ],
      rolesPermitidos: ['Administrador', 'Gerente', 'Cajero']
    },
    {
      vista: 'resumen',
      titulo: 'Resumen',
      ruta: '/dashboard',
      fragmento: 'resumen',
      svgPath: [],
      rolesPermitidos: ['Administrador', 'Gerente']
    },
    {
      vista: 'ventas',
      titulo: 'Ventas',
      ruta: '/dashboard',
      fragmento: 'ventas',
      svgPath: [
        'M6 2 L3 7 v13 a1 1 0 001 1h16a1 1 0 001-1V7l-3-5z',
        'M3 7h18',
        'M16 11a4 4 0 01-8 0'
      ],
      rolesPermitidos: ['Administrador', 'Gerente', 'Cajero']
    },
    {
      vista: 'ingresos',
      titulo: 'Ingresos',
      ruta: '/dashboard',
      fragmento: 'ingresos',
      svgPath: ['M3 17l6-6 4 4 7-7', 'M14 8h6v6'],
      rolesPermitidos: ['Administrador', 'Gerente']
    },
    {
      vista: 'inventario',
      titulo: 'Inventario',
      ruta: '/dashboard',
      fragmento: 'inventario',
      insignia: 8,
      svgPath: [
        'M6 3h12l3 6-9 12L3 9z',
        'M3 9h18',
        'M12 3l-3 6 3 12 3-12-3-6z'
      ],
      rolesPermitidos: ['Administrador', 'Gerente']
    },
    {
      vista: 'apartados',
      titulo: 'Apartados',
      ruta: '/dashboard',
      fragmento: 'apartados',
      insignia: 3,
      svgPath: ['M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z'],
      rolesPermitidos: ['Administrador', 'Gerente', 'Cajero']
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
      ],
      rolesPermitidos: ['Administrador', 'Gerente']
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
      ],
      rolesPermitidos: ['Administrador', 'Gerente', 'Cajero']
    },
    {
      vista: 'auditoria',
      titulo: 'Auditoría',
      ruta: '/dashboard',
      fragmento: 'auditoria',
      svgPath: [
        'M12 2.5l8 3.2v6.1c0 4.7-3.3 8.4-8 9.7-4.7-1.3-8-5-8-9.7V5.7z',
        'M9 12l2 2 4-4.5'
      ],
      rolesPermitidos: ['Administrador'] // Exclusivo del Administrador Global
    }
  ];

  ngOnInit(): void {
    this.inicializarTema();
    this.usuarioActual = this.authService.obtenerUsuario();
  }

  // Devuelve únicamente los botones a los que el rol actual tiene acceso
  get itemsMenu(): MenuItem[] {
    if (!this.usuarioActual) {
      return this.todosLosItems;
    }
    return this.todosLosItems.filter(item =>
      !item.rolesPermitidos || item.rolesPermitidos.includes(this.usuarioActual!.rol)
    );
  }

  public cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  public alternarTema(): void {
    const nuevoTema: TemaOlimpo = this.temaActual === 'oscuro' ? 'claro' : 'oscuro';
    this.aplicarTema(nuevoTema);
  }

  private inicializarTema(): void {
    const temaGuardado = this.leerTemaGuardado();
    this.aplicarTema(temaGuardado ?? 'oscuro');
  }

  private leerTemaGuardado(): TemaOlimpo | null {
    try {
      const valor = localStorage.getItem(this.CLAVE_TEMA);
      return valor === 'claro' || valor === 'oscuro' ? valor : null;
    } catch {
      return null;
    }
  }

  private aplicarTema(tema: TemaOlimpo): void {
    this.temaActual = tema;
    document.documentElement.dataset['tema'] = tema;
    try {
      localStorage.setItem(this.CLAVE_TEMA, tema);
    } catch {}
  }
}