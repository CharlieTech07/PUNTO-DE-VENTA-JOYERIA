// client/src/pages/ventas/ventas.ts
import { Component, OnInit, inject, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ResumenVentaComponent } from './resumen/resumen';
import { CobroComponent } from './cobro/cobro';
import { Venta } from '../../models/venta';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CurrencyPipe, TranslatePipe, ResumenVentaComponent, CobroComponent],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {
  public readonly carrito = inject(CarritoService);
  private readonly language = inject(LanguageService);

  public readonly cobroAbierto = signal(false);
  public readonly resumenAbierto = signal(false);
  public readonly ventaActual = signal<Venta | null>(null);
  public readonly ventaRegistrada = output<void>();

  ngOnInit(): void {
    this.carrito.sincronizarConSesion();
  }

  public vaciar(): void {
    if (confirm(this.language.t('¿Vaciar el carrito? Se quitarán todas las piezas.'))) {
      this.carrito.vaciar();
    }
  }

  // La venta se registra en el cobro (cobro.ts), al confirmar cómo pagó el cliente
  public abrirCobro(): void {
    if (!this.carrito.vacio()) this.cobroAbierto.set(true);
  }

  public alRegistrar(venta: Venta): void {
    this.ventaActual.set(venta);
    this.ventaRegistrada.emit();
  }

  // Si se cierra antes de cobrar, la venta sigue igual; si ya se cobró, se empieza otra
  public cerrarCobro(): void {
    this.cobroAbierto.set(false);
    if (this.ventaActual()) this.terminarVenta();
  }

  // "Generar factura" en el cobro: la factura se hace en el resumen
  public abrirFactura(): void {
    this.cobroAbierto.set(false);
    this.resumenAbierto.set(true);
  }

  public cerrarResumen(): void {
    this.resumenAbierto.set(false);
    this.terminarVenta();
  }

  private terminarVenta(): void {
    this.ventaActual.set(null);
    this.carrito.vaciar();
  }
}
