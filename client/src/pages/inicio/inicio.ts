// client/src/pages/inicio/inicio.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../../components/menu/menu';
import { InventarioService } from '../../services/inventario_sucursal.service';
import { AuthService } from '../../services/auth.service';

export interface ProductoVisual {
  id: number;
  id_inventario: number;
  nombre_sucursal?: string;
  nombre: string;
  descripcion: string;
  tipo_metal: string;
  kilataje: string;
  precio_venta: number;
  imagen_base64?: string;
  stock?: number; // solo viene cuando se carga el inventario de una sucursal
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, UpperCasePipe, RouterLink, FormsModule, MenuComponent],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  public terminoBusqueda: string = '';
  public products: ProductoVisual[] = [];
  public cargando: boolean = true;
  public nombreSucursal: string = '';
  public esAdmin: boolean = false;

  ngOnInit(): void {
    this.cargarVitrina();
  }

  cargarVitrina(): void {
    this.cargando = true;
    const usuario = this.authService.obtenerUsuario();

    // Gerente y Cajero: su sucursal. Administrador: todas las sucursales.
    this.esAdmin = usuario?.rol === 'Administrador';
    this.nombreSucursal = this.esAdmin ? '' : (usuario?.nombre_sucursal ?? '');

    this.inventarioService.getMiInventario().subscribe({
      next: (datos) => {
        this.products = datos;
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el inventario:', err);
        this.cargando = false;
        // Token vencido o inválido: se regresa al login
        if (err.status === 401) {
          this.authService.cerrarSesion();
          this.router.navigate(['/login']);
          return;
        }
        this.cd.detectChanges();
      }
    });
  }

  get productosFiltrados(): ProductoVisual[] {
    const q = this.terminoBusqueda.trim().toLowerCase();
    if (!q) return this.products;
    return this.products.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.tipo_metal && p.tipo_metal.toLowerCase().includes(q)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
  }

  public agregarAlCarrito(product: ProductoVisual): void {
    console.log('Joya seleccionada para ticket:', product);
    alert(`"${product.nombre}" agregada al flujo de venta.`);
  }
}