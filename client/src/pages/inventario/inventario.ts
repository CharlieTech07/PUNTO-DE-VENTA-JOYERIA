// client/src/pages/inventario/inventario.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, InventarioItem } from '../../services/inventario_sucursal.service';
import { ProductosService } from '../../services/productos.service';
import { SucursalesService } from '../../services/sucursales.services';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css'] // <-- Enlace al nuevo archivo de estilos
})
export class InventarioComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  private productosService = inject(ProductosService);
  private sucursalesService = inject(SucursalesService);
  private cd = inject(ChangeDetectorRef);

  listaInventario: InventarioItem[] = [];
  catalogoProductos: any[] = [];
  catalogoSucursales: any[] = [];
  cargando: boolean = true;
  seleccionarTodos: boolean = false;

  nuevoRegistro = {
    id_sucursal: '',
    id_producto: '',
    stock: 1,
    stock_minimo: 1,
    ubicacion_vitrina: 'Vitrina Central - Charola 1'
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
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

    this.productosService.getProductos().subscribe(prods => {
      this.catalogoProductos = prods;
      if (prods.length > 0) this.nuevoRegistro.id_producto = prods[0].id;
    });

    this.sucursalesService.getSucursales().subscribe(sucs => {
      this.catalogoSucursales = sucs;
      if (sucs.length > 0) this.nuevoRegistro.id_sucursal = sucs[0].id;
    });
  }

  guardarStock(): void {
    if (!this.nuevoRegistro.id_sucursal || !this.nuevoRegistro.id_producto) {
      alert('Debes seleccionar sucursal y producto');
      return;
    }

    this.inventarioService.asignarStock(this.nuevoRegistro).subscribe({
      next: () => {
        alert('Stock actualizado correctamente');
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al guardar stock:', err);
        alert('Error al actualizar inventario');
      }
    });
  }

  // --- LÓGICA DE SELECCIÓN Y ELIMINACIÓN ---

  alternarSeleccionTodos(): void {
    this.listaInventario.forEach(item => item.seleccionado = this.seleccionarTodos);
  }

  get itemsSeleccionados(): InventarioItem[] {
    return this.listaInventario.filter(item => item.seleccionado);
  }

  // Eliminar 1 ítem individual
  eliminarIndividual(id: number, pieza: string): void {
    if (!confirm(`¿Eliminar las existencias de "${pieza}" en esta tienda?`)) return;

    this.inventarioService.eliminarInventario(id).subscribe({
      next: () => {
        this.listaInventario = this.listaInventario.filter(item => item.id !== id);
        this.cd.detectChanges();
        alert('Registro eliminado de pos_olimpo');
      },
      error: (err) => {
        console.error('Error al eliminar registro:', err);
        alert('No se pudo eliminar el registro de inventario');
      }
    });
  }

  // Eliminar varios ítems seleccionados
  eliminarSeleccionados(): void {
    const ids = this.itemsSeleccionados.map(item => item.id);
    if (ids.length === 0) return;

    if (!confirm(`¿Estás seguro de eliminar ${ids.length} registros seleccionados de inventario?`)) return;

    this.inventarioService.eliminarVarios(ids).subscribe({
      next: () => {
        this.listaInventario = this.listaInventario.filter(item => !ids.includes(item.id));
        this.seleccionarTodos = false;
        this.cd.detectChanges();
        alert(`¡${ids.length} registros eliminados correctamente!`);
      },
      error: (err) => {
        console.error('Error al eliminar lote:', err);
        alert('Error al procesar la eliminación masiva');
      }
    });
  }
}