import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // Si usas Standalone Components (Angular 14+)

@Component({
  selector: 'app-dashboard',
  standalone: true, // Quitar si trabajas con NgModules tradicionales
  imports: [CommonModule], // Quitar si trabajas con NgModules tradicionales
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  // Estado de la vista activa y títulos
  public vistaActiva: string = 'resumen';
  public tituloVista: string = 'Resumen';
  public fechaHoy: string = '';

  // Control del filtro de segmentos activo
  public segmentoSeleccionado: string = 'dia';

  private readonly titulosPorVista: Record<string, string> = {
    resumen: 'Resumen',
    ventas: 'Reporte de Ventas',
    inventario: 'Inventario',
    configuracion: 'Configuración'
  };

  ngOnInit(): void {
    this.inicializarFecha();
    this.actualizarDesdeHash(false);
  }

  // Escucha cambios en el hash de la URL sin recargar la página
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