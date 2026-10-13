import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Lang = 'es' | 'en';

export const LANG_STORAGE_KEY = 'olimpo-lang';

type Translation = {
  es: string;
  en: string;
};

const spanishAliases: Record<string, string> = {
  'login.welcome': 'Bienvenido',
  'login.submit': 'Ingresar a la vitrina',
  'error_carga_productos': 'No se pudieron cargar los productos.'
};

const englishFallbacks: Record<string, string> = {
  'error_carga_productos': 'Products could not be loaded.'
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly languageSubject = new BehaviorSubject<Lang>(this.readSavedLanguage());
  private translationCatalog?: Record<string, Translation>;
  private catalogLoad?: Promise<void>;
  readonly lang$: Observable<Lang> = this.languageSubject.asObservable();

  constructor() {
    this.updateDocumentLanguage(this.lang);
    if (this.lang === 'en') {
      this.loadTranslationCatalog();
    }
  }

  get lang(): Lang {
    return this.languageSubject.value;
  }

  setLang(next: Lang): void {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LANG_STORAGE_KEY, next);
      }
    } catch {
      // The current session still changes language when storage is unavailable.
    }

    this.updateDocumentLanguage(next);
    this.languageSubject.next(next);
    if (next === 'en') {
      this.loadTranslationCatalog();
    }
  }

  toggleLanguage(): void {
    this.setLang(this.lang === 'es' ? 'en' : 'es');
  }

  t(key: string): string {
    if (this.lang === 'es') {
      return spanishAliases[key] ?? key;
    }

    return this.translationCatalog?.[key]?.en ?? englishFallbacks[key] ?? key;
  }

  translate(key: string): string {
    return this.t(key);
  }

  catalogPhrase(value: string): string {
    return this.t(value);
  }

  private readSavedLanguage(): Lang {
    try {
      if (typeof window === 'undefined') {
        return 'es';
      }

      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'en' || saved === 'es' ? saved : 'es';
    } catch {
      return 'es';
    }
  }

  private updateDocumentLanguage(lang: Lang): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  private loadTranslationCatalog(): void {
    if (this.translationCatalog || this.catalogLoad) {
      return;
    }

    this.catalogLoad = import('./translation-catalog')
      .then(({ translationCatalog }) => {
        this.translationCatalog = translationCatalog;
        if (this.lang === 'en') {
          this.languageSubject.next('en');
        }
      })
      .catch(() => {
        this.catalogLoad = undefined;
      });
  }
}
