import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Venta } from '../models/venta';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/ventas';

  getAll(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
  }

  getById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  create(payload: Omit<Venta, 'id'>): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, payload);
  }

  update(id: number, payload: Partial<Venta>): Observable<Venta> {
    return this.http.put<Venta>(`${this.apiUrl}/${id}`, payload);
  }
}
