import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../components/menu/menu'; // <-- Importamos tu menú

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MenuComponent], // <-- Se añade MenuComponent
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  public vistaActiva: string = 'resumen';
  public tituloVista: string = 'Resumen';
  public fechaHoy: string = '';
  public segmentoSeleccionado: string = 'dia';

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
    this.actualizarDesdeHash(false);
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    this.actualizarDesdeHash(true);
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

  private actualizarDesdeHash(moverArriba: boolean): void {
    const seccion = window.location.hash.replace('#', '') || 'resumen';
    this.cambiarVista(seccion, moverArriba);
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