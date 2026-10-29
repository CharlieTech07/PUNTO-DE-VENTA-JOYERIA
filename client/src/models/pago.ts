// Cómo se cobró una venta. El servidor vuelve a revisar todo esto
// (server/src/services/pagos.service.ts): aquí es para avisar a tiempo.
export type MetodoPago = 'efectivo' | 'debito' | 'credito' | 'transferencia';

export interface PagoVenta {
  metodo: MetodoPago;
  monto: number;
  recibido?: number | null; // solo efectivo: lo que dio el cliente
  cambio?: number | null;
  referencia?: string | null; // tarjeta: autorización del voucher; transferencia: clave de rastreo
  meses?: number; // solo crédito: meses sin intereses (0 = una sola exhibición)
}

export const NOMBRE_METODO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  debito: 'Tarjeta de débito',
  credito: 'Tarjeta de crédito',
  transferencia: 'Transferencia'
};

export const MESES_SIN_INTERESES = [3, 6, 12];

// Ley Antilavado (LFPIORPI, art. 32): tope de efectivo en la venta de joyas.
// 805 UMA × $117.31 (UMA 2026). POR CONFIRMAR con el maestro; si cambia, cambiarlo
// también en server/src/services/pagos.service.ts.
export const LIMITE_EFECTIVO = 94434.55;

// La autorización del voucher: con 12 como máximo no cabe un número de tarjeta (13 a 19)
export const AUTORIZACION_VALIDA = /^\d{4,12}$/;
export const RASTREO_VALIDO = /^[A-Z0-9-]{6,30}$/;

// Forma de pago para la factura (catálogo c_FormaPago del SAT). Van sin traducir:
// son los nombres oficiales. En pago mixto va la del pago más grande.
const FORMA_PAGO_SAT: Record<MetodoPago, string> = {
  efectivo: '01 · Efectivo',
  transferencia: '03 · Transferencia electrónica de fondos',
  credito: '04 · Tarjeta de crédito',
  debito: '28 · Tarjeta de débito'
};

export function formaPagoSat(pagos: PagoVenta[]): string {
  const mayor = pagos.reduce<PagoVenta | null>(
    (elegido, pago) => (!elegido || pago.monto > elegido.monto ? pago : elegido), null
  );
  return mayor ? FORMA_PAGO_SAT[mayor.metodo] : '';
}
