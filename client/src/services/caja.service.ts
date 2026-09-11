import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CierreCaja {
  fecha: string;
  ingresos: number;
  egresos: number;
  saldoFinal: number;
}

@Injectable({
  providedIn: 'root',
})
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/caja';

  getEstado(): Observable<{ apertura: boolean; monto: number }> {
    return this.http.get<{ apertura: boolean; monto: number }>(`${this.apiUrl}/estado`);
  }

  abrirCaja(montoBase: number): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/abrir`, { montoBase });
  }

  cerrarCaja(): Observable<CierreCaja> {
    return this.http.post<CierreCaja>(`${this.apiUrl}/cerrar`, {});
  }
}
