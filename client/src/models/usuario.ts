export interface Usuario {
  id?: number;
  nombre: string;
  apellido?: string;
  email: string;
  rol: 'admin' | 'vendedor' | 'caja';
  activo?: boolean;
  createdAt?: Date;
}
