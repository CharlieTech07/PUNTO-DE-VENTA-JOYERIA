import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuComponent } from '../../components/menu/menu';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MenuComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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

    // Escucha cambios en el hash/fragmento desde Angular Router
    this.route.fragment.subscribe(frag => {
      // Si se entra a /dashboard sin fragmento, lo escribimos en la URL. Sin
      // esto el panel muestra el resumen pero el menú no ilumina nada, porque
      // marca la opción activa comparando el fragmento. replaceUrl evita
      // ensuciar el historial, y como luego sí hay fragmento, no se repite.
      if (!frag) {
        this.router.navigate([], {
          relativeTo: this.route,
          fragment: 'resumen',
          replaceUrl: true
        });
        return;
      }

      this.cambiarVista(frag, false);
    });
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    this.actualizarDesdeHash(true);
  }

  public cambiarVista(vista: string, moverArriba: boolean = true): void {
    this.vistaActiva = this.titulosPorVista[vista] ? vista : 'resumen';
    this.tituloVista = this.titulosPorVista[this.vistaActiva] ?? 'Resumen';

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