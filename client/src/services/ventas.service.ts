import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venta } from '../models/venta';
import { AuthService } from './auth.service';

export interface CrearVenta {
  metodo_pago: Venta['metodo_pago'];
  items: Array<{ id_inventario: number; cantidad: number }>;
}

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = '/api/ventas';

  private get options() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.auth.obtenerToken() ?? ''}` }) };
  }

  getAll(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl, this.options);
  }

  getById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`, this.options);
  }

  create(payload: CrearVenta): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, payload, this.options);
  }

  update(id: number, payload: Partial<Venta>): Observable<Venta> {
    return this.http.put<Venta>(`${this.apiUrl}/${id}`, payload, this.options);
  }
}
