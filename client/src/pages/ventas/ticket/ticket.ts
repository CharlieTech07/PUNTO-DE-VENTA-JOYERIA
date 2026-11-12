// client/src/pages/ventas/ticket/ticket.ts
import { Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { CarritoService } from '../../../services/carrito.service';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '../../../services/translate.pipe';
import { NOMBRE_METODO, PagoVenta } from '../../../models/pago';

// Hoja de estilo de la impresión: tinta negra y 72 mm de ancho, como un ticket de caja.
// Va aparte de ticket.css porque el ticket se imprime desde un marco con solo él adentro.
const ESTILO_IMPRESION = `
  body { width: 72mm; margin: 0 auto; color: #000; font: 12px/1.45 "Courier New", Courier, monospace; }
  .ticket p { margin: 0; text-align: center; }
  .ticket__marca { font: 600 20px Georgia, serif; letter-spacing: 6px; }
  .ticket__lema { font-size: 9px; letter-spacing: 3px; }
  .ticket__datos { display: grid; margin-top: 8px; text-align: center; }
  .ticket__corte { margin: 8px 0; border-top: 1px dashed #000; }
  .ticket__renglon { display: flex; justify-content: space-between; gap: 8px; }
  .ticket__sub { margin-bottom: 3px; font-size: 11px; }
  .ticket__total { margin-top: 3px; font-size: 13px; font-weight: 700; }
  .ticket .ticket__titulo { margin-bottom: 3px; text-align: left; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .ticket__gracias { font-weight: 700; }
  .ticket .ticket__privacidad, .ticket .ticket__aviso { margin-top: 4px; font-size: 9px; }
`;

// El ticket de la venta, en papel claro aunque el sistema esté en modo oscuro.
// Lo usan el cobro (se va llenando mientras se captura el pago) y el resumen.
@Component({
  selector: 'app-ticket-venta',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TranslatePipe],
  templateUrl: './ticket.html',
  styleUrls: ['./ticket.css']
})
export class TicketVentaComponent {
  public readonly carrito = inject(CarritoService);
  public readonly atendio = inject(AuthService).obtenerUsuario()?.nombreCompleto ?? '';

  public readonly fecha = input(new Date());
  public readonly folio = input<string | null>(null);
  // null: el ticket va sin la parte de "Forma de pago" (todavía no se cobra)
  public readonly pagos = input<PagoVenta[] | null>(null);

  public readonly nombreMetodo = NOMBRE_METODO;

  private readonly papel = viewChild.required<ElementRef<HTMLElement>>('papel');
  private marco: HTMLIFrameElement | null = null;

  // Imprime solo el ticket: lo copia a un marco invisible con ESTILO_IMPRESION.
  // El marco va dentro del <dialog> abierto, porque lo de afuera queda bloqueado.
  public imprimir(): void {
    this.marco?.remove();
    const papel = this.papel().nativeElement;
    const marco = document.createElement('iframe');
    marco.setAttribute('aria-hidden', 'true');
    marco.tabIndex = -1;
    marco.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0;';
    (papel.closest('dialog') ?? document.body).appendChild(marco);
    this.marco = marco;

    const ventana = marco.contentWindow;
    const hoja = marco.contentDocument;
    if (!ventana || !hoja) return;
    hoja.title = this.folio() ? `Ticket ${this.folio()}` : 'Ticket';
    const estilo = hoja.createElement('style');
    estilo.textContent = ESTILO_IMPRESION;
    hoja.head.appendChild(estilo);
    hoja.body.appendChild(hoja.importNode(papel, true));

    ventana.addEventListener('afterprint', () => {
      marco.remove();
      if (this.marco === marco) this.marco = null;
    }, { once: true });
    ventana.focus();
    ventana.print();
  }
}
