// client/src/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UsuarioSesion {
  id: string | number;
  nombreCompleto: string;
  correo: string;
  rol: 'Administrador' | 'Gerente' | 'Cajero';
  id_sucursal: number | null;
  nombre_sucursal: string;
}

export interface RespuestaLogin {
  mensaje: string;
  token: string;
  usuario: UsuarioSesion;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api/auth';
  private readonly TOKEN_KEY = 'olimpo_token';
  private readonly USER_KEY = 'olimpo_usuario';

  iniciarSesion(credenciales: { correo: string; contrasena: string }): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(respuesta => {
        // Guardar sesión en el almacenamiento local del navegador
        localStorage.setItem(this.TOKEN_KEY, respuesta.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(respuesta.usuario));
      })
    );
  }
  private getHeaders(): HttpHeaders {
  const token = this.obtenerToken();
  return new HttpHeaders({
    'Authorization': `Bearer ${token || ''}`
  });
  }

actualizarUsuario(id: number, datos: any): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/usuarios/${id}`, datos, {
    headers: this.getHeaders()
  });
  }

cambiarEstadoUsuario(id: number, activo: boolean): Observable<any> {
  return this.http.patch<any>(`${this.apiUrl}/usuarios/${id}/estado`, { activo }, {
    headers: this.getHeaders()
  });
  }

  obtenerUsuario(): UsuarioSesion | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  obtenerUsuarios(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/usuarios`);
  }

  // client/src/services/auth.service.ts

// En la clase AuthService:
crearUsuario(datosUsuario: {
    nombres: string;
    apellido_paterno: string;
    apellido_materno?: string;
    correo: string;
    contrasena: string;
    rol: 'Administrador' | 'Gerente' | 'Cajero';
    id_sucursal?: number | null;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/usuarios`, datosUsuario);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Hay sesión solo si existe un token y todavía no vence
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    if (!token) return false;

    if (!this.tokenVigente(token)) {
      this.cerrarSesion();
      return false;
    }
    return true;
  }

  private tokenVigente(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !payload.exp || payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}