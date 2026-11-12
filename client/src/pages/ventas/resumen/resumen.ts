// client/src/pages/ventas/resumen/resumen.ts
import { Component, ElementRef, OnInit, afterNextRender, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarritoService, sinIva } from '../../../services/carrito.service';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '../../../services/translate.pipe';
import { FacturasService } from '../../../services/facturas.service';
import { Factura, ReceptorFactura } from '../../../models/factura';
import { Venta } from '../../../models/venta';
import { formaPagoSat } from '../../../models/pago';
import { TicketVentaComponent } from '../ticket/ticket';

export type Vista = 'ninguna' | 'ticket' | 'factura';

export interface DatosFactura {
  rfc: string;
  nombre: string;
  cp: string;
  regimen: string;
  uso: string;
  correo: string;
}

// Catálogos del SAT. Van sin traducir a propósito: son los nombres oficiales.
export const REGIMENES = [
  { clave: '601', nombre: 'General de Ley Personas Morales' },
  { clave: '603', nombre: 'Personas Morales con Fines no Lucrativos' },
  { clave: '605', nombre: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { clave: '606', nombre: 'Arrendamiento' },
  { clave: '612', nombre: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { clave: '616', nombre: 'Sin obligaciones fiscales' },
  { clave: '626', nombre: 'Régimen Simplificado de Confianza' }
];
export const USOS_CFDI = [
  { clave: 'G01', nombre: 'Adquisición de mercancías' },
  { clave: 'G03', nombre: 'Gastos en general' },
  { clave: 'S01', nombre: 'Sin efectos fiscales' }
];

// Se despliega con "Generar factura" en el cobro: el resumen de la venta y, al lado,
// la vista previa del ticket o la factura.
@Component({
  selector: 'app-resumen-venta',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink, TranslatePipe, TicketVentaComponent],
  templateUrl: './resumen.html',
  styleUrls: ['./resumen.css']
})
export class ResumenVentaComponent implements OnInit {
  public readonly carrito = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly facturasService = inject(FacturasService);
  private readonly datosNegocioService = inject(DatosNegocioService);

  public readonly venta = input<Venta | null>(null);
  // Con qué lado abre: el cobro lo abre ya en la factura
  public readonly vistaInicial = input<Vista>('ninguna');
  public readonly cerrar = output<void>();

  public readonly fecha = new Date();
  public readonly atendio = this.authService.obtenerUsuario()?.nombreCompleto ?? '';
  public readonly vista = signal<Vista>('ninguna');
  public readonly datosFactura = signal<DatosFactura | null>(null);
  public readonly facturaEmitida = signal<Factura | null>(null);
  public readonly emisor = signal<DatosFacturacionGuardados | null>(null);
  public readonly descargando = signal<'xml' | 'pdf' | null>(null);
  public readonly errorDescarga = signal('');
  public readonly emitiendo = signal(false);
  public readonly errorFactura = signal('');
  public readonly enviado = signal(false);
  public readonly regimenes = REGIMENES;
  public readonly usos = USOS_CFDI;
  public readonly sinIva = sinIva;
  // Forma de pago del SAT para la factura, según cómo se cobró
  public readonly formaPago = computed(() => formaPagoSat(this.venta()?.pagos ?? []));

  public readonly formulario = this.fb.nonNullable.group({
    rfc: ['', [Validators.required, Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i)]],
    nombre: ['', Validators.required],
    cp: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    regimen: ['', Validators.required],
    uso: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]]
  });

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    afterNextRender(() => {
      const d = this.dialogo().nativeElement;
      if (!d.open) d.showModal();
    });
  }

  ngOnInit(): void {
    this.vista.set(this.vistaInicial());
  }

  // Un clic que cae directo en el <dialog> es un clic en el fondo oscuro:
  // el contenido lo cubre todo por dentro
  public alClicDialogo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.cerrar.emit();
  }

  public ver(vista: Vista): void {
    const siguiente = this.vista() === vista ? 'ninguna' : vista;
    this.vista.set(siguiente);
    if (siguiente === 'factura' && !this.consultoEmisor) {
      this.consultoEmisor = true;
      this.datosNegocioService.obtenerFacturacion().subscribe({
        next: datos => this.emisor.set(datos),
        error: error => console.error('No se pudieron consultar los datos fiscales del emisor:', error)
      });
    }
  }

  // El RFC siempre en mayúsculas, como viene en la constancia
  public rfcEnMayusculas(): void {
    const control = this.formulario.controls.rfc;
    control.setValue(control.value.toUpperCase().trim(), { emitEvent: false });
  }

  public usarDatosDeEjemplo(): void {
    this.formulario.setValue({
      rfc: 'XAXX010101000',
      nombre: 'PUBLICO EN GENERAL (DEMO)',
      cp: '06000',
      regimen: '616',
      uso: 'S01',
      correo: 'cliente.demo@example.invalid'
    });
    this.enviado.set(false);
    this.errorFactura.set('');
  }

  public generarFactura(): void {
    this.rfcEnMayusculas();
    this.enviado.set(true);
    if (this.formulario.invalid) return;

    const ventaActual = this.venta();
    if (!ventaActual?.id) {
      this.errorFactura.set('No se encontró la venta a facturar.');
      return;
    }

    const receptor: ReceptorFactura = this.formulario.getRawValue();
    this.emitiendo.set(true);
    this.errorFactura.set('');
    this.facturasService.emitir(Number(ventaActual.id), receptor).subscribe({
      next: factura => {
        this.emitiendo.set(false);
        this.facturaEmitida.set(factura);
        this.datosFactura.set(receptor);
      },
      error: error => {
        this.emitiendo.set(false);
        const mensaje = error.error?.error ?? 'No se pudo generar la factura. Intenta de nuevo.';
        if (error.status === 409 && mensaje === 'Esta venta ya tiene una factura vigente') {
          this.facturasService.deVenta(Number(ventaActual.id)).subscribe({
            next: facturaExistente => {
              this.facturaEmitida.set(facturaExistente);
              this.datosFactura.set(facturaExistente.receptor);
              this.errorFactura.set('');
            },
            error: () => this.errorFactura.set(mensaje)
          });
          return;
        }
        this.errorFactura.set(mensaje);
      }
    });
  }

  public editarFactura(): void {
    // Si ya se emitió, no se permite editar: otra emisión daría 409.
    // Para corregir, un gerente la cancela.
    if (this.facturaEmitida()) return;
    this.datosFactura.set(null);
  }

  public descargarArchivo(tipo: 'xml' | 'pdf'): void {
    const factura = this.facturaEmitida();
    if (!factura?.id || this.descargando()) return;
    this.errorDescarga.set('');
    this.descargando.set(tipo);
    const peticion = tipo === 'xml'
      ? this.facturasService.descargarXmlDemostrativo(Number(factura.id))
      : this.facturasService.descargarPdfDemostrativo(Number(factura.id));

    peticion.subscribe({
      next: archivo => {
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `factura-${factura.folio_texto}-demostracion.${tipo}`;
        enlace.style.display = 'none';
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.descargando.set(null);
      },
      error: error => {
        this.descargando.set(null);
        const contenido = error.error;
        if (contenido instanceof Blob) {
          contenido.text().then(texto => {
            try {
              const respuesta = JSON.parse(texto);
              this.errorDescarga.set(this.mensajeDeErrorDescarga(error.status, respuesta.error));
            } catch {
              this.errorDescarga.set(this.mensajeDeErrorDescarga(error.status));
            }
          });
        } else {
          this.errorDescarga.set(this.mensajeDeErrorDescarga(error.status, contenido?.error));
        }
      }
    });
  }

  private mensajeDeErrorDescarga(estado: number, mensajeServidor?: string): string {
    if (estado === 401) return 'Tu sesión venció. Cierra sesión, vuelve a entrar e intenta la descarga otra vez.';
    if (estado === 404) return 'No se encontró la factura o la ruta de descarga. Actualiza la página y reinicia el servidor.';
    if (estado >= 500) return 'El servidor no pudo preparar el archivo. Confirma que ejecutaste la migración de datos bancarios y fiscales en pos_olimpo y reinicia el servidor.';
    return mensajeServidor || 'No se pudo descargar el archivo demostrativo.';
  }

  public error(campo: keyof DatosFactura): boolean {
    const control = this.formulario.controls[campo];
    return this.enviado() && control.invalid;
  }

  public nombreDe(lista: { clave: string; nombre: string }[], clave: string): string {
    const encontrado = lista.find(x => x.clave === clave);
    return encontrado ? `${encontrado.clave} · ${encontrado.nombre}` : clave;
  }
}
