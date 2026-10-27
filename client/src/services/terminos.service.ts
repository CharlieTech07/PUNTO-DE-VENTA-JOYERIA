// client/src/services/terminos.service.ts
// Confirmación de lectura de los términos de uso y el aviso de privacidad
// (server/src/routes/terminos.ts). Con la clave del enlace del correo, o con la sesión.
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface DatosEnlace {
  nombres: string;
  nombre_usuario: string;
  version: string;
  aceptado_en: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TerminosService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = '/api/terminos';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.obtenerToken() || ''}` });
  }

  // Con el enlace del correo (no hace falta sesión: la clave hace de llave)
  revisarEnlace(clave: string): Observable<DatosEnlace> {
    return this.http.post<DatosEnlace>(`${this.apiUrl}/clave`, { clave });
  }

  aceptarConEnlace(clave: string): Observable<{ nombres: string; nombre_usuario: string; aceptado_en: string }> {
    return this.http.post<{ nombres: string; nombre_usuario: string; aceptado_en: string }>(
      `${this.apiUrl}/aceptar-con-clave`, { clave, acepto: true });
  }

  // Con la sesión iniciada (la primera vez que entra, si no confirmó desde el correo)
  aceptarConSesion(): Observable<{ aceptado_en: string }> {
    return this.http.post<{ aceptado_en: string }>(`${this.apiUrl}/aceptar`, { acepto: true }, { headers: this.getHeaders() });
  }
}
