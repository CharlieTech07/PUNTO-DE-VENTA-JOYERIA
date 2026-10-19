// client/src/pages/ventas/ventas.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ResumenVentaComponent } from './resumen/resumen';

// Módulo de ventas: el panel "Venta actual" con las piezas que se van a cobrar.
// TODAVÍA NO ESTÁ CONECTADO: no tiene ruta, no sale en el menú y la vitrina
// no le manda piezas. Falta decidir dónde se coloca.
// Para llenarlo, quien lo conecte llama a CarritoService.agregar(pieza).
@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CurrencyPipe, TranslatePipe, ResumenVentaComponent],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {
  public readonly carrito = inject(CarritoService);
  private readonly language = inject(LanguageService);

  public readonly resumenAbierto = signal(false);

  ngOnInit(): void {
    this.carrito.sincronizarConSesion();
  }

  public vaciar(): void {
    if (confirm(this.language.t('¿Vaciar el carrito? Se quitarán todas las piezas.'))) {
      this.carrito.vaciar();
    }
  }
}
