// client/src/pages/ventas/resumen/resumen.ts
import { Component, ElementRef, afterNextRender, inject, output, signal, viewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarritoService, sinIva } from '../../../services/carrito.service';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '../../../services/translate.pipe';

type Vista = 'ninguna' | 'ticket' | 'factura';

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

// Se despliega al dar "Finalizar venta": el resumen de lo agregado y, al lado,
// la vista previa del ticket o la factura.
@Component({
  selector: 'app-resumen-venta',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, TranslatePipe],
  templateUrl: './resumen.html',
  styleUrls: ['./resumen.css']
})
export class ResumenVentaComponent {
  public readonly carrito = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  public readonly cerrar = output<void>();

  public readonly fecha = new Date();
  public readonly atendio = this.authService.obtenerUsuario()?.nombreCompleto ?? '';
  public readonly vista = signal<Vista>('ninguna');
  public readonly datosFactura = signal<DatosFactura | null>(null);
  public readonly enviado = signal(false);
  public readonly regimenes = REGIMENES;
  public readonly usos = USOS_CFDI;
  public readonly sinIva = sinIva;

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

  // Un clic que cae directo en el <dialog> es un clic en el fondo oscuro:
  // el contenido lo cubre todo por dentro
  public alClicDialogo(evento: MouseEvent): void {
    if (evento.target === this.dialogo().nativeElement) this.cerrar.emit();
  }

  public ver(vista: Vista): void {
    this.vista.set(this.vista() === vista ? 'ninguna' : vista);
  }

  // El RFC siempre en mayúsculas, como viene en la constancia
  public rfcEnMayusculas(): void {
    const control = this.formulario.controls.rfc;
    control.setValue(control.value.toUpperCase().trim(), { emitEvent: false });
  }

  public generarFactura(): void {
    this.rfcEnMayusculas();
    this.enviado.set(true);
    if (this.formulario.invalid) return;
    this.datosFactura.set(this.formulario.getRawValue());
  }

  public editarFactura(): void {
    this.datosFactura.set(null);
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
