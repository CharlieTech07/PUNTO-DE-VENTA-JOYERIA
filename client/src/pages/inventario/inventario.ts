import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService, InventarioItem } from '../../services/inventario_sucursal.service';
import { ProductosService } from '../../services/productos.service';
import { SucursalesService, Sucursal } from '../../services/sucursales.services';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css']
})
export class InventarioComponent implements OnInit {
  private router = inject(Router);
  private inventarioService = inject(InventarioService);
  private productosService = inject(ProductosService);
  private sucursalesService = inject(SucursalesService);
  private cd = inject(ChangeDetectorRef);

  public listaInventario: (InventarioItem & { seleccionado?: boolean })[] = [];
  public catalogoProductos: any[] = [];
  public catalogoSucursales: Sucursal[] = [];
  public cargando: boolean = true;
  public guardando: boolean = false;
  public seleccionarTodos: boolean = false;

  public nuevoRegistro = {
    id_sucursal: null as number | null,
    id_producto: null as number | null,
    stock: 1,
    stock_minimo: 1,
    ubicacion_vitrina: 'Vitrina Central - Charola 1'
  };

  ngOnInit(): void {
    this.cargarDatos();
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

  public guardarStock(): void {
    if (!this.nuevoRegistro.id_sucursal || !this.nuevoRegistro.id_producto) {
      alert('Debes seleccionar una sucursal y una joya válidas.');
      return;
    }

    this.guardando = true;
    const payload = {
      id_sucursal: Number(this.nuevoRegistro.id_sucursal),
      id_producto: Number(this.nuevoRegistro.id_producto),
      stock: Number(this.nuevoRegistro.stock),
      stock_minimo: Number(this.nuevoRegistro.stock_minimo),
      ubicacion_vitrina: this.nuevoRegistro.ubicacion_vitrina
    };

    this.inventarioService.asignarStock(payload).subscribe({
      next: () => {
        this.guardando = false;
        alert('Stock guardado correctamente en pos_olimpo');
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error del servidor:', err);
        alert(err.error?.error || 'No se pudo guardar el stock');
        this.cd.detectChanges();
      }
    });
  }

  public alternarSeleccionTodos(): void {
    this.listaInventario.forEach(item => item.seleccionado = this.seleccionarTodos);
  }

  public get itemsSeleccionados(): (InventarioItem & { seleccionado?: boolean })[] {
    return this.listaInventario.filter(item => item.seleccionado);
  }

  public eliminarIndividual(id: number, pieza: string): void {
    if (!confirm(`¿Eliminar las existencias de "${pieza}" en esta tienda?`)) return;

    this.inventarioService.eliminarInventario(id).subscribe({
      next: () => {
        this.listaInventario = this.listaInventario.filter(item => item.id !== id);
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        alert('No se pudo eliminar el registro.');
      }
    });
  }

  public eliminarSeleccionados(): void {
    const ids = this.itemsSeleccionados.map(item => item.id);
    if (ids.length === 0) return;

    if (!confirm(`¿Eliminar ${ids.length} registros seleccionados de inventario?`)) return;

    this.inventarioService.eliminarVarios(ids).subscribe({
      next: () => {
        this.listaInventario = this.listaInventario.filter(item => !ids.includes(item.id));
        this.seleccionarTodos = false;
        this.cd.detectChanges();
        alert(`¡${ids.length} registros eliminados correctamente!`);
      },
      error: (err) => {
        console.error('Error al eliminar lote:', err);
        alert('Error al procesar la eliminación múltiple.');
      }
    });
  }
}