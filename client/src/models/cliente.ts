export interface Cliente {
  id?: number;
  nombre: string;
  apellido?: string;
  telefono?: string;
  email?: string;
  documento?: string;
  direccion?: string;
  activo?: boolean;
  createdAt?: Date;
}
