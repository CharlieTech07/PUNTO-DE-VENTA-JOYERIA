import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  rfc_identificacion: string | null;
  activo: boolean;
}

export type DatosProveedor = Omit<Proveedor, 'id' | 'activo'>;

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/proveedores';

  obtenerTodos(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  crear(datos: DatosProveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: DatosProveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, datos);
  }
}
