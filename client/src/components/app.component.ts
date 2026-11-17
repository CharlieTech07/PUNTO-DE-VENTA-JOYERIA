import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Pantallas que se pueden ver sin sesión iniciada
const RUTAS_PUBLICAS = ['/login', '/privacidad', '/terminos', '/confirmar-lectura'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: [':host { display: block; }']
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Al usar "Atrás", el navegador puede mostrar la página tal como estaba (copia guardada),
  // sin pasar por los guards de las rutas. Aquí se vuelve a comprobar la sesión.
  @HostListener('window:pageshow', ['$event'])
  alMostrarPagina(evento: PageTransitionEvent): void {
    if (evento.persisted) this.verificarSesion();
  }

  @HostListener('window:popstate')
  alRetroceder(): void {
    setTimeout(() => this.verificarSesion());
  }

  @HostListener('document:visibilitychange')
  alVolverALaPestana(): void {
    if (document.visibilityState === 'visible') this.verificarSesion();
  }

  // Si se cierra la sesión en otra pestaña, esta también sale al login
  @HostListener('window:storage', ['$event'])
  alCambiarAlmacenamiento(evento: StorageEvent): void {
    if (evento.key === null || evento.key === 'olimpo_token') this.verificarSesion();
  }

  private verificarSesion(): void {
    const ruta = window.location.pathname;
    const esPublica = RUTAS_PUBLICAS.some(r => ruta === r || ruta.startsWith(r + '/'));

    if (!esPublica && !this.authService.estaAutenticado()) {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
