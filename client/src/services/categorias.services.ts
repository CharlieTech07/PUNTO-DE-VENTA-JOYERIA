// client/src/services/sucursales.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/categorias';

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
  postCategorias(categorias: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, categorias);
  }

}