// client/src/pages/dashboard/dashboard.ts
import { Component, OnInit, HostListener, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { MenuComponent } from '../../components/menu/menu';
import { InventarioService, InventarioItem } from '../../services/inventario_sucursal.service';
import { SucursalesService, Sucursal } from '../../services/sucursales.services';
import { EmpleadosComponent } from '../empleados/empleados';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, MenuComponent, EmpleadosComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private inventarioService = inject(InventarioService);
  private sucursalesService = inject(SucursalesService);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  public vistaActiva: string = 'resumen';
  public tituloVista: string = 'Resumen';
  public fechaHoy: string = '';
  public segmentoSeleccionado: string = 'dia';

  public listaInventario: InventarioItem[] = [];
  public listaSucursales: Sucursal[] = [];
  public cargandoDatos: boolean = true;

  public totalPiezasStock: number = 0;
  public valorTotalInventario: number = 0;
  public cantidadStockBajo: number = 0;

  private readonly titulosPorVista: Record<string, string> = {
    resumen: 'Resumen',
    ventas: 'Reporte de Ventas',
    ingresos: 'Ingresos',
    inventario: 'Inventario',
    apartados: 'Apartados',
    empleados: 'Empleados',
    metal: 'Precio del Metal',
    auditoria: 'Auditoría'
  };

  ngOnInit(): void {
    this.inicializarFecha();
    this.cargarDatosBackend();

    this.route.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fragmento) => {
        if (fragmento) {
          this.cambiarVista(fragmento, false);
        }
      });
  }

  public cargarDatosBackend(): void {
    this.cargandoDatos = true;

    forkJoin({
      inventario: this.inventarioService.getInventario(),
      sucursales: this.sucursalesService.getSucursales()
    }).subscribe({
      next: ({ inventario, sucursales }: { inventario: InventarioItem[]; sucursales: Sucursal[] }) => {
        this.listaInventario = inventario;
        this.listaSucursales = sucursales;
        this.calcularMetricasInventario(inventario);
        this.cargandoDatos = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al sincronizar datos en Dashboard:', err);
        this.cargandoDatos = false;
        this.cd.detectChanges();
      }
    });
  }

  private calcularMetricasInventario(items: InventarioItem[]): void {
    let piezas = 0;
    let valor = 0;
    let bajos = 0;

    for (const item of items) {
      const stock = Number(item.stock) || 0;
      const precio = Number(item.precio_venta) || 0;
      const minimo = Number(item.stock_minimo) || 0;

      piezas += stock;
      valor += stock * precio;
      if (stock <= minimo) {
        bajos++;
      }
    }

    this.totalPiezasStock = piezas;
    this.valorTotalInventario = valor;
    this.cantidadStockBajo = bajos;
  }

  public cambiarVista(vista: string, moverArriba: boolean = true): void {
    this.vistaActiva = this.titulosPorVista[vista] ? vista : 'resumen';
    this.tituloVista = this.titulosPorVista[this.vistaActiva] ?? 'Resumen';
    window.location.hash = this.vistaActiva;

    if (moverArriba) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public seleccionarSegmento(segmento: string): void {
    this.segmentoSeleccionado = segmento;
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    const seccion = window.location.hash.replace('#', '') || 'resumen';
    if (seccion !== this.vistaActiva) {
      this.cambiarVista(seccion, false);
    }
  }

  private inicializarFecha(): void {
    this.fechaHoy = new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}