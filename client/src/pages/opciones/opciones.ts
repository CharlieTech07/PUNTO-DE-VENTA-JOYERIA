import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Lang, LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';

type Tema = 'claro' | 'oscuro';
type TamanoTipografia = 'pequena' | 'normal' | 'grande';

@Component({
  selector: 'app-opciones',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './opciones.html',
  styleUrls: ['./opciones.css']
})
export class OpcionesComponent implements OnInit {
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  temaActual: Tema = 'oscuro';
  tamanoActual: TamanoTipografia = 'normal';

  ngOnInit(): void {
    this.temaActual = this.leerTema();
    this.aplicarTema(this.temaActual);
    this.tamanoActual = this.leerTamano();
    this.aplicarTamano(this.tamanoActual);
  }

  get idiomaActual(): Lang { return this.language.lang; }

  seleccionarTema(tema: Tema): void {
    this.temaActual = tema;
    this.aplicarTema(tema);
  }

  seleccionarIdioma(idioma: Lang): void { this.language.setLang(idioma); }

  seleccionarTamano(tamano: TamanoTipografia): void {
    this.tamanoActual = tamano;
    this.aplicarTamano(tamano);
  }

  volverAlDashboard(): void { this.router.navigate(['/dashboard'], { fragment: 'apartados' }); }

  private leerTema(): Tema {
    try { return localStorage.getItem('olimpo:tema') === 'claro' ? 'claro' : 'oscuro'; }
    catch { return 'oscuro'; }
  }

  private aplicarTema(tema: Tema): void {
    document.documentElement.dataset['tema'] = tema;
    try { localStorage.setItem('olimpo:tema', tema); } catch {}
  }

  private leerTamano(): TamanoTipografia {
    try {
      const guardado = localStorage.getItem('olimpo:tamano-tipografia');
      return guardado === 'pequena' || guardado === 'grande' ? guardado : 'normal';
    } catch { return 'normal'; }
  }

  private aplicarTamano(tamano: TamanoTipografia): void {
    document.documentElement.dataset['tamanoTipografia'] = tamano;
    try { localStorage.setItem('olimpo:tamano-tipografia', tamano); } catch {}
  }
}
