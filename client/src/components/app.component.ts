import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageToggleComponent } from '../pages/login/idioma.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LanguageToggleComponent],
  template: `
    <div class="global-language-toggle" [class.is-hidden]="languageToggleHidden">
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
      transition: transform 180ms ease, opacity 180ms ease;
    }
    .global-language-toggle.is-hidden {
      transform: translateY(calc(-100% - 20px));
      opacity: 0;
      pointer-events: none;
    }
    @media (max-width: 600px) {
      .global-language-toggle { top: 10px; right: 10px; }
    }
  `]
})
export class AppComponent {
  languageToggleHidden = false;
  private lastScrollY = typeof window === 'undefined' ? 0 : window.scrollY;
  private readonly scrollDirectionThreshold = 4;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = window.scrollY;

    if (currentScrollY <= 8) {
      this.languageToggleHidden = false;
      this.lastScrollY = currentScrollY;
      return;
    }

    const scrollDelta = currentScrollY - this.lastScrollY;
    if (scrollDelta > this.scrollDirectionThreshold) {
      this.languageToggleHidden = true;
      this.lastScrollY = currentScrollY;
    } else if (scrollDelta < -this.scrollDirectionThreshold) {
      this.languageToggleHidden = false;
      this.lastScrollY = currentScrollY;
    }
  }
}
