// client/src/models/factura.ts
export interface ReceptorFactura {
  rfc: string;
  nombre: string;
  cp: string;
  regimen: string;
  uso: string;
  correo: string;
}

export interface ConceptoFactura {
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  importe: number;
}

export interface Factura {
  id: number;
  serie: string;
  folio: number;
  folio_texto: string;
  id_venta: number;
  id_sucursal: number;
  id_usuario: number;
  fecha_emision: string;
  receptor: ReceptorFactura;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'Emitida' | 'Cancelada';
  motivo_cancelacion: string | null;
  cancelada_por: number | null;
  cancelada_en: string | null;
  conceptos: ConceptoFactura[];
}