// client/src/pages/productos/productos.ts
import { Component, OnInit, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductosService } from '../../services/productos.service';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';

interface FormularioProducto {
  nombre: string;
  descripcion: string;
  tipo_metal: string;
  kilataje: string;
  peso_gramos: number;
  precio_compra: number;
  precio_venta: number;
  id_categoria: number;
}

const TAMANO_MAX_IMAGEN = 5 * 1024 * 1024; // 5 MB, igual que en el servidor

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, TranslatePipe],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  private productosService = inject(ProductosService);
  readonly languageService = inject(LanguageService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  @ViewChild('inputFoto') inputFoto?: ElementRef<HTMLInputElement>;

  listaProductos: any[] = [];
  cargando: boolean = true;
  errorCarga: string = '';
  guardando: boolean = false;
  archivoSeleccionado: File | null = null;

  metales: string[] = ['Oro', 'Plata', 'Platino'];

  // null = se está registrando una pieza nueva; con id = se está editando esa pieza
  productoEditandoId: number | null = null;
  imagenActual: string | null = null; // foto guardada de la pieza que se edita

  aviso: { tipo: 'ok' | 'error'; texto: string } | null = null;
  private temporizadorAviso: any;

  formulario: FormularioProducto = this.formularioVacio();

  ngOnInit(): void {
    this.cargarProductos();
  }

  // Nombre de la pieza traducido cuando está en el catálogo de idiomas
  productName(item: any): string {
    return this.languageService.catalogPhrase(item?.nombre ?? '');
  }

  get enEdicion(): boolean {
    return this.productoEditandoId !== null;
  }

  volverAlDashboard(): void {
    this.router.navigate(['/dashboard'], { fragment: 'productos' });
  }

  private formularioVacio(): FormularioProducto {
    return {
      nombre: '',
      descripcion: '',
      tipo_metal: 'Oro',
      kilataje: '14k',
      peso_gramos: 0,
      precio_compra: 0,
      precio_venta: 0,
      id_categoria: 1
    };
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

  // ---------- Foto ----------
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && file.size > TAMANO_MAX_IMAGEN) {
      this.mostrarAviso('error', 'La imagen no debe pasar de 5 MB.');
      this.limpiarFoto();
      return;
    }
    this.archivoSeleccionado = file;
  }

  private limpiarFoto(): void {
    this.archivoSeleccionado = null;
    if (this.inputFoto) this.inputFoto.nativeElement.value = '';
  }

  // ---------- Edición ----------
  editarProducto(item: any): void {
    this.productoEditandoId = item.id;
    this.imagenActual = item.imagen_base64 || null;
    this.limpiarFoto();

    // Si el metal guardado no está en la lista, se agrega para que el selector lo muestre
    if (item.tipo_metal && !this.metales.includes(item.tipo_metal)) {
      this.metales = [...this.metales, item.tipo_metal];
    }

    this.formulario = {
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      tipo_metal: item.tipo_metal ?? 'Oro',
      kilataje: item.kilataje ?? '',
      peso_gramos: Number(item.peso_gramos) || 0,
      precio_compra: Number(item.precio_compra) || 0,
      precio_venta: Number(item.precio_venta) || 0,
      id_categoria: Number(item.id_categoria) || 1
    };

    this.cd.detectChanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.productoEditandoId = null;
    this.imagenActual = null;
    this.formulario = this.formularioVacio();
    this.limpiarFoto();
  }

  // ---------- Guardar (crear o actualizar) ----------
  guardarProducto(): void {
    if (!this.formulario.nombre.trim()) {
      this.mostrarAviso('error', 'Debes ingresar un nombre para la pieza.');
      return;
    }
    if (this.formulario.peso_gramos < 0 || this.formulario.precio_compra < 0 || this.formulario.precio_venta < 0) {
      this.mostrarAviso('error', 'El peso y los precios no pueden ser negativos.');
      return;
    }

    // Se empaquetan los datos en un FormData para poder mandar el binario
    const formData = new FormData();
    formData.append('nombre', this.formulario.nombre.trim());
    formData.append('descripcion', this.formulario.descripcion);
    formData.append('tipo_metal', this.formulario.tipo_metal);
    formData.append('kilataje', this.formulario.kilataje);
    formData.append('peso_gramos', String(this.formulario.peso_gramos ?? 0));
    formData.append('precio_compra', String(this.formulario.precio_compra ?? 0));
    formData.append('precio_venta', String(this.formulario.precio_venta ?? 0));
    formData.append('id_categoria', String(this.formulario.id_categoria));

    if (this.archivoSeleccionado) {
      formData.append('imagen', this.archivoSeleccionado, this.archivoSeleccionado.name);
    }

    this.guardando = true;

    if (this.enEdicion) {
      const id = this.productoEditandoId as number;
      this.productosService.actualizarProducto(id, formData).subscribe({
        next: (actualizado) => {
          this.listaProductos = this.listaProductos.map(p => (p.id === id ? actualizado : p));
          this.guardando = false;
          this.cancelarEdicion();
          this.mostrarAviso('ok', 'Pieza actualizada correctamente.');
        },
        error: (err) => this.manejarErrorGuardado(err, 'actualizar')
      });
    } else {
      this.productosService.crearProducto(formData).subscribe({
        next: (guardado) => {
          this.listaProductos = [...this.listaProductos, guardado];
          this.guardando = false;
          this.cancelarEdicion();
          this.mostrarAviso('ok', 'Pieza registrada correctamente.');
        },
        error: (err) => this.manejarErrorGuardado(err, 'guardar')
      });
    }
  }

  private manejarErrorGuardado(err: any, accion: string): void {
    console.error(`Error al ${accion} el producto:`, err);
    this.guardando = false;
    this.mostrarAviso('error', err.error?.error || `No se pudo ${accion} la pieza.`);
  }

  // ---------- Eliminar ----------
  borrarProducto(id: number, nombre: string): void {
    const confirmacion = confirm(
      this.languageService.t('¿Estás seguro de eliminar "{item}" de la base de datos?').replace('{item}', nombre)
    );
    if (!confirmacion) return;

    this.productosService.eliminarProducto(id).subscribe({
      next: () => {
        this.listaProductos = this.listaProductos.filter(item => item.id !== id);
        if (this.productoEditandoId === id) this.cancelarEdicion();
        this.mostrarAviso('ok', 'Pieza eliminada correctamente.');
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.mostrarAviso('error', err.error?.error || 'No se pudo eliminar el producto.');
      }
    });
  }

  // ---------- Avisos ----------
  private mostrarAviso(tipo: 'ok' | 'error', texto: string): void {
    // Los mensajes fijos se traducen; los que vienen del servidor se muestran tal cual
    this.aviso = { tipo, texto: this.languageService.t(texto) };
    clearTimeout(this.temporizadorAviso);
    this.temporizadorAviso = setTimeout(() => {
      this.aviso = null;
      this.cd.detectChanges();
    }, 4500);
    this.cd.detectChanges();
  }
}
