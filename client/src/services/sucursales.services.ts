// client/src/services/sucursales.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/sucursales';

  getSucursales(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  postSucursal(sucursales: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, sucursales);
  }

}