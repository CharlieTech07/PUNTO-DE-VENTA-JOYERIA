// client/src/services/facturas.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Factura, ReceptorFactura } from '../models/factura';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FacturasService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = '/api/facturas';

  private get options() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.obtenerToken() ?? ''}` }) };
  }

  emitir(idVenta: number, receptor: ReceptorFactura): Observable<Factura> {
    return this.http.post<Factura>(this.apiUrl, { id_venta: idVenta, receptor }, this.options);
  }

  listar(): Observable<Factura[]> {
    return this.http.get<Factura[]>(this.apiUrl, this.options);
  }

  obtener(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/${id}`, this.options);
  }

  deVenta(idVenta: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/venta/${idVenta}`, this.options);
  }

  cancelar(id: number, motivo: string): Observable<Factura> {
    return this.http.patch<Factura>(`${this.apiUrl}/${id}/cancelar`, { motivo }, this.options);
  }
}