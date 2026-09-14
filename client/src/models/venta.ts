export interface Venta {
  id?: number;
  folio: string;
  clienteId?: number;
  usuarioId: number;
  fecha: Date;
  subtotal: number;
  descuento?: number;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  estado?: 'pendiente' | 'completada' | 'cancelada';
}
