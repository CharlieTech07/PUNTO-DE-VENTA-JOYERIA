// client/src/pages/ventas/ventas.ts
import { Component, OnInit, inject, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';
import { ResumenVentaComponent } from './resumen/resumen';
import { VentasService } from '../../services/ventas.service';

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
  private readonly ventasService = inject(VentasService);

  public readonly resumenAbierto = signal(false);
  public readonly guardando = signal(false);
  public readonly errorVenta = signal('');
  public readonly ventaRegistrada = output<void>();

  ngOnInit(): void {
    this.carrito.sincronizarConSesion();
  }

  public vaciar(): void {
    if (confirm(this.language.t('¿Vaciar el carrito? Se quitarán todas las piezas.'))) {
      this.carrito.vaciar();
    }
  }

  public finalizarVenta(): void {
    if (this.carrito.vacio() || this.guardando()) return;
    this.guardando.set(true);
    this.errorVenta.set('');
    this.ventasService.create({
      metodo_pago: 'efectivo',
      items: this.carrito.items().map(item => ({
        id_inventario: item.id_inventario,
        cantidad: item.cantidad
      }))
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.resumenAbierto.set(true);
        this.ventaRegistrada.emit();
      },
      error: error => {
        this.guardando.set(false);
        this.errorVenta.set(error.error?.error ?? 'No se pudo registrar la venta. Intenta de nuevo.');
      }
    });
  }

  public cerrarResumen(): void {
    this.resumenAbierto.set(false);
    this.carrito.vaciar();
  }
}
