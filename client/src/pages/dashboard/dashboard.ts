// client/src/pages/dashboard/dashboard.ts
import { Component, OnInit, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MenuComponent } from '../../components/menu/menu';
import { InventarioService, InventarioItem } from '../../services/inventario_sucursal.service';
import { SucursalesService, Sucursal } from  '../../services/sucursales.services';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MenuComponent, RouterLink, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventarioService = inject(InventarioService);
  private sucursalesService = inject(SucursalesService);
  private cd = inject(ChangeDetectorRef);
  private languageService = inject(LanguageService);

  public vistaActiva: string = 'resumen';
  public tituloVista: string = 'Resumen';
  public segmentoSeleccionado: string = 'dia';

  public get fechaHoy(): string {
    const locale = this.languageService.lang === 'en' ? 'en-US' : 'es-MX';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Colecciones de la base de datos pos_olimpo
  public listaInventario: InventarioItem[] = [];
  public listaSucursales: Sucursal[] = [];
  public cargandoDatos: boolean = true;

  // Métricas calculadas en vivo
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
    this.cargarDatosBackend();

    this.route.fragment.subscribe(frag => {
      this.cambiarVista(frag || 'resumen', false);
    });
  }

  public cargarDatosBackend(): void {
    this.cargandoDatos = true;

    // 1. Cargar Inventario
    this.inventarioService.getInventario().subscribe({
      next: (inventario) => {
        this.listaInventario = inventario;
        this.calcularMetricasInventario(inventario);
        this.cargandoDatos = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar inventario en dashboard:', err);
        this.cargandoDatos = false;
      }
    });

    // 2. Cargar Sucursales
    this.sucursalesService.getSucursales().subscribe({
      next: (sucursales) => {
        this.listaSucursales = sucursales;
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar sucursales en dashboard:', err)
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
    this.cambiarVista(seccion, true);
  }

}
