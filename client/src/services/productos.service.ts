// client/src/services/productos.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/productos';

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  postProducto(producto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, producto);
  }

}