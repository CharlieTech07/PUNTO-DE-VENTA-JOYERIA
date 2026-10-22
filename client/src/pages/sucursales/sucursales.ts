// client/src/pages/sucursales/sucursales.ts
import { Component, OnInit, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SucursalesService, Sucursal } from '../../services/sucursales.services';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/lenguage.service';
import { TranslatePipe } from '../../services/translate.pipe';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './sucursales.html',
  styleUrls: ['./sucursales.css']
})
export class SucursalesComponent implements OnInit {
  private sucursalesService = inject(SucursalesService);
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);
  private cd = inject(ChangeDetectorRef);

  // Avisa al dashboard cuando se crea o elimina una sucursal, para que refresque sus datos
  @Output() cambio = new EventEmitter<void>();

  public usuario = this.authService.obtenerUsuario();

  public listaSucursales: Sucursal[] = [];
  public cargando: boolean = true;
  public errorCarga: string = '';
  public guardando: boolean = false;

  public aviso: { tipo: 'ok' | 'error'; texto: string } | null = null;
  private temporizadorAviso: any;

  public nuevaSucursal = {
    nombre: '',
    direccion: '',
    telefono: ''
  };

  // Solo el Administrador puede dar de alta o eliminar sucursales
  public get esAdmin(): boolean {
    return this.usuario?.rol === 'Administrador';
  }

  public get totalActivas(): number {
    return this.listaSucursales.filter(s => s.activa !== false).length;
  }

  public get masReciente(): string {
    if (this.listaSucursales.length === 0) return '—';
    const ultima = this.listaSucursales.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a));
    return ultima.nombre;
  }

  ngOnInit(): void {
    this.cargarSucursales();
  }

  public cargarSucursales(): void {
    this.sucursalesService.getSucursales().subscribe({
      next: (datos) => {
        this.listaSucursales = datos;
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar sucursales:', err);
        this.errorCarga = 'No se pudo conectar con la base de datos';
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  public guardarSucursal(): void {
    if (!this.esAdmin) {
      this.mostrarAviso('error', 'Solo el Administrador puede dar de alta sucursales.');
      return;
    }
    if (!this.nuevaSucursal.nombre.trim() || !this.nuevaSucursal.direccion.trim()) {
      this.mostrarAviso('error', 'El nombre y la dirección son obligatorios.');
      return;
    }

    this.guardando = true;
    this.sucursalesService.crearSucursal(this.nuevaSucursal).subscribe({
      next: (creada) => {
        this.listaSucursales = [...this.listaSucursales, creada];
        this.nuevaSucursal = { nombre: '', direccion: '', telefono: '' };
        this.guardando = false;
        this.mostrarAviso('ok', this.languageService.t('Sucursal registrada correctamente.') + ` (${creada.nombre})`);
        this.cambio.emit();
      },
      error: (err) => {
        console.error('Error al crear sucursal:', err);
        this.guardando = false;
        this.mostrarAviso('error', err.error?.error || 'No se pudo registrar la sucursal.');
      }
    });
  }

  public eliminarSucursal(id: number, nombre: string): void {
    if (!this.esAdmin) return;
    const pregunta = this.languageService.t('¿Seguro que deseas eliminar la sucursal "{item}"?').replace('{item}', nombre);
    if (!confirm(pregunta)) return;

    this.sucursalesService.eliminarSucursal(id).subscribe({
      next: () => {
        this.listaSucursales = this.listaSucursales.filter(s => s.id !== id);
        this.mostrarAviso('ok', 'Sucursal eliminada correctamente.');
        this.cambio.emit();
      },
      error: (err) => {
        console.error('Error al eliminar sucursal:', err);
        this.mostrarAviso('error', err.error?.error || 'No se pudo eliminar la sucursal.');
      }
    });
  }

  private mostrarAviso(tipo: 'ok' | 'error', texto: string): void {
    // Los mensajes fijos se traducen; los que vienen del servidor se muestran tal cual
    this.aviso = { tipo, texto: this.languageService.t(texto) };
    clearTimeout(this.temporizadorAviso);
    this.temporizadorAviso = setTimeout(() => {
      this.aviso = null;
      this.cd.detectChanges();
    }, 4500);
    this.cd.detectChanges();
  }
}
