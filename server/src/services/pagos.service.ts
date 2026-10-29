// server/src/services/pagos.service.ts
// Cómo se cobró cada venta: efectivo, tarjeta de débito o de crédito, transferencia, o
// varios a la vez (pago mixto). Tabla: pagos_venta (server/scripts/migracion-pagos.sql).
// Lo que manda el navegador se revisa aquí contra el total que calcula el servidor.
import type { PoolClient } from 'pg';

export type MetodoPago = 'efectivo' | 'debito' | 'credito' | 'transferencia';
// Lo que se guarda en ventas.metodo_pago, como antes
export type MetodoVenta = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';

export interface Pago {
  metodo: MetodoPago;
  monto: number;
  recibido: number | null; // solo efectivo: lo que dio el cliente
  cambio: number | null;
  referencia: string | null; // tarjeta: autorización del voucher; transferencia: clave de rastreo
  meses: number; // solo crédito: meses sin intereses (0 = una sola exhibición)
}

const METODOS: readonly MetodoPago[] = ['efectivo', 'debito', 'credito', 'transferencia'];
const MESES_SIN_INTERESES = [3, 6, 12];
const MAXIMO_PAGOS = 6;
const MAXIMO_MONTO = 9_999_999_999.99; // lo que cabe en numeric(12, 2)

// Ley Antilavado (LFPIORPI, art. 32): tope de efectivo en la venta de joyas.
// 805 UMA × $117.31 (UMA 2026). POR CONFIRMAR con el maestro; si cambia, cambiarlo
// también en client/src/models/pago.ts.
export const LIMITE_EFECTIVO = 94434.55;

// Error de captura del cobro: la ruta lo responde como 400 con este mensaje
export class ErrorPago extends Error {}

// Las cuentas van en centavos enteros para que 0.1 + 0.2 no deje residuos
const centavos = (n: number) => Math.round(n * 100);
const pesos = (c: number) => c / 100;
const dinero = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

function leerMonto(valor: unknown, mensaje: string): number {
  const n = typeof valor === 'number' ? valor
    : typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > MAXIMO_MONTO) throw new ErrorPago(mensaje);
  return pesos(centavos(n));
}

function leerPago(entrada: unknown): Pago {
  const p = (entrada ?? {}) as Record<string, unknown>;
  const metodo = p.metodo as MetodoPago;
  if (!METODOS.includes(metodo)) throw new ErrorPago('El método de pago no es válido');
  const monto = leerMonto(p.monto, 'El monto de un pago no es válido');

  const meses = p.meses === undefined || p.meses === null ? 0 : Number(p.meses);
  if (meses !== 0 && (metodo !== 'credito' || !MESES_SIN_INTERESES.includes(meses))) {
    throw new ErrorPago('Los meses sin intereses no son válidos');
  }

  if (metodo === 'efectivo') {
    // Si no dicen cuánto dio el cliente, se toma que pagó exacto
    const recibido = p.recibido === undefined || p.recibido === null || p.recibido === ''
      ? monto : leerMonto(p.recibido, 'Lo recibido en efectivo no es válido');
    if (centavos(recibido) < centavos(monto)) {
      throw new ErrorPago('Lo recibido en efectivo es menos de lo que se cobra');
    }
    return { metodo, monto, recibido, cambio: pesos(centavos(recibido) - centavos(monto)), referencia: null, meses: 0 };
  }

  const referencia = typeof p.referencia === 'string' ? p.referencia.trim().toUpperCase() : '';
  if (metodo === 'transferencia') {
    if (!/^[A-Z0-9-]{6,30}$/.test(referencia)) {
      throw new ErrorPago('La clave de rastreo de la transferencia no es válida (de 6 a 30 letras o números)');
    }
  } else if (!/^\d{4,12}$/.test(referencia)) {
    // Con 12 como máximo tampoco cabe un número de tarjeta (son de 13 a 19)
    throw new ErrorPago('La autorización de la tarjeta son solo números (de 4 a 12)');
  }
  return { metodo, monto, recibido: null, cambio: null, referencia, meses };
}

// Revisa cada pago por separado. Va antes de tocar la base.
export function leerPagos(pagos: unknown): Pago[] {
  if (!Array.isArray(pagos) || pagos.length === 0) {
    throw new ErrorPago('Falta la forma de pago de la venta');
  }
  if (pagos.length > MAXIMO_PAGOS) {
    throw new ErrorPago(`Una venta puede llevar hasta ${MAXIMO_PAGOS} pagos`);
  }
  return pagos.map(leerPago);
}

// Los pagos tienen que sumar exactamente el total que calculó el servidor.
// Regresa lo que va en ventas.metodo_pago.
export function cuadrarPagos(pagos: Pago[], total: number): MetodoVenta {
  const pagado = pagos.reduce((suma, p) => suma + centavos(p.monto), 0);
  if (pagado !== centavos(total)) {
    throw new ErrorPago(
      `Los pagos (${dinero(pesos(pagado))}) no coinciden con el total de la venta (${dinero(total)})`
    );
  }
  const efectivo = pagos
    .filter(p => p.metodo === 'efectivo')
    .reduce((suma, p) => suma + centavos(p.monto), 0);
  if (efectivo > centavos(LIMITE_EFECTIVO)) {
    throw new ErrorPago(`El pago en efectivo pasa del límite permitido (${dinero(LIMITE_EFECTIVO)})`);
  }
  if (pagos.length > 1) return 'mixto';
  const { metodo } = pagos[0];
  return metodo === 'debito' || metodo === 'credito' ? 'tarjeta' : metodo;
}

// Se llama dentro de la transacción de la venta: si falla, no queda nada guardado
export async function guardarPagos(client: PoolClient, idVenta: number, pagos: Pago[]): Promise<void> {
  try {
    for (const p of pagos) {
      await client.query(
        `INSERT INTO pagos_venta (id_venta, metodo, monto, recibido, cambio, referencia, meses)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [idVenta, p.metodo, p.monto, p.recibido, p.cambio, p.referencia, p.meses]
      );
    }
  } catch (error) {
    if ((error as { code?: string }).code === '42P01') {
      throw new Error('Falta la tabla pagos_venta: corre server/scripts/migracion-pagos.sql en la base', { cause: error });
    }
    throw error;
  }
}
