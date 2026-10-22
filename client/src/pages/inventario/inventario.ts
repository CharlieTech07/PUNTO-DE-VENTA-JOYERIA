import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService, InventarioItem } from '../../services/inventario_sucursal.service';
import { ProductosService } from '../../services/productos.service';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { DeepLTranslationService } from '../../services/deepl-translation.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css']
})
export class InventarioComponent implements OnInit {
  private router = inject(Router);
  private inventarioService = inject(InventarioService);
  private productosService = inject(ProductosService);
  private authService = inject(AuthService);
  private cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deepL = inject(DeepLTranslationService);
  public readonly language = inject(LanguageService);
  private readonly translatedProductNames = new Map<string, string>();

  public listaInventario: (InventarioItem & { seleccionado?: boolean })[] = [];
  public catalogoProductos: any[] = [];
  public usuario = this.authService.obtenerUsuario();
  public cargando: boolean = true;
  public guardando: boolean = false;
  public seleccionarTodos: boolean = false;
  public inventarioEditandoId: number | null = null;

  public nuevoRegistro = {
    id_sucursal: (this.usuario?.id_sucursal ?? null) as number | null, // siempre la del gerente
    id_producto: null as number | null,
    stock: 1,
    stock_minimo: 1,
    ubicacion_vitrina: 'Vitrina Central - Charola 1'
  };

  ngOnInit(): void {
    this.language.lang$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lang => {
        this.translatedProductNames.clear();
        if (lang === 'en') {
          this.translateProductNames();
        }
      });
    this.cargarDatos();
  }

  // Solo el Gerente puede agregar o modificar existencias, y únicamente en su sucursal
  public get esGerente(): boolean {
    return this.usuario?.rol === 'Gerente' && !!this.usuario?.id_sucursal;
  }

  public get tituloTabla(): string {
    return this.usuario?.rol === 'Administrador'
      ? 'Existencias en Red de Sucursales'
      : 'Existencias de tu sucursal';
  }

  public productName(name: string): string {
    return this.translatedProductNames.get(name) ?? name;
  }

  public volverAlDashboard(): void {
    this.router.navigate(['/dashboard'], { fragment: 'inventario' });
  }

  public cargarDatos(): void {
    this.cargando = true;
    this.seleccionarTodos = false;

    this.inventarioService.getInventario().subscribe({
      next: (datos) => {
        this.listaInventario = datos.map(item => ({
          ...item,
          id: Number(item.id),
          id_sucursal: Number(item.id_sucursal),
          id_producto: Number(item.id_producto),
          seleccionado: false
        }));
        this.cargando = false;
        this.translateProductNames();
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar inventario:', err);
        this.cargando = false;
        this.cd.detectChanges();
      }
    });

    this.productosService.getProductos().subscribe({
      next: (prods) => {
        this.catalogoProductos = prods.map(producto => ({
          ...producto,
          id: Number(producto.id),
          id_categoria: Number(producto.id_categoria)
        }));
        if (prods.length > 0 && this.nuevoRegistro.id_producto === null) {
          this.nuevoRegistro.id_producto = Number(prods[0].id);
        }
        this.translateProductNames();
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar catálogo de productos:', err)
    });
  }

  private translateProductNames(): void {
    if (this.language.lang !== 'en') {
      return;
    }

    const names = [...new Set([
      ...this.catalogoProductos.map(product => product.nombre),
      ...this.listaInventario.map(item => item.nombre_producto)
    ].filter((name): name is string => typeof name === 'string' && !!name.trim()))];
    const pendingNames = names.filter(name => !this.translatedProductNames.has(name));
    if (pendingNames.length === 0) {
      return;
    }

    this.deepL.translateMany(pendingNames)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(translations => {
        if (this.language.lang !== 'en') {
          return;
        }

        pendingNames.forEach((name, index) => {
          this.translatedProductNames.set(name, translations[index] ?? name);
        });
        this.cd.markForCheck();
      });
  }

  public guardarStock(): void {
    if (!this.esGerente) {
      alert(this.language.t('Solo el Gerente de la sucursal puede agregar productos al inventario.'));
      return;
    }
    if (!this.nuevoRegistro.id_producto) {
      alert(this.language.t('Debes seleccionar una sucursal y una joya válidas.'));
      return;
    }

    this.guardando = true;
    const payload = {
      id_sucursal: Number(this.usuario?.id_sucursal), // el servidor igual la valida contra el token
      id_producto: Number(this.nuevoRegistro.id_producto),
      stock: Number(this.nuevoRegistro.stock),
      stock_minimo: Number(this.nuevoRegistro.stock_minimo),
      ubicacion_vitrina: this.nuevoRegistro.ubicacion_vitrina
    };

    this.inventarioService.asignarStock(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.inventarioEditandoId = null;
        alert(this.language.t('Stock guardado correctamente en pos_olimpo'));
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error del servidor:', err);
        const detalle = err.error?.error || 'No se pudo guardar el stock en la base de datos';
        alert(this.language.t(detalle));
        this.cd.detectChanges();
      }
    });
  }

  public editarStock(item: InventarioItem): void {
    this.inventarioEditandoId = item.id;
    this.nuevoRegistro = {
      id_sucursal: Number(item.id_sucursal),
      id_producto: Number(item.id_producto),
      stock: Number(item.stock),
      stock_minimo: Number(item.stock_minimo),
      ubicacion_vitrina: item.ubicacion_vitrina ?? ''
    };
    document.querySelector('.inventario-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  public cancelarEdicionStock(): void {
    this.inventarioEditandoId = null;
    this.nuevoRegistro = {
      id_sucursal: this.usuario?.id_sucursal ?? null,
      id_producto: this.catalogoProductos[0] ? Number(this.catalogoProductos[0].id) : null,
      stock: 1,
      stock_minimo: 1,
      ubicacion_vitrina: 'Vitrina Central - Charola 1'
    };
  }

  public alternarSeleccionTodos(): void {
    this.listaInventario.forEach(item => item.seleccionado = this.seleccionarTodos);
  }

  public get itemsSeleccionados(): (InventarioItem & { seleccionado?: boolean })[] {
    return this.listaInventario.filter(item => item.seleccionado);
  }

  public eliminarIndividual(id: number, pieza: string): void {
    const confirmacion = this.language.t('¿Eliminar las existencias de "{item}" en esta tienda?')
      .replace('{item}', pieza);
    if (!confirm(confirmacion)) return;

    this.inventarioService.eliminarInventario(id).subscribe({
      next: () => {
        this.listaInventario = this.listaInventario.filter(item => item.id !== id);
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        alert(this.language.t('No se pudo eliminar el registro.'));
      }
    });
  }

  public eliminarSeleccionados(): void {
    const ids = this.itemsSeleccionados.map(item => item.id);
    if (ids.length === 0) return;

    const confirmacion = this.language.t('¿Eliminar {count} registros seleccionados?')
      .replace('{count}', String(ids.length));
    if (!confirm(confirmacion)) return;

    this.inventarioService.eliminarVarios(ids).subscribe({
      next: () => {
        this.listaInventario = this.listaInventario.filter(item => !ids.includes(item.id));
        this.seleccionarTodos = false;
        this.cd.detectChanges();
        alert(`¡${ids.length} registros eliminados correctamente!`);
      },
      error: (err) => {
        console.error('Error al eliminar lote:', err);
        alert(this.language.t('Error al procesar la eliminación múltiple.'));
      }
    });
  }
}
