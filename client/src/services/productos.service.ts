import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/productos';

  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  getById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  create(payload: Omit<Producto, 'id'>): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, payload);
  }

  update(id: number, payload: Partial<Producto>): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
