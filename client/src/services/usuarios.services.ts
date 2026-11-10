// client/src/services/usuarios.services.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Empleado {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  nombre_usuario: string;
  correo: string;
  rol: 'Administrador' | 'Gerente' | 'Cajero';
  id_sucursal: number | null;
  nombre_sucursal?: string;
  activo: boolean;
  // Cuándo confirmó que leyó los términos vigentes; null si todavía no
  terminos_aceptados_en?: string | null;
}

export interface NuevoEmpleadoPayload {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  nombre_usuario: string;
  correo: string;
  contrasena: string;
  rol: 'Administrador' | 'Gerente' | 'Cajero';
  id_sucursal: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/auth/usuarios';

  // Cabecera con token JWT para rutas protegidas
  private getHeaders(): HttpHeaders {
    const token = this.authService.obtenerToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`
    });
  }

  // 1. Obtener todos los empleados (pide sesión: la lista trae correos)
  obtenerUsuarios(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // 2. Crear nuevo empleado. El servidor le manda la bienvenida por correo y avisa si se pudo
  crearUsuario(datos: NuevoEmpleadoPayload): Observable<{ mensaje: string; usuario: Empleado; correoEnviado: boolean }> {
    return this.http.post<{ mensaje: string; usuario: Empleado; correoEnviado: boolean }>(this.apiUrl, datos, {
      headers: this.getHeaders()
    });
  }

  // 3. Editar datos o contraseña
  actualizarUsuario(id: number, datos: Partial<NuevoEmpleadoPayload>): Observable<{ mensaje: string; usuario: Empleado }> {
    return this.http.put<{ mensaje: string; usuario: Empleado }>(`${this.apiUrl}/${id}`, datos, {
      headers: this.getHeaders()
    });
  }

  // 4. Activar o desactivar empleado
  cambiarEstado(id: number, activo: boolean): Observable<{ mensaje: string; usuario: Empleado }> {
    return this.http.patch<{ mensaje: string; usuario: Empleado }>(`${this.apiUrl}/${id}/estado`, { activo }, {
      headers: this.getHeaders()
    });
  }
}