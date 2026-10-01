// client/src/services/inventario.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InventarioItem {
  id: number;
  id_sucursal: number;
  nombre_sucursal: string;
  id_producto: number;
  nombre_producto: string;
  tipo_metal: string;
  kilataje: string;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  ubicacion_vitrina: string;
  actualizado_en: string;
  seleccionado?: boolean; // Para el checkbox
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/inventario';

  getInventario(sucursalId?: number): Observable<InventarioItem[]> {
    const url = sucursalId ? `${this.apiUrl}?sucursalId=${sucursalId}` : this.apiUrl;
    return this.http.get<InventarioItem[]>(url);
  }

  asignarStock(datos: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, datos);
  }

  // Eliminar un solo registro
  eliminarInventario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Eliminar varios registros a la vez
  eliminarVarios(ids: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/eliminar-lote`, { ids });
  }
}