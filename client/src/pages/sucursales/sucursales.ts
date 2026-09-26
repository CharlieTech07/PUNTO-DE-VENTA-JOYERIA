import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SucursalesService } from './../../services/sucursales.services';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sucursales.html'
})
export class SucursalesComponent implements OnInit {
  private sucursalesService = inject(SucursalesService);
  private cd = inject(ChangeDetectorRef);

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
      alert('El nombre de la sucursal es obligatorio');
      return;
    }

    this.sucursalesService.postSucursal(this.nuevaSucursal).subscribe({
        next: (nuevaSucursal) => {
            this.listaSucursales.push(nuevaSucursal);
            this.nuevaSucursal = { nombre: '', direccion: '', telefono: '' };
            this.cd.detectChanges();
            alert('¡Sucursal guardada correctamente en pos_olimpo!');
        },
        error: (err) => {
            console.error('Error al guardar sucursal:', err);
            alert('Ocurrió un error al guardar la sucursal');
            this.cd.detectChanges();
        }
    });
  }
}