import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Empleado, NuevoEmpleadoPayload } from '../../services/usuarios.services';
import { SucursalesService, Sucursal } from '../../services/sucursales.services';
import { AuthService } from '../../services/auth.service';

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
  private authService = inject(AuthService);
  private cd = inject(ChangeDetectorRef);

  public usuarioActual = this.authService.obtenerUsuario();

  public listaEmpleados: Empleado[] = [];
  public listaSucursales: Sucursal[] = [];
  public cargando: boolean = true;
  public guardando: boolean = false;
  public editandoId: number | null = null;

  public formulario: NuevoEmpleadoPayload = this.formularioInicial();

  // Reglas de alta: el Administrador da de alta Administradores y Gerentes;
  // el Gerente solo da de alta Cajeros, y únicamente en su propia sucursal.
  public get esAdmin(): boolean {
    return this.usuarioActual?.rol === 'Administrador';
  }

  public get esGerente(): boolean {
    return this.usuarioActual?.rol === 'Gerente';
  }

  public get rolesDisponibles(): Array<'Administrador' | 'Gerente' | 'Cajero'> {
    if (this.esAdmin) {
      // Al editar se permite cualquier rol para poder corregir también a los cajeros existentes
      return this.editandoId ? ['Administrador', 'Gerente', 'Cajero'] : ['Administrador', 'Gerente'];
    }
    // Gerente: el rol no se puede cambiar; al crear solo existe Cajero
    return this.editandoId ? [this.formulario.rol] : ['Cajero'];
  }

  public get totalActivos(): number {
    return this.listaEmpleados.filter(e => e.activo).length;
  }

  // Un Gerente solo puede gestionar a los cajeros de su sucursal
  public puedeGestionar(emp: Empleado): boolean {
    if (this.esAdmin) return true;
    return this.esGerente && emp.rol === 'Cajero';
  }

  private formularioInicial(): NuevoEmpleadoPayload {
    const esAdmin = this.usuarioActual?.rol === 'Administrador';
    return {
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      correo: '',
      contrasena: '',
      rol: esAdmin ? 'Gerente' : 'Cajero',
      id_sucursal: esAdmin ? null : (this.usuarioActual?.id_sucursal ?? null)
    };
  }

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
    this.formulario = this.formularioInicial();
    if (this.esAdmin && this.listaSucursales.length > 0) {
      this.formulario.id_sucursal = Number(this.listaSucursales[0].id);
    }
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

    const sucursalDelFormulario = this.esGerente
      ? Number(this.usuarioActual?.id_sucursal)   // el servidor igual la valida contra el token
      : Number(this.formulario.id_sucursal);

    const payload = {
      ...this.formulario,
      id_sucursal: this.formulario.rol === 'Administrador' ? null : sucursalDelFormulario
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