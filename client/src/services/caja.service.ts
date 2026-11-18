import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoMovimientoCaja = 'INGRESO' | 'EGRESO';

export interface MovimientoCaja {
  id?: number;
  tipo: TipoMovimientoCaja;
  monto: number;
  motivo: string;
  fecha?: string;
}

export interface EstadoCaja {
  turno: {
    id: number;
    id_sucursal: number;
    estado: 'abierta';
    efectivo_inicial: number;
    fecha_apertura: string;
  } | null;
  resumen: {
    ventas_efectivo: number;
    ventas_tarjeta: number;
    ventas_transferencia: number;
    ingresos: number;
    egresos: number;
    efectivo_esperado: number;
    total_ventas: number;
  } | null;
}

export interface CorteCaja {
  id: number;
  id_sucursal: number;
  usuario_apertura: string;
  usuario_cierre: string | null;
  nombre_sucursal: string;
  efectivo_inicial: number;
  ventas_efectivo: number;
  ventas_tarjeta: number;
  ventas_transferencia: number;
  ingresos: number;
  egresos: number;
  efectivo_esperado: number;
  efectivo_contado: number;
  diferencia: number;
  fecha_apertura: string;
  fecha_cierre: string;
}

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/caja';

  obtenerEstado(): Observable<EstadoCaja> {
    return this.http.get<EstadoCaja>(`${this.apiUrl}/estado`);
  }

  obtenerHistorial(): Observable<CorteCaja[]> {
    return this.http.get<CorteCaja[]>(`${this.apiUrl}/historial`);
  }

  abrir(efectivo_inicial: number, id_sucursal?: number): Observable<EstadoCaja['turno']> {
    return this.http.post<EstadoCaja['turno']>(`${this.apiUrl}/abrir`, { efectivo_inicial, id_sucursal });
  }

  registrarMovimiento(movimiento: MovimientoCaja): Observable<MovimientoCaja> {
    return this.http.post<MovimientoCaja>(`${this.apiUrl}/movimientos`, movimiento);
  }

  cerrar(efectivo_contado: number): Observable<CorteCaja> {
    return this.http.post<CorteCaja>(`${this.apiUrl}/cerrar`, { efectivo_contado });
  }
}
