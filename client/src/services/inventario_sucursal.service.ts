// client/src/services/inventario.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
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

export interface ProductoSucursal {
  id: number; // id del producto
  id_inventario: number;
  id_sucursal: number;
  nombre_sucursal: string;
  nombre: string;
  descripcion: string;
  tipo_metal: string;
  kilataje: string;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  ubicacion_vitrina: string;
  imagen_base64?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/inventario';

  getInventario(sucursalId?: number): Observable<InventarioItem[]> {
    const url = sucursalId ? `${this.apiUrl}?sucursalId=${sucursalId}` : this.apiUrl;
    return this.http.get<InventarioItem[]>(url);
  }

  // Inventario para el inicio: Gerente/Cajero reciben el de su sucursal,
  // el Administrador recibe todas (o una si pasa sucursalId)
  getMiInventario(sucursalId?: number): Observable<ProductoSucursal[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.obtenerToken() || ''}`
    });
    const url = sucursalId
      ? `${this.apiUrl}/mi-sucursal?sucursalId=${sucursalId}`
      : `${this.apiUrl}/mi-sucursal`;
    return this.http.get<ProductoSucursal[]>(url, { headers });
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