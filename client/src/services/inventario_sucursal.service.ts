// client/src/services/inventario_sucursal.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Inventario_SucursalService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/inventario_sucursal';

  getInventario_Sucursal(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  postInventario_Sucursal(inventario_sucursal: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, inventario_sucursal);
  }

}