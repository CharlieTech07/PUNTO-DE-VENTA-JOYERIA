import { Component, DestroyRef, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService, InventarioItem } from '../../services/inventario_sucursal.service';
import { ProductosService } from '../../services/productos.service';
import { SucursalesService } from '../../services/sucursales.services';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { DeepLTranslationService } from '../../services/deepl-translation.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private sucursalesService = inject(SucursalesService);
  private cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deepL = inject(DeepLTranslationService);
  public readonly language = inject(LanguageService);
  private readonly translatedProductNames = new Map<string, string>();

  public listaInventario: InventarioItem[] = [];
  public catalogoProductos: any[] = [];
  public catalogoSucursales: any[] = [];
  public cargando: boolean = true;
  public seleccionarTodos: boolean = false;

  public nuevoRegistro = {
    id_sucursal: null as number | null,
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
        this.listaInventario = datos.map(item => ({ ...item, seleccionado: false }));
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
        this.catalogoProductos = prods;
        if (prods.length > 0 && this.nuevoRegistro.id_producto === null) {
          this.nuevoRegistro.id_producto = Number(prods[0].id);
        }
        this.translateProductNames();
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar catálogo de productos:', err)
    });

    this.sucursalesService.getSucursales().subscribe({
      next: (sucs) => {
        this.catalogoSucursales = sucs;
        if (sucs.length > 0 && this.nuevoRegistro.id_sucursal === null) {
          this.nuevoRegistro.id_sucursal = Number(sucs[0].id);
        }
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar catálogo de sucursales:', err)
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
    if (!this.nuevoRegistro.id_sucursal || !this.nuevoRegistro.id_producto) {
      alert(this.language.t('Debes seleccionar una sucursal y una joya válidas.'));
      return;
    }

    const payload = {
      id_sucursal: Number(this.nuevoRegistro.id_sucursal),
      id_producto: Number(this.nuevoRegistro.id_producto),
      stock: Number(this.nuevoRegistro.stock),
      stock_minimo: Number(this.nuevoRegistro.stock_minimo),
      ubicacion_vitrina: this.nuevoRegistro.ubicacion_vitrina
    };

    this.inventarioService.asignarStock(payload).subscribe({
      next: () => {
        alert(this.language.t('Stock guardado correctamente en pos_olimpo'));
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error del servidor:', err);
        const detalle = err.error?.error || 'No se pudo guardar el stock en la base de datos';
        alert(this.language.t(detalle));
      }
    });
  }

  public alternarSeleccionTodos(): void {
    this.listaInventario.forEach(item => item.seleccionado = this.seleccionarTodos);
  }

  public get itemsSeleccionados(): InventarioItem[] {
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
      },
      error: (err) => {
        console.error('Error al eliminar lote:', err);
        alert(this.language.t('Error al procesar la eliminación múltiple.'));
      }
    });
  }
}
