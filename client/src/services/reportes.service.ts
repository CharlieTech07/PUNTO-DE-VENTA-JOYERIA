import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RespuestaReporte {
  mensaje: string;
  sucursal: string;
  correo: string;
  ventas: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);

  generar(datos: { id_sucursal: number; fecha_inicio: string; fecha_fin: string; idioma: 'es' | 'en' }): Observable<RespuestaReporte> {
    return this.http.post<RespuestaReporte>('/api/reportes', datos);
  }
}
