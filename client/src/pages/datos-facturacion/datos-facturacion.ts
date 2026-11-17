import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatosFacturacionGuardados, DatosFacturacionNegocio, DatosNegocioService } from '../../services/datos-negocio.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-datos-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './datos-facturacion.html',
  styleUrls: ['../datos-negocio.css']
})
export class DatosFacturacionComponent implements OnInit {
  private readonly service = inject(DatosNegocioService);
  private readonly router = inject(Router);
  private readonly cd = inject(ChangeDetectorRef);

  datosGuardados: DatosFacturacionGuardados | null = null;
  cargando = true;
  guardando = false;
  error = '';
  aviso = '';
  formulario: DatosFacturacionNegocio = this.formularioVacio();

  ngOnInit(): void { this.cargar(); }

  private formularioVacio(): DatosFacturacionNegocio {
    return {
      razon_social: '', rfc: '', regimen_fiscal: '', codigo_postal: '', calle: '', numero_exterior: '',
      numero_interior: '', colonia: '', municipio: '', estado: '', correo: '', telefono: ''
    };
  }

  cargar(): void {
    this.cargando = true;
    this.service.obtenerFacturacion().subscribe({
      next: datos => {
        this.datosGuardados = datos;
        if (datos) this.formulario = { ...datos };
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: err => { this.error = err.error?.error ?? 'No se pudieron cargar los datos fiscales.'; this.cargando = false; this.cd.detectChanges(); }
    });
  }

  guardar(): void {
    const datos: DatosFacturacionNegocio = {
      ...this.formulario,
      razon_social: this.formulario.razon_social.trim(),
      rfc: this.formulario.rfc.trim().toUpperCase(),
      regimen_fiscal: this.formulario.regimen_fiscal.trim(),
      codigo_postal: this.formulario.codigo_postal.trim(),
      calle: this.formulario.calle.trim(),
      numero_exterior: this.formulario.numero_exterior.trim(),
      numero_interior: this.formulario.numero_interior?.trim() || null,
      colonia: this.formulario.colonia?.trim() || null,
      municipio: this.formulario.municipio?.trim() || null,
      estado: this.formulario.estado?.trim() || null,
      correo: this.formulario.correo?.trim() || null,
      telefono: this.formulario.telefono?.trim() || null
    };
    if (!datos.razon_social || !datos.rfc || !datos.regimen_fiscal || !datos.codigo_postal || !datos.calle || !datos.numero_exterior) {
      this.error = 'Completa razón social, RFC, régimen fiscal, código postal y domicilio.';
      return;
    }
    if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/.test(datos.rfc)) {
      this.error = 'El RFC debe tener formato válido de 12 o 13 caracteres.';
      return;
    }
    if (!/^\d{3}$/.test(datos.regimen_fiscal) || !/^\d{5}$/.test(datos.codigo_postal)) {
      this.error = 'El régimen fiscal debe ser una clave de 3 dígitos y el código postal de 5.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.service.guardarFacturacion(datos).subscribe({
      next: guardados => {
        this.datosGuardados = guardados;
        this.formulario = { ...guardados };
        this.aviso = 'Datos fiscales guardados correctamente.';
        this.guardando = false;
        this.cd.detectChanges();
      },
      error: err => {
        this.error = err.error?.error ?? 'No se pudieron guardar los datos fiscales.';
        this.guardando = false;
        this.cd.detectChanges();
      }
    });
  }

  volverAlDashboard(): void { this.router.navigate(['/dashboard'], { fragment: 'apartados' }); }
}
