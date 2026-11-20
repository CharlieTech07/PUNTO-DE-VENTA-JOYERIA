import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../../components/menu/menu';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/lenguage.service';
import { ReportesService, RespuestaReporte } from '../../services/reportes.service';
import { Sucursal, SucursalesService } from '../../services/sucursales.services';
import { TranslatePipe } from '../../services/translate.pipe';

type PeriodoRapido = 'dia' | 'semana' | 'mes' | 'anio' | 'personalizado';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuComponent, TranslatePipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class ReportesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly languageService = inject(LanguageService);
  private readonly reportes = inject(ReportesService);
  private readonly sucursalesService = inject(SucursalesService);

  readonly usuario = this.auth.obtenerUsuario();
  readonly esAdministrador = this.usuario?.rol === 'Administrador';
  periodoSeleccionado: PeriodoRapido = 'mes';
  sucursales: Sucursal[] = [];
  idSucursal = this.usuario?.id_sucursal ?? 0;
  fechaInicio = '';
  fechaFin = '';
  cargando = false;
  cargandoSucursales = false;
  error = '';
  respuesta: RespuestaReporte | null = null;
  estadoEnvio: 'inactivo' | 'generando' | 'enviado' = 'inactivo';
  mensajeEnvio = '';

  ngOnInit(): void {
    this.seleccionarPeriodo('mes');
    if (this.esAdministrador) this.cargarSucursales();
  }

  seleccionarPeriodo(periodo: Exclude<PeriodoRapido, 'personalizado'>): void {
    const hoy = new Date();
    const fechaActual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let inicio: Date;
    let fin: Date;
    if (periodo === 'dia') {
      inicio = fin = fechaActual;
    } else if (periodo === 'semana') {
      inicio = new Date(fechaActual);
      const diasDesdeLunes = (inicio.getDay() + 6) % 7;
      inicio.setDate(inicio.getDate() - diasDesdeLunes);
      fin = fechaActual;
    } else if (periodo === 'anio') {
      inicio = new Date(hoy.getFullYear(), 0, 1);
      fin = fechaActual;
    } else {
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = fechaActual;
    }
    this.periodoSeleccionado = periodo;
    this.fechaInicio = this.fechaIso(inicio);
    this.fechaFin = this.fechaIso(fin);
  }

  rangoEditado(): void {
    this.periodoSeleccionado = 'personalizado';
  }

  private fechaIso(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private cargarSucursales(): void {
    this.cargandoSucursales = true;
    this.sucursalesService.getSucursales().subscribe({
      next: sucursales => {
        this.sucursales = sucursales.filter(s => s.activa !== false);
        if (!this.idSucursal && this.sucursales.length) this.idSucursal = this.sucursales[0].id;
        this.cargandoSucursales = false;
      },
      error: () => {
        this.error = this.languageService.t('No se pudo cargar la lista de sucursales.');
        this.cargandoSucursales = false;
      }
    });
  }

  generar(): void {
    this.error = '';
    this.respuesta = null;
    this.mensajeEnvio = '';
    if (!this.fechaInicio || !this.fechaFin || this.fechaInicio > this.fechaFin) {
      this.error = this.languageService.t('Selecciona un rango de fechas válido.');
      return;
    }
    if (!Number.isSafeInteger(Number(this.idSucursal)) || Number(this.idSucursal) <= 0) {
      this.error = this.languageService.t('Selecciona una sucursal.');
      return;
    }

    this.cargando = true;
    this.estadoEnvio = 'generando';
    this.reportes.generar({
      id_sucursal: Number(this.idSucursal), fecha_inicio: this.fechaInicio, fecha_fin: this.fechaFin,
      idioma: this.languageService.lang
    }).subscribe({
      next: respuesta => {
        this.respuesta = respuesta;
        this.estadoEnvio = 'enviado';
        this.mensajeEnvio = respuesta.mensaje;
        this.cargando = false;
      },
      error: err => {
        this.error = this.languageService.t(err.error?.error || 'No se pudo generar el reporte.');
        this.estadoEnvio = 'inactivo';
        this.cargando = false;
      }
    });
  }
}
