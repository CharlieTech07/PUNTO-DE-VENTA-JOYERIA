// client/src/pages/dashboard/dashboard.ts
import { Component, OnInit, HostListener, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { MenuComponent } from '../../components/menu/menu';
import { InventarioService, InventarioItem } from '../../services/inventario_sucursal.service';
import { SucursalesService, Sucursal } from '../../services/sucursales.services';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ProductosService } from '../../services/productos.service';
import { AuthService } from '../../services/auth.service';
import { MetalesService, PreciosMetales } from '../../services/metales.service';
import { puedeVer, primeraVistaPermitida } from '../../models/permisos';
import { EmpleadosComponent } from '../empleados/empleados';
import { SucursalesComponent } from '../sucursales/sucursales';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, MenuComponent, EmpleadosComponent, SucursalesComponent, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private inventarioService = inject(InventarioService);
  private sucursalesService = inject(SucursalesService);
  private productosService = inject(ProductosService);
  private authService = inject(AuthService);
  private metalesService = inject(MetalesService);
  private cd = inject(ChangeDetectorRef);
  readonly languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);

  public vistaActiva: string = primeraVistaPermitida(this.authService.obtenerUsuario()?.rol);
  public tituloVista: string = '';
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
  public listaProductos: any[] = [];
  public cargandoDatos: boolean = true;

  public totalPiezasStock: number = 0;
  public valorTotalInventario: number = 0;
  public cantidadStockBajo: number = 0;

  // Gerente y Cajero ven solo su sucursal (el servidor ya limita los datos);
  // el Administrador ve toda la red.
  public usuario = this.authService.obtenerUsuario();
  public soloStockBajo: boolean = false;

  // Precio real de los metales (API)
  public preciosMetales: PreciosMetales | null = null;
  public cargandoMetales: boolean = false;
  public errorMetales: string = '';

  public get esAdmin(): boolean {
    return this.usuario?.rol === 'Administrador';
  }

  public get notaPiezas(): string {
    const t = (frase: string) => this.languageService.t(frase);
    return this.esAdmin
      ? `${t('En')} ${this.listaSucursales.length} ${t('sucursales')}`
      : `${t('En')} ${this.usuario?.nombre_sucursal || t('tu sucursal')}`;
  }

  // Tabla del inventario: todo, o solo lo que está en o bajo el mínimo
  public get inventarioVisible(): InventarioItem[] {
    return this.soloStockBajo
      ? this.listaInventario.filter(i => Number(i.stock) <= Number(i.stock_minimo))
      : this.listaInventario;
  }

  // Para mostrar u ocultar módulos según el rol del usuario
  public puedeVer(vista: string): boolean {
    return puedeVer(this.usuario?.rol, vista);
  }

  // Tarjetas de precio por gramo en pesos (oro por kilataje y plata ley .925)
  public get tarjetasMetal(): { etiqueta: string; mxn_gramo: number; usd_gramo: number }[] {
    const metales = this.preciosMetales?.metales ?? [];
    const oro = metales.find(m => m.symbol === 'XAU');
    const plata = metales.find(m => m.symbol === 'XAG');
    const tarjetas: { etiqueta: string; mxn_gramo: number; usd_gramo: number }[] = [];

    if (oro) {
      for (const [kilates, etiqueta] of [[24, 'Oro 24k'], [18, 'Oro 18k'], [14, 'Oro 14k']] as [number, string][]) {
        tarjetas.push({
          etiqueta,
          mxn_gramo: oro.mxn_gramo * (kilates / 24),
          usd_gramo: oro.usd_gramo * (kilates / 24)
        });
      }
    }
    if (plata) {
      tarjetas.push({
        etiqueta: 'Plata .925',
        mxn_gramo: plata.mxn_gramo * 0.925,
        usd_gramo: plata.usd_gramo * 0.925
      });
    }
    return tarjetas;
  }

  public cargarMetales(): void {
    this.cargandoMetales = true;
    this.errorMetales = '';

    this.metalesService.getPrecios().subscribe({
      next: (datos) => {
        this.preciosMetales = datos;
        this.cargandoMetales = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al consultar precios de metales:', err);
        this.errorMetales = err.error?.error || 'No se pudo consultar el precio de los metales.';
        this.cargandoMetales = false;
        this.cd.detectChanges();
      }
    });
  }

  public alternarStockBajo(): void {
    this.soloStockBajo = !this.soloStockBajo;
  }

  private readonly titulosPorVista: Record<string, string> = {
    productos: 'Productos',
    inventario: 'Inventario',
    sucursales: 'Sucursales',
    empleados: 'Empleados',
    metal: 'Precio del Metal',
    apartados: 'Módulos'
  };

  ngOnInit(): void {
    this.cambiarVista(this.vistaActiva, false);
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
      sucursales: this.sucursalesService.getSucursales(),
      // Si falla productos, el resto del dashboard sigue cargando
      productos: this.productosService.getProductos().pipe(catchError(() => of([] as any[])))
    }).subscribe({
      next: ({ inventario, sucursales, productos }: { inventario: InventarioItem[]; sucursales: Sucursal[]; productos: any[] }) => {
        this.listaInventario = inventario;
        this.listaSucursales = sucursales;
        this.listaProductos = productos;
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
    const rol = this.usuario?.rol;

    // Si el rol no tiene permiso para ese módulo, se abre el primero que sí puede ver
    this.vistaActiva = this.titulosPorVista[vista] && puedeVer(rol, vista)
      ? vista
      : primeraVistaPermitida(rol);
    this.tituloVista = this.titulosPorVista[this.vistaActiva] ?? '';
    window.location.hash = this.vistaActiva;

    // El precio de los metales se consulta la primera vez que se abre esa pantalla
    if (this.vistaActiva === 'metal' && !this.preciosMetales && !this.cargandoMetales) {
      this.cargarMetales();
    }

    if (moverArriba) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public seleccionarSegmento(segmento: string): void {
    this.segmentoSeleccionado = segmento;
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    const seccion = window.location.hash.replace('#', '') || primeraVistaPermitida(this.usuario?.rol);
    if (seccion !== this.vistaActiva) {
      this.cambiarVista(seccion, false);
    }
  }

}
