import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Empleado, NuevoEmpleadoPayload } from '../../services/usuarios.services';
import { SucursalesService, Sucursal } from '../../services/sucursales.services';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empleados.html',
  styleUrls: ['./empleados.css']
})
export class EmpleadosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private sucursalesService = inject(SucursalesService);
  private cd = inject(ChangeDetectorRef);

  public listaEmpleados: Empleado[] = [];
  public listaSucursales: Sucursal[] = [];
  public cargando: boolean = true;
  public guardando: boolean = false;
  public editandoId: number | null = null;

  public formulario: NuevoEmpleadoPayload = {
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    contrasena: '',
    rol: 'Cajero',
    id_sucursal: null
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  public cargarDatos(): void {
    this.cargando = true;

    this.usuariosService.obtenerUsuarios().subscribe({
      next: (empleados) => {
        this.listaEmpleados = empleados;
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar empleados:', err);
        this.cargando = false;
      }
    });

    this.sucursalesService.getSucursales().subscribe({
      next: (sucursales) => {
        this.listaSucursales = sucursales;
        if (sucursales.length > 0 && this.formulario.id_sucursal === null) {
          this.formulario.id_sucursal = Number(sucursales[0].id);
        }
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar sucursales:', err)
    });
  }

  public alCambiarRol(): void {
    if (this.formulario.rol === 'Administrador') {
      this.formulario.id_sucursal = null;
    } else if (!this.formulario.id_sucursal && this.listaSucursales.length > 0) {
      this.formulario.id_sucursal = Number(this.listaSucursales[0].id);
    }
  }

  public seleccionarParaEditar(emp: Empleado): void {
    this.editandoId = emp.id;
    this.formulario = {
      nombres: emp.nombres,
      apellido_paterno: emp.apellido_paterno,
      apellido_materno: emp.apellido_materno || '',
      correo: emp.correo,
      contrasena: '',
      rol: emp.rol,
      id_sucursal: emp.id_sucursal
    };
  }

  public cancelarEdicion(): void {
    this.editandoId = null;
    this.formulario = {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      correo: '',
      contrasena: '',
      rol: 'Cajero',
      id_sucursal: this.listaSucursales.length > 0 ? Number(this.listaSucursales[0].id) : null
    };
  }

  public guardar(): void {
    if (!this.formulario.nombres.trim() || !this.formulario.apellido_paterno.trim() || !this.formulario.correo.trim()) {
      alert('Completa los campos obligatorios (*)');
      return;
    }

    if (!this.editandoId && !this.formulario.contrasena) {
      alert('La contraseña inicial es requerida.');
      return;
    }

    const payload = {
      ...this.formulario,
      id_sucursal: this.formulario.rol === 'Administrador' ? null : Number(this.formulario.id_sucursal)
    };

    this.guardando = true;

    if (this.editandoId) {
      this.usuariosService.actualizarUsuario(this.editandoId, payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          alert(resp.mensaje);
          this.cancelarEdicion();
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando = false;
          alert(err.error?.error || 'Error al actualizar empleado');
        }
      });
    } else {
      this.usuariosService.crearUsuario(payload).subscribe({
        next: (resp) => {
          this.guardando = false;
          alert(`¡Empleado ${resp.usuario.nombres} creado correctamente!`);
          this.cancelarEdicion();
          this.cargarDatos();
        },
        error: (err) => {
          this.guardando = false;
          alert(err.error?.error || 'Error al crear usuario');
        }
      });
    }
  }

  public alternarEstado(emp: Empleado): void {
    const accion = emp.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Deseas ${accion} a ${emp.nombres}?`)) return;

    this.usuariosService.cambiarEstado(emp.id, !emp.activo).subscribe({
      next: (resp) => {
        emp.activo = resp.usuario.activo;
        this.cd.detectChanges();
      },
      error: (err) => alert(err.error?.error || `Error al ${accion} usuario`)
    });
  }
}