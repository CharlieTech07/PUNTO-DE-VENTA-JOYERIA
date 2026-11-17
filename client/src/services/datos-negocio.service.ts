import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DatosFacturacionNegocio {
  razon_social: string;
  rfc: string;
  regimen_fiscal: string;
  codigo_postal: string;
  calle: string;
  numero_exterior: string;
  numero_interior: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  correo: string | null;
  telefono: string | null;
}

export interface DatosFacturacionGuardados extends DatosFacturacionNegocio {
  id: number;
  actualizado_en: string;
}

export interface CuentaBancaria {
  id: number;
  id_sucursal: number | null;
  sucursal: string | null;
  alias: string;
  banco: string;
  titular: string;
  tipo_cuenta: string;
  numero_cuenta: string | null;
  clabe: string | null;
  moneda: string;
  forma_pago: string | null;
  activa: boolean;
}

export type DatosCuentaBancaria = Omit<CuentaBancaria, 'id' | 'activa' | 'sucursal'>;

@Injectable({ providedIn: 'root' })
export class DatosNegocioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/datos-negocio';

  obtenerFacturacion(): Observable<DatosFacturacionGuardados | null> {
    return this.http.get<DatosFacturacionGuardados | null>(`${this.apiUrl}/facturacion`);
  }

  guardarFacturacion(datos: DatosFacturacionNegocio): Observable<DatosFacturacionGuardados> {
    return this.http.put<DatosFacturacionGuardados>(`${this.apiUrl}/facturacion`, datos);
  }

  obtenerCuentas(idSucursal?: number | null): Observable<CuentaBancaria[]> {
    const query = idSucursal ? `?sucursalId=${idSucursal}` : '';
    return this.http.get<CuentaBancaria[]>(`${this.apiUrl}/bancarios${query}`);
  }

  crearCuenta(datos: DatosCuentaBancaria): Observable<CuentaBancaria> {
    return this.http.post<CuentaBancaria>(`${this.apiUrl}/bancarios`, datos);
  }

  actualizarCuenta(id: number, datos: DatosCuentaBancaria): Observable<CuentaBancaria> {
    return this.http.put<CuentaBancaria>(`${this.apiUrl}/bancarios/${id}`, datos);
  }

  cambiarEstadoCuenta(id: number, activa: boolean): Observable<CuentaBancaria> {
    return this.http.patch<CuentaBancaria>(`${this.apiUrl}/bancarios/${id}/estado`, { activa });
  }
}
