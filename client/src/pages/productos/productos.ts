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
  archivoSeleccionado: File | null = null;

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

  // Método que captura la foto cuando el usuario la elige
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
    }
  }

  guardarProducto(): void {
    if (!this.nuevoItem.nombre.trim()) {
      alert('Debes ingresar un nombre para la pieza');
      return;
    }

    // Se empaquetan los datos en un FormData para poder mandar el binario
    const formData = new FormData();
    formData.append('nombre', this.nuevoItem.nombre);
    formData.append('descripcion', this.nuevoItem.descripcion);
    formData.append('tipo_metal', this.nuevoItem.tipo_metal);
    formData.append('kilataje', this.nuevoItem.kilataje);
    formData.append('peso_gramos', this.nuevoItem.peso_gramos.toString());
    formData.append('precio_compra', this.nuevoItem.precio_compra.toString());
    formData.append('precio_venta', this.nuevoItem.precio_venta.toString());
    formData.append('id_categoria', this.nuevoItem.id_categoria.toString());

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }

    this.productosService.crearProducto(formData).subscribe({
      next: (guardado) => {
        this.listaProductos.push(guardado);
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
        this.archivoSeleccionado = null;
        this.cd.detectChanges();
        alert('¡Joya e imagen guardadas con éxito en pos_olimpo!');
      },
      error: (err) => {
        console.error('Error al guardar con imagen:', err);
        alert('Ocurrió un error al guardar en la base de datos.');
      }
    });
  }

  borrarProducto(id: number, nombre: string): void {
    const confirmacion = confirm(`¿Estás seguro de eliminar "${nombre}" de la base de datos?`);
    if (!confirmacion) return;

    this.productosService.eliminarProducto(id).subscribe({
      next: () => {
        this.listaProductos = this.listaProductos.filter(item => item.id !== id);
        this.cd.detectChanges();
        alert('Pieza eliminada correctamente de pos_olimpo');
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        const mensajeError = err.error?.error || 'No se pudo eliminar el producto';
        alert(mensajeError);
      }
    });
  }
}