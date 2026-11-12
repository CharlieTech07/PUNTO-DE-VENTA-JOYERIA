// client/src/pages/ventas/cobro/cobro.ts
import {
  Component, ElementRef, Injector, afterNextRender, computed, inject, output, signal, viewChild
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CarritoService } from '../../../services/carrito.service';
import { AuthService } from '../../../services/auth.service';
import { VentasService } from '../../../services/ventas.service';
import { TranslatePipe } from '../../../services/translate.pipe';
import { Venta } from '../../../models/venta';
import {
  AUTORIZACION_VALIDA, LIMITE_EFECTIVO, MESES_SIN_INTERESES, MetodoPago, NOMBRE_METODO, PagoVenta, RASTREO_VALIDO
} from '../../../models/pago';
import { TicketVentaComponent } from '../ticket/ticket';

type Forma = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';

interface Revision {
  pagos: PagoVenta[]; // lo capturado aunque falte algo: con esto se llena el ticket
  listo: boolean; // ya se puede cobrar
  error: string;
}

const MAXIMO_PAGOS = 6; // el mismo que en el servidor

// Las cuentas van en centavos enteros, como en el servidor
const centavos = (n: number) => Math.round(n * 100);
const redondear = (n: number) => centavos(n) / 100;
// "$13,500.00" → 13500; lo que no sea número se ignora
const leerDinero = (texto: string) => {
  const n = Number(texto.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? redondear(n) : 0;
};
const conFormato = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Se abre con "Cobrar": cómo paga el cliente y, al confirmar, se registra la venta.
// A la derecha va el ticket, que se llena mientras se captura el pago.
@Component({
  selector: 'app-cobro',
  standalone: true,
  imports: [CurrencyPipe, TranslatePipe, TicketVentaComponent],
  templateUrl: './cobro.html',
  styleUrls: ['./cobro.css']
})
export class CobroComponent {
  public readonly carrito = inject(CarritoService);
  private readonly ventasService = inject(VentasService);
  private readonly injector = inject(Injector);

  public readonly cerrar = output<void>();
  public readonly registrada = output<Venta>();
  public readonly facturar = output<void>();

  public readonly fecha = new Date();
  public readonly atiende = inject(AuthService).obtenerUsuario()?.nombreCompleto ?? '';
  public readonly limiteEfectivo = LIMITE_EFECTIVO;
  public readonly mesesSinIntereses = MESES_SIN_INTERESES;
  public readonly nombreMetodo = NOMBRE_METODO;
  public readonly metodosMixto: MetodoPago[] = ['efectivo', 'debito', 'credito', 'transferencia'];

  public readonly total = computed(() => redondear(this.carrito.total()));
  // Botones rápidos además de "Exacto": los siguientes billetes redondos
  public readonly sugeridos = computed(() => {
    const total = this.total();
    return [...new Set([500, 1000, 5000].map(billete => Math.ceil(total / billete) * billete))]
      .filter(monto => monto > total);
  });

  // Lo que se va capturando
  public readonly forma = signal<Forma>('efectivo');
  public readonly recibidoTexto = signal('');
  public readonly tipoTarjeta = signal<'debito' | 'credito'>('debito');
  public readonly autorizacion = signal('');
  public readonly meses = signal(0);
  public readonly referencia = signal('');
  public readonly confirmada = signal(false);
  public readonly pagosMixto = signal<PagoVenta[]>([]);
  public readonly mixtoMetodo = signal<MetodoPago>('efectivo');
  public readonly mixtoMonto = signal('');
  public readonly mixtoReferencia = signal('');
  public readonly errorMixto = signal('');

  public readonly guardando = signal(false);
  public readonly errorServidor = signal('');
  public readonly venta = signal<Venta | null>(null);

  public readonly recibido = computed(() => leerDinero(this.recibidoTexto()));
  public readonly faltaEfectivo = computed(() => this.recibido() > 0 && this.recibido() < this.total());
  public readonly montoCambio = computed(() =>
    this.recibido() > 0 ? Math.abs(redondear(this.recibido() - this.total())) : 0
  );

  public readonly pagado = computed(() => redondear(this.pagosMixto().reduce((suma, p) => suma + p.monto, 0)));
  public readonly falta = computed(() => Math.max(0, redondear(this.total() - this.pagado())));
  public readonly avance = computed(() => (this.total() ? Math.min(100, (this.pagado() / this.total()) * 100) : 0));

  public readonly revision = computed<Revision>(() => {
    const total = this.total();
    switch (this.forma()) {
      case 'efectivo': {
        const recibido = this.recibido();
        const error = centavos(total) > centavos(LIMITE_EFECTIVO)
          ? 'Este total pasa del límite de efectivo: usa tarjeta, transferencia o pago mixto.' : '';
        return {
          pagos: [{
            metodo: 'efectivo', monto: total,
            recibido: recibido > 0 ? recibido : null,
            cambio: Math.max(0, redondear(recibido - total))
          }],
          listo: !error && centavos(recibido) >= centavos(total),
          error
        };
      }
      case 'tarjeta': {
        const autorizacion = this.autorizacion().trim();
        const valida = AUTORIZACION_VALIDA.test(autorizacion);
        const metodo = this.tipoTarjeta();
        return {
          pagos: [{ metodo, monto: total, referencia: autorizacion || null, meses: metodo === 'credito' ? this.meses() : 0 }],
          listo: valida,
          error: autorizacion && !valida ? 'La autorización son solo números (de 4 a 12).' : ''
        };
      }
      case 'transferencia': {
        const referencia = this.referencia().trim().toUpperCase();
        return {
          pagos: [{ metodo: 'transferencia', monto: total, referencia: referencia || null }],
          listo: RASTREO_VALIDO.test(referencia) && this.confirmada(),
          error: /^[A-Z0-9-]*$/.test(referencia) ? '' : 'La clave de rastreo lleva solo letras, números o guiones.'
        };
      }
      case 'mixto': {
        const pagos = this.pagosMixto();
        const efectivo = pagos.filter(p => p.metodo === 'efectivo').reduce((suma, p) => suma + p.monto, 0);
        const error = centavos(efectivo) > centavos(LIMITE_EFECTIVO) ? 'La parte en efectivo pasa del límite permitido.' : '';
        return { pagos, listo: !error && pagos.length > 0 && this.falta() === 0, error };
      }
    }
  });

  public readonly mensajeError = computed(() =>
    this.errorServidor() || (this.forma() === 'mixto' && this.errorMixto()) || this.revision().error
  );
  // El ticket de la derecha: lo capturado o, ya cobrada, lo que guardó el servidor
  public readonly pagosTicket = computed(() => this.venta()?.pagos ?? this.revision().pagos);
  public readonly cambioEntregar = computed(() =>
    redondear((this.venta()?.pagos ?? []).reduce((suma, p) => suma + (p.cambio ?? 0), 0))
  );

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly campoRecibido = viewChild<ElementRef<HTMLInputElement>>('campoRecibido');
  private readonly botonImprimir = viewChild<ElementRef<HTMLButtonElement>>('botonImprimir');
  private readonly ticket = viewChild.required(TicketVentaComponent);

  constructor() {
    afterNextRender(() => {
      const d = this.dialogo().nativeElement;
      if (!d.open) d.showModal();
      this.campoRecibido()?.nativeElement.focus();
    });
  }

  public valor(evento: Event): string {
    return (evento.target as HTMLInputElement | HTMLSelectElement).value;
  }

  public marcado(evento: Event): boolean {
    return (evento.target as HTMLInputElement).checked;
  }

  public elegir(forma: Forma): void {
    this.forma.set(forma);
    this.errorServidor.set('');
  }

  public usarRecibido(monto: number): void {
    this.recibidoTexto.set(conFormato(monto));
  }

  public elegirTarjeta(tipo: 'debito' | 'credito'): void {
    this.tipoTarjeta.set(tipo);
    if (tipo === 'debito') this.meses.set(0);
  }

  public elegirMetodoMixto(metodo: string): void {
    this.mixtoMetodo.set(metodo as MetodoPago);
    this.mixtoReferencia.set('');
    this.errorMixto.set('');
  }

  public agregarPago(): void {
    const metodo = this.mixtoMetodo();
    const monto = leerDinero(this.mixtoMonto());
    const referencia = this.mixtoReferencia().trim().toUpperCase();
    const tarjeta = metodo === 'debito' || metodo === 'credito';
    const error =
      this.pagosMixto().length >= MAXIMO_PAGOS ? 'Una venta puede llevar hasta 6 pagos.'
      : monto <= 0 ? 'Escribe el monto del pago.'
      : centavos(monto) > centavos(this.falta()) ? 'Ese monto es más de lo que falta por cobrar.'
      : tarjeta && !AUTORIZACION_VALIDA.test(referencia) ? 'La autorización son solo números (de 4 a 12).'
      : metodo === 'transferencia' && !RASTREO_VALIDO.test(referencia)
        ? 'Escribe la clave de rastreo de la transferencia (de 6 a 30 letras o números).'
      : '';
    this.errorMixto.set(error);
    if (error) return;
    this.pagosMixto.update(lista => [
      ...lista, { metodo, monto, referencia: metodo === 'efectivo' ? null : referencia, meses: 0 }
    ]);
    this.mixtoMonto.set('');
    this.mixtoReferencia.set('');
  }

  public quitarPago(indice: number): void {
    this.pagosMixto.update(lista => lista.filter((_, i) => i !== indice));
    this.errorMixto.set('');
  }

  public cobrar(): void {
    const { pagos, listo } = this.revision();
    if (!listo || this.guardando() || this.venta()) return;
    this.guardando.set(true);
    this.errorServidor.set('');
    this.ventasService.create({
      items: this.carrito.items().map(item => ({ id_inventario: item.id_inventario, cantidad: item.cantidad })),
      // Solo lo que el servidor necesita: el cambio lo vuelve a calcular él
      pagos: pagos.map(p => p.metodo === 'efectivo'
        ? { metodo: p.metodo, monto: p.monto, recibido: p.recibido ?? p.monto }
        : { metodo: p.metodo, monto: p.monto, referencia: p.referencia, meses: p.meses ?? 0 })
    }).subscribe({
      next: venta => {
        this.guardando.set(false);
        this.venta.set(venta);
        this.registrada.emit(venta);
        afterNextRender(() => this.botonImprimir()?.nativeElement.focus(), { injector: this.injector });
      },
      error: error => {
        this.guardando.set(false);
        this.errorServidor.set(error.error?.error ?? 'No se pudo registrar la venta. Intenta de nuevo.');
      }
    });
  }

  public imprimir(): void {
    this.ticket().imprimir();
  }

  // Mientras se registra la venta no se cierra: si no, no se sabría si quedó
  public cerrarSiSePuede(): void {
    if (!this.guardando()) this.cerrar.emit();
  }
}
