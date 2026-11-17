import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CuentaBancaria, DatosCuentaBancaria, DatosNegocioService } from '../../services/datos-negocio.service';
import { Sucursal, SucursalesService } from '../../services/sucursales.services';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-datos-bancarios',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './datos-bancarios.html',
  styleUrls: ['../datos-negocio.css']
})
export class DatosBancariosComponent implements OnInit {
  private readonly service = inject(DatosNegocioService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly router = inject(Router);
  private readonly cd = inject(ChangeDetectorRef);

  cuentas: CuentaBancaria[] = [];
  sucursales: Sucursal[] = [];
  filtroSucursalId: number | null = null;
  cargando = true;
  guardando = false;
  error = '';
  aviso = '';
  editandoId: number | null = null;
  formulario: DatosCuentaBancaria = this.formularioVacio();

  get enEdicion(): boolean { return this.editandoId !== null; }

  private formularioVacio(): DatosCuentaBancaria {
    return { id_sucursal: 0, alias: '', banco: '', titular: '', tipo_cuenta: 'Cuenta', numero_cuenta: '', clabe: '', moneda: 'MXN', forma_pago: '' };
  }

  ngOnInit(): void {
    this.sucursalesService.getSucursales().subscribe({
      next: datos => { this.sucursales = datos.filter(sucursal => sucursal.activa !== false); this.cd.detectChanges(); },
      error: () => { this.error = 'No se pudieron cargar las sucursales.'; this.cd.detectChanges(); }
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.obtenerCuentas(this.filtroSucursalId).subscribe({
      next: datos => { this.cuentas = datos; this.cargando = false; this.cd.detectChanges(); },
      error: () => { this.error = 'No se pudieron cargar las cuentas bancarias.'; this.cargando = false; this.cd.detectChanges(); }
    });
  }

  editar(cuenta: CuentaBancaria): void {
    this.editandoId = cuenta.id;
    this.aviso = '';
    this.error = '';
    this.formulario = {
      alias: cuenta.alias,
      id_sucursal: cuenta.id_sucursal ?? 0,
      banco: cuenta.banco,
      titular: cuenta.titular,
      tipo_cuenta: cuenta.tipo_cuenta,
      numero_cuenta: cuenta.numero_cuenta ?? '',
      clabe: cuenta.clabe ?? '',
      moneda: cuenta.moneda,
      forma_pago: cuenta.forma_pago ?? ''
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void { this.editandoId = null; this.formulario = this.formularioVacio(); }

  filtrarSucursal(id: string): void {
    this.filtroSucursalId = id ? Number(id) : null;
    this.cargar();
  }

  guardar(): void {
    const datos: DatosCuentaBancaria = {
      ...this.formulario,
      alias: this.formulario.alias.trim(),
      banco: this.formulario.banco.trim(),
      titular: this.formulario.titular.trim(),
      numero_cuenta: this.formulario.numero_cuenta?.trim() || null,
      clabe: this.formulario.clabe?.trim() || null,
      forma_pago: this.formulario.forma_pago?.trim() || null,
      moneda: this.formulario.moneda.trim().toUpperCase()
    };
    if (!datos.id_sucursal || !datos.alias || !datos.banco || !datos.titular || !datos.tipo_cuenta) {
      this.error = 'Selecciona la sucursal y completa alias, banco, titular y tipo de cuenta.';
      return;
    }
    if (!datos.numero_cuenta && !datos.clabe) {
      this.error = 'Captura una CLABE o un número de cuenta.';
      return;
    }
    if (datos.clabe && !/^\d{18}$/.test(datos.clabe)) {
      this.error = 'La CLABE debe contener exactamente 18 dígitos.';
      return;
    }

    this.guardando = true;
    this.error = '';
    const peticion = this.enEdicion
      ? this.service.actualizarCuenta(this.editandoId!, datos)
      : this.service.crearCuenta(datos);
    peticion.subscribe({
      next: () => {
        this.aviso = this.enEdicion ? 'Cuenta bancaria actualizada correctamente.' : 'Cuenta bancaria registrada correctamente.';
        this.cancelarEdicion();
        this.guardando = false;
        this.cargar();
      },
      error: err => {
        this.error = err.error?.error ?? 'No se pudo guardar la cuenta bancaria.';
        this.guardando = false;
        this.cd.detectChanges();
      }
    });
  }

  cambiarEstado(cuenta: CuentaBancaria): void {
    this.service.cambiarEstadoCuenta(cuenta.id, !cuenta.activa).subscribe({
      next: () => { this.aviso = cuenta.activa ? 'Cuenta bancaria desactivada.' : 'Cuenta bancaria activada.'; this.cargar(); },
      error: err => { this.error = err.error?.error ?? 'No se pudo cambiar el estado de la cuenta.'; this.cd.detectChanges(); }
    });
  }

  volverAlDashboard(): void { this.router.navigate(['/dashboard'], { fragment: 'apartados' }); }
}
