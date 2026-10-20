// client/src/pages/legal/legal.ts
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ACTUALIZADO, Documento, TEXTOS_LEGALES } from './textos';

// Aviso de privacidad y términos y condiciones. Son páginas públicas
// (/privacidad y /terminos) que se abren desde los enlaces de la casilla del
// login (la opción B que votó el equipo). Las dos rutas usan este mismo
// componente; cuál documento mostrar viene en el "data" de la ruta.
@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './legal.html',
  styleUrls: ['./legal.css']
})
export class LegalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly language = inject(LanguageService);

  private readonly documento: Documento = this.route.snapshot.data['documento'] ?? 'privacidad';
  private readonly idioma = toSignal(this.language.lang$, { initialValue: this.language.lang });

  public readonly texto = computed(() => TEXTOS_LEGALES[this.idioma()][this.documento]);
  public readonly actualizado = computed(() => ACTUALIZADO[this.idioma()]);

  constructor() {
    // Cada pestaña es otra ruta: al cambiar, el texto empieza desde arriba.
    window.scrollTo(0, 0);

    // Si la página se abre directo (sin pasar por el login), el tema guardado
    // todavía no está aplicado. Solo se lee: aquí no se cambia el tema.
    try {
      const tema = localStorage.getItem('olimpo:tema');
      if (tema === 'claro' || tema === 'oscuro') {
        document.documentElement.setAttribute('data-tema', tema);
      }
    } catch {
      // Sin localStorage (modo privado) se queda el tema por defecto.
    }
  }
}
