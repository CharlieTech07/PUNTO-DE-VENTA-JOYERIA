// client/src/pages/confirmar-lectura/confirmar-lectura.ts
// Donde el empleado lee los términos y el aviso de privacidad y confirma que los acepta.
// Se llega de dos formas:
//  - Desde el botón del correo de bienvenida: /confirmar-lectura?clave=... (sin sesión).
//  - Al entrar al sistema sin haber confirmado: el authGuard lo manda aquí con su sesión.
// La casilla se habilita hasta que baja al final de los textos.
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/lenguage.service';
import { TerminosService } from '../../services/terminos.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ACTUALIZADO, TEXTOS_LEGALES } from '../legal/textos';

type Estado = 'cargando' | 'leer' | 'listo' | 'ya' | 'invalido';

@Component({
  selector: 'app-confirmar-lectura',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './confirmar-lectura.html',
  styleUrls: ['./confirmar-lectura.css']
})
export class ConfirmarLecturaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly terminosService = inject(TerminosService);
  private readonly language = inject(LanguageService);

  private readonly idioma = toSignal(this.language.lang$, { initialValue: this.language.lang });
  private readonly clave = this.route.snapshot.queryParamMap.get('clave');
  private readonly docs = viewChild<ElementRef<HTMLElement>>('docs');

  readonly estado = signal<Estado>('cargando');
  readonly nombre = signal('');
  readonly usuario = signal('');
  readonly aceptadoEn = signal<string | null>(null);
  readonly llegoAlFinal = signal(false);
  readonly acepto = signal(false);
  readonly enviando = signal(false);
  readonly error = signal('');
  // Con enlace termina en la pantalla de acceso; con sesión, sigue a la vitrina
  readonly conSesion = !this.clave;

  // Primero los términos y luego el aviso, como en las páginas /terminos y /privacidad
  readonly documentos = computed(() => [TEXTOS_LEGALES[this.idioma()].terminos, TEXTOS_LEGALES[this.idioma()].privacidad]);
  readonly actualizado = computed(() => ACTUALIZADO[this.idioma()]);
  readonly fecha = computed(() => {
    const valor = this.aceptadoEn();
    if (!valor) return '';
    return new Intl.DateTimeFormat(this.idioma() === 'en' ? 'en-US' : 'es-MX', { dateStyle: 'long', timeStyle: 'short' })
      .format(new Date(valor));
  });

  constructor() {
    this.aplicarTemaGuardado();

    if (this.clave) {
      this.terminosService.revisarEnlace(this.clave).subscribe({
        next: datos => {
          this.nombre.set(datos.nombres);
          this.usuario.set(datos.nombre_usuario);
          this.aceptadoEn.set(datos.aceptado_en);
          this.mostrar(datos.aceptado_en ? 'ya' : 'leer');
        },
        error: err => {
          this.error.set(err.error?.error || '');
          this.estado.set('invalido');
        }
      });
      return;
    }

    // Sin enlace: hace falta la sesión (viene del login)
    const sesion = this.authService.obtenerUsuario();
    if (!this.authService.estaAutenticado() || !sesion) {
      this.estado.set('invalido');
      return;
    }
    this.nombre.set(sesion.nombreCompleto.split(' ')[0]);
    this.usuario.set(sesion.nombre_usuario);
    this.mostrar('leer');
  }

  private mostrar(estado: Estado): void {
    this.estado.set(estado);
    // Si los textos caben sin desplazarse, ya se puede confirmar
    if (estado === 'leer') setTimeout(() => this.revisarFinal());
  }

  revisarFinal(): void {
    const caja = this.docs()?.nativeElement;
    if (caja && caja.scrollTop + caja.clientHeight >= caja.scrollHeight - 8) this.llegoAlFinal.set(true);
  }

  alMarcar(evento: Event): void {
    this.acepto.set((evento.target as HTMLInputElement).checked);
  }

  confirmar(): void {
    if (!this.acepto() || this.enviando()) return;
    this.enviando.set(true);
    this.error.set('');

    const peticion = this.clave
      ? this.terminosService.aceptarConEnlace(this.clave)
      : this.terminosService.aceptarConSesion();

    peticion.subscribe({
      next: resp => {
        this.enviando.set(false);
        this.aceptadoEn.set(resp.aceptado_en);
        if (!this.clave) this.authService.marcarTerminosAceptados();
        this.estado.set('listo');
      },
      error: err => {
        this.enviando.set(false);
        this.error.set(err.error?.error || 'No se pudo registrar la confirmación. Intente de nuevo.');
      }
    });
  }

  continuar(): void {
    this.router.navigate([this.conSesion ? '/inicio' : '/login']);
  }

  // Igual que las páginas legales: si se abre directo, aplica el tema que tenía guardado
  private aplicarTemaGuardado(): void {
    try {
      const tema = localStorage.getItem('olimpo:tema');
      if (tema === 'claro' || tema === 'oscuro') document.documentElement.setAttribute('data-tema', tema);
    } catch {
      // Sin localStorage (modo privado) se queda el tema por defecto.
    }
  }
}
