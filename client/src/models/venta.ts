import { PagoVenta } from './pago';

export interface Venta {
  id?: number | string;
  folio: string;
  id_sucursal: number | string;
  id_usuario: number | string;
  fecha: string;
  subtotal: number | string;
  total: number | string;
  iva: number | string;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  estado?: 'pendiente' | 'completada' | 'cancelada';
  // Los trae la venta recién registrada (POST /api/ventas)
  pagos?: PagoVenta[];
}
