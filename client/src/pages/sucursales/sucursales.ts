import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SucursalesService } from './../../services/sucursales.services';
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
  private cd = inject(ChangeDetectorRef);
  private language = inject(LanguageService);

  listaSucursales: any[] = [];
  cargando: boolean = true;
  errorCarga: string = '';

  nuevaSucursal = {
    nombre: '',
    direccion: '',
    telefono: ''
  };

  ngOnInit(): void {
    this.cargarSucursales();
  }

  cargarSucursales(): void {
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

  guardarSucursal(): void {
    if (!this.nuevaSucursal.nombre.trim()) {
      alert(this.language.t('El nombre de la sucursal es obligatorio'));
      return;
    }

    this.sucursalesService.crearSucursal(this.nuevaSucursal).subscribe({
      next: (sucursalCreada) => {
        this.listaSucursales.push(sucursalCreada);
        this.nuevaSucursal = { nombre: '', direccion: '', telefono: '' };
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear sucursal:', err);
        alert(this.language.t('Error al crear sucursal. Por favor, inténtelo de nuevo.'));
        this.cd.detectChanges();
      }
    });
  }

  eliminarSucursal(id: number, nombre: string): void {
    const confirmacion = this.language.t('¿Está seguro de que desea eliminar la sucursal "{name}"?')
      .replace('{name}', nombre);
    if (confirm(confirmacion)) {
      this.sucursalesService.eliminarSucursal(id).subscribe({
        next: (respuesta) => {
          this.listaSucursales = this.listaSucursales.filter((s: any) => s?.id !== id);
          alert(this.language.t(respuesta?.mensaje ?? 'Sucursal eliminada correctamente'));
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error al eliminar sucursal:', err);
          if (err.status === 409) {
            alert(this.language.t('No se puede eliminar la sucursal porque tiene piezas de inventario o ventas asociadas.'));
          } else {
            alert(this.language.t('Error al eliminar sucursal. Por favor, inténtelo de nuevo.'));
          }
          this.cd.detectChanges();
        }
      });
    }
  }
}
