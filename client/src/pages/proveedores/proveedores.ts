import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Proveedor, ProveedoresService } from '../../services/proveedores.service';
import { TranslatePipe } from '../../services/translate.pipe';

type FormularioProveedor = Omit<Proveedor, 'id' | 'activo'>;

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './proveedores.html',
  styleUrls: ['./proveedores.css']
})
export class ProveedoresComponent implements OnInit {
  private readonly service = inject(ProveedoresService);
  private readonly router = inject(Router);
  private readonly cd = inject(ChangeDetectorRef);

  proveedores: Proveedor[] = [];
  cargando = true;
  guardando = false;
  error = '';
  aviso = '';
  editandoId: number | null = null;
  formulario: FormularioProveedor = this.formularioVacio();

  ngOnInit(): void { this.cargar(); }

  get enEdicion(): boolean { return this.editandoId !== null; }

  private formularioVacio(): FormularioProveedor {
    return { nombre: '', contacto: '', telefono: '', correo: '', direccion: '', rfc_identificacion: '' };
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.service.obtenerTodos().subscribe({
      next: datos => { this.proveedores = datos; this.cargando = false; this.cd.detectChanges(); },
      error: err => {
        this.error = 'No se pudieron cargar los proveedores. Verifica la conexión con el servidor.';
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  editar(proveedor: Proveedor): void {
    this.editandoId = proveedor.id;
    this.aviso = '';
    this.formulario = {
      nombre: proveedor.nombre,
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      correo: proveedor.correo || '',
      direccion: proveedor.direccion || '',
      rfc_identificacion: proveedor.rfc_identificacion || ''
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.formulario = this.formularioVacio();
  }

  guardar(): void {
    const nombre = this.formulario.nombre.trim();
    if (!nombre) { this.error = 'El nombre del proveedor es obligatorio.'; return; }
    const datos = Object.fromEntries(Object.entries({ ...this.formulario, nombre }).map(([key, value]) => [key, value?.trim() || null])) as FormularioProveedor;
    this.guardando = true;
    this.error = '';
    const peticion = this.enEdicion
      ? this.service.actualizar(this.editandoId!, datos)
      : this.service.crear(datos);
    peticion.subscribe({
      next: () => {
        this.aviso = this.enEdicion ? 'Proveedor actualizado correctamente.' : 'Proveedor registrado correctamente.';
        this.cancelarEdicion();
        this.guardando = false;
        this.cargar();
      },
      error: err => {
        this.error = 'No se pudo guardar el proveedor.';
        this.guardando = false;
        this.cd.detectChanges();
      }
    });
  }

  volverAlDashboard(): void { this.router.navigate(['/dashboard'], { fragment: 'apartados' }); }
}
