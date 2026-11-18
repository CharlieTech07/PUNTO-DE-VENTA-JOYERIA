import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { MenuComponent } from '../../components/menu/menu';
import { AuthService } from '../../services/auth.service';
import { CajaService, CorteCaja, EstadoCaja, TipoMovimientoCaja } from '../../services/caja.service';
import { LanguageService } from '../../services/lenguage.service';
import { SucursalesService, Sucursal } from '../../services/sucursales.services';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, RouterLink, MenuComponent, TranslatePipe],
  templateUrl: './caja.html',
  styleUrls: ['./caja.css']
})
export class CajaComponent implements OnInit {
  private readonly cajaService = inject(CajaService);
  private readonly authService = inject(AuthService);
  private readonly language = inject(LanguageService);
  private readonly sucursalesService = inject(SucursalesService);

  public readonly usuario = this.authService.obtenerUsuario();
  public readonly estado = signal<EstadoCaja>({ turno: null, resumen: null });
  public readonly historial = signal<CorteCaja[]>([]);
  public readonly sucursales = signal<Sucursal[]>([]);
  public readonly cargando = signal(true);
  public readonly guardando = signal(false);
  public readonly error = signal('');
  public readonly aviso = signal('');

  public idSucursal = '';
  public efectivoInicial: string | number | null = '';
  public tipoMovimiento: TipoMovimientoCaja = 'INGRESO';
  public montoMovimiento: string | number | null = '';
  public motivoMovimiento = '';
  public efectivoContado: string | number | null = '';

  public get esAdministrador(): boolean {
    return this.usuario?.rol === 'Administrador';
  }

  public get diferenciaTentativa(): number | null {
    const texto = String(this.efectivoContado ?? '').trim();
    const resumen = this.estado().resumen;
    if (!texto || !resumen) return null;
    const contado = Number(texto);
    if (!Number.isFinite(contado) || contado < 0) return null;
    return Math.round((contado - resumen.efectivo_esperado) * 100) / 100;
  }

  ngOnInit(): void {
    if (this.esAdministrador) {
      this.sucursalesService.getSucursales().subscribe({
        next: sucursales => this.sucursales.set(sucursales.filter(s => s.activa !== false)),
        error: () => this.error.set('No se pudieron cargar las sucursales.')
      });
    }
    this.cargar();
  }

  public cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.cajaService.obtenerEstado().subscribe({
      next: estado => {
        this.estado.set(estado);
        this.cargando.set(false);
      },
      error: error => {
        this.estado.set({ turno: null, resumen: null });
        this.error.set(error.error?.error ?? 'No se pudo consultar el estado de caja.');
        this.cargando.set(false);
      }
    });
    this.cajaService.obtenerHistorial().subscribe({
      next: historial => this.historial.set(historial),
      error: error => this.error.set(error.error?.error ?? 'No se pudo consultar el historial de caja.')
    });
  }

  public abrirCaja(): void {
    const inicial = this.leerMonto(this.efectivoInicial, true);
    if (inicial === null) {
      this.error.set('Escribe un fondo inicial válido con máximo dos decimales.');
      return;
    }
    if (this.esAdministrador && !this.idSucursal) {
      this.error.set('Selecciona una sucursal válida para abrir la caja.');
      return;
    }
    this.enviar(() => this.cajaService.abrir(inicial, this.esAdministrador ? Number(this.idSucursal) : undefined), () => {
      this.efectivoInicial = '';
      this.aviso.set('Caja abierta correctamente.');
      this.cargar();
    });
  }

  public guardarMovimiento(): void {
    const monto = this.leerMonto(this.montoMovimiento, false);
    const motivo = this.motivoMovimiento.trim();
    if (monto === null) {
      this.error.set('El monto debe ser positivo y tener máximo dos decimales.');
      return;
    }
    if (!motivo || motivo.length > 240) {
      this.error.set('Escribe el motivo del movimiento (máximo 240 caracteres).');
      return;
    }
    this.enviar(() => this.cajaService.registrarMovimiento({
      tipo: this.tipoMovimiento, monto, motivo
    }), () => {
      this.montoMovimiento = '';
      this.motivoMovimiento = '';
      this.aviso.set('Movimiento registrado.');
      this.cargar();
    });
  }

  public cerrarCaja(): void {
    const contado = this.leerMonto(this.efectivoContado, true);
    if (contado === null) {
      this.error.set('Escribe el efectivo contado con máximo dos decimales.');
      return;
    }
    if (!confirm(this.avisoCierre())) return;
    this.enviar(() => this.cajaService.cerrar(contado), () => {
      this.efectivoContado = '';
      this.aviso.set('El corte de caja se guardó correctamente.');
      this.cargar();
    });
  }

  private avisoCierre(): string {
    const diferencia = this.diferenciaTentativa;
    if (diferencia === null) return this.language.t('¿Cerrar la caja con el efectivo contado?');
    if (diferencia === 0) return this.language.t('El efectivo coincide con lo esperado. ¿Cerrar la caja?');
    const monto = diferencia.toLocaleString(this.language.lang === 'en' ? 'en-US' : 'es-MX', { style: 'currency', currency: 'MXN' });
    return this.language.t('Hay una diferencia de {diferencia}. ¿Guardar el corte?').replace('{diferencia}', monto);
  }

  private enviar<T>(peticion: () => Observable<T>, exito: () => void): void {
    this.guardando.set(true);
    this.error.set('');
    this.aviso.set('');
    peticion().subscribe({
      next: () => {
        this.guardando.set(false);
        exito();
      },
      error: error => {
        this.guardando.set(false);
        this.error.set(error.error?.error ?? 'No se pudo completar la operación de caja.');
      }
    });
  }

  private leerMonto(valor: string | number | null, permitirCero: boolean): number | null {
    const texto = String(valor ?? '').trim();
    if (!texto) return permitirCero ? 0 : null;
    const monto = Number(texto);
    if (!Number.isFinite(monto) || (permitirCero ? monto < 0 : monto <= 0) || Math.abs(monto * 100 - Math.round(monto * 100)) > 1e-8) return null;
    return Math.round(monto * 100) / 100;
  }
}
