// client/src/pages/inicio/inicio.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../../components/menu/menu';
import { ProductosService } from '../../services/productos.service';

export interface ProductoVisual {
  id: number;
  nombre: string;
  descripcion: string;
  tipo_metal: string;
  kilataje: string;
  precio_venta: number;
  imagen_base64?: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, FormsModule, MenuComponent],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent implements OnInit {
  private productosService = inject(ProductosService);
  private cd = inject(ChangeDetectorRef);

  public terminoBusqueda: string = '';
  public products: ProductoVisual[] = [];
  public cargando: boolean = true;

  ngOnInit(): void {
    this.cargarVitrina();
  }

  cargarVitrina(): void {
    this.cargando = true;
    this.productosService.getProductos().subscribe({
      next: (datos) => {
        this.products = datos;
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar la vitrina de joyas:', err);
        this.cargando = false;
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