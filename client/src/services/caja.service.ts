// client/src/services/caja.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MovimientoCaja {
  id?: number;
  tipo: 'APERTURA' | 'INGRESO' | 'EGRESO' | 'CORTE';
  monto: number;
  motivo?: string;
  fecha?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/caja';

  obtenerEstadoCaja(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estado`);
  }

  registrarMovimiento(movimiento: MovimientoCaja): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/movimientos`, movimiento);
  }
}