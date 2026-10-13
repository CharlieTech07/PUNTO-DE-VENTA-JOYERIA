import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageToggleComponent } from '../pages/login/idioma.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LanguageToggleComponent],
  template: `
    <div class="global-language-toggle">
      <app-language-toggle></app-language-toggle>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host { display: block; }
    .global-language-toggle {
      position: fixed;
      top: 16px;
      right: 20px;
      z-index: 1000;
    }
    @media (max-width: 600px) {
      .global-language-toggle { top: 10px; right: 10px; }
    }
  `]
})
export class AppComponent {}
