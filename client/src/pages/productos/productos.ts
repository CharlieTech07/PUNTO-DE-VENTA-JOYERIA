// client/src/pages/productos/productos.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  private productosService = inject(ProductosService);
  private cd = inject(ChangeDetectorRef);

  listaProductos: any[] = [];
  cargando: boolean = true;
  errorCarga: string = '';

  nuevoItem = {
    nombre: '',
    descripcion: '',
    tipo_metal: 'Oro',
    kilataje: '14k',
    peso_gramos: 0,
    precio_compra: 0,
    precio_venta: 0,
    id_categoria: 1
  };

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productosService.getProductos().subscribe({
      next: (datos) => {
        this.listaProductos = datos;
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al consultar productos:', err);
        this.errorCarga = 'Error al conectar con la base de datos';
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  guardarProducto(): void {
    if (!this.nuevoItem.nombre.trim()) {
      alert('Debes ingresar un nombre');
      return;
    }
    this.productosService.postProducto(this.nuevoItem).subscribe({
      next: (productoCreado) => {
        this.listaProductos.push(productoCreado);
        this.nuevoItem = {
          nombre: '',
          descripcion: '',
          tipo_metal: 'Oro',
          kilataje: '14k',
          peso_gramos: 0,
          precio_compra: 0,
          precio_venta: 0,
          id_categoria: 1
        };
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear producto:', err);
        alert('Error al crear producto. Revisa la consola para más detalles.');
      }
    });
  }
}