// client/src/services/metales.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MetalPrecio {
  symbol: string;
  nombre: string;
  usd_onza: number;
  usd_gramo: number;
  mxn_onza: number;
  mxn_gramo: number;
  actualizado: string;
}

export interface PreciosMetales {
  fuente: string;
  tipo_cambio_mxn: number;
  actualizado: string | null;
  desactualizado: boolean; // true si el servicio externo falló y se muestra el último precio guardado
  metales: MetalPrecio[];
}

@Injectable({
  providedIn: 'root'
})
export class MetalesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/metales';

  getPrecios(): Observable<PreciosMetales> {
    return this.http.get<PreciosMetales>(this.apiUrl);
  }
}
