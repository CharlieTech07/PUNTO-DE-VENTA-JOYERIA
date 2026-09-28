export interface Producto {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  activo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
