import { Component } from '@angular/core';
import { LanguageService } from '../../services/lenguage.service';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="language-toggle"
      (click)="toggleLanguage()"
      [attr.aria-label]="isEn ? 'Switch to Spanish' : 'Cambiar a inglés'"
      [attr.title]="isEn ? 'Spanish' : 'Inglés'"
    >
      <span class="flags-track" [class.is-en]="isEn">
        <span class="flag-slot">
          <span class="flag-es">
            <span class="es-red"></span>
            <span class="es-yellow"><span class="es-mark"></span></span>
            <span class="es-red"></span>
          </span>
        </span>

        <span class="flag-slot">
          <span class="flag-uk">
            <span class="uk-diagonal white forward"></span>
            <span class="uk-diagonal white backward"></span>
            <span class="uk-diagonal red forward"></span>
            <span class="uk-diagonal red backward"></span>
            <span class="uk-cross horizontal white"></span>
            <span class="uk-cross vertical white"></span>
            <span class="uk-cross horizontal red"></span>
            <span class="uk-cross vertical red"></span>
          </span>
        </span>
      </span>

      <span class="knob-layer">
        <span class="knob" [class.is-en]="isEn">
          {{ isEn ? 'EN' : 'ES' }}
        </span>
      </span>

      <span class="outline"></span>
    </button>
  `,
  styleUrls: ['./idioma.component.css']
})
export class LanguageToggleComponent {
  constructor(private readonly language: LanguageService) {}

  get isEn(): boolean {
    return this.language.lang === 'en';
  }

  toggleLanguage(): void {
    this.language.toggleLanguage();
  }
}
