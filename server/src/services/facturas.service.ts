// server/src/services/facturas.service.ts
import { pool } from '../db.js';
import { ReceptorFactura, ConceptoFactura, Factura, FacturaConConceptos } from '../models/factura.js';

interface UsuarioToken {
  id: number;
  rol: 'Administrador' | 'Gerente' | 'Cajero';
  id_sucursal: number | null;
}

// Error con el código HTTP que debe responder el controlador.
// Nunca un 500 por un error del usuario, solo por algo inesperado del servidor.
export class FacturaError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGIMENES = ['601', '603', '605', '606', '612', '616', '626'];
const USOS_CFDI = ['G01', 'G03', 'S01'];
const RFC_GENERICO = 'XAXX010101000';

function validarReceptor(receptor: Partial<ReceptorFactura> | undefined): ReceptorFactura {
  if (!receptor || typeof receptor !== 'object') {
    throw new FacturaError(400, 'Los datos del receptor son obligatorios');
  }
  const rfc = String(receptor.rfc ?? '').trim().toUpperCase();
  const nombre = String(receptor.nombre ?? '').trim();
  const cp = String(receptor.cp ?? '').trim();
  const regimen = String(receptor.regimen ?? '').trim();
  const uso = String(receptor.uso ?? '').trim();
  const correo = String(receptor.correo ?? '').trim();

  if (!RFC_REGEX.test(rfc)) {
    throw new FacturaError(400, 'El RFC no tiene un formato válido');
  }
  if (nombre.length < 1 || nombre.length > 300) {
    throw new FacturaError(400, 'El nombre del receptor no es válido');
  }
  if (!/^\d{5}$/.test(cp)) {
    throw new FacturaError(400, 'El código postal debe tener 5 números');
  }
  if (correo.length === 0 || correo.length > 254 || !CORREO_REGEX.test(correo)) {
    throw new FacturaError(400, 'El correo no tiene un formato válido');
  }
  if (!REGIMENES.includes(regimen)) {
    throw new FacturaError(400, 'El régimen fiscal no es válido');
  }
  if (!USOS_CFDI.includes(uso)) {
    throw new FacturaError(400, 'El uso del CFDI no es válido');
  }
  if (rfc === RFC_GENERICO && (regimen !== '616' || uso !== 'S01')) {
    throw new FacturaError(400, 'El RFC genérico solo admite régimen 616 y uso S01');
  }

  return { rfc, nombre, cp, regimen, uso, correo };
}

function formatearFactura(row: any): Factura {
  return {
    id: Number(row.id),
    serie: row.serie,
    folio: Number(row.folio),
    folio_texto: `${row.serie}-${String(row.folio).padStart(6, '0')}`,
    id_venta: Number(row.id_venta),
    id_sucursal: Number(row.id_sucursal),
    id_usuario: Number(row.id_usuario),
    fecha_emision: row.fecha_emision,
    receptor: {
      rfc: row.rfc_receptor,
      nombre: row.nombre_receptor,
      cp: row.cp_receptor,
      regimen: row.regimen_fiscal,
      uso: row.uso_cfdi,
      correo: row.correo_receptor,
    },
    subtotal: Number(row.subtotal),
    iva: Number(row.iva),
    total: Number(row.total),
    estado: row.estado,
    motivo_cancelacion: row.motivo_cancelacion ?? null,
    cancelada_por:
      row.cancelada_por !== null && row.cancelada_por !== undefined ? Number(row.cancelada_por) : null,
    cancelada_en: row.cancelada_en ?? null,
  };
}

function formatearConceptos(rows: any[]): ConceptoFactura[] {
  return rows.map(r => ({
    descripcion: r.descripcion,
    cantidad: Number(r.cantidad),
    valor_unitario: Number(r.valor_unitario),
    importe: Number(r.importe),
  }));
}

function verificarAccesoSucursal(usuario: UsuarioToken, idSucursalFactura: number, mensaje: string) {
  if (usuario.rol !== 'Administrador' && Number(usuario.id_sucursal) !== idSucursalFactura) {
    throw new FacturaError(403, mensaje);
  }
}

// POST /api/facturas
export async function emitirFactura(
  idVentaRaw: unknown,
  receptorRaw: Partial<ReceptorFactura> | undefined,
  usuario: UsuarioToken
): Promise<FacturaConConceptos> {
  const idVenta = Number(idVentaRaw);
  if (!Number.isSafeInteger(idVenta) || idVenta <= 0) {
    throw new FacturaError(400, 'El id de la venta no es válido');
  }
  const receptor = validarReceptor(receptorRaw);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: ventas } = await client.query(
      `SELECT id, id_sucursal, total, estado FROM ventas WHERE id = $1 FOR UPDATE`,
      [idVenta]
    );
    if (ventas.length === 0) {
      throw new FacturaError(404, 'La venta no existe');
    }
    const venta = ventas[0];
    const sucursalVenta = Number(venta.id_sucursal);

    verificarAccesoSucursal(usuario, sucursalVenta, 'No puedes facturar ventas de otra sucursal');

    if (venta.estado !== 'Completada') {
      throw new FacturaError(409, 'La venta no está completada');
    }

    const { rows: vigente } = await client.query(
      `SELECT id FROM facturas WHERE id_venta = $1 AND estado = 'Emitida'`,
      [idVenta]
    );
    if (vigente.length > 0) {
      throw new FacturaError(409, 'Esta venta ya tiene una factura vigente');
    }

    const { rows: detalles } = await client.query(
      `SELECT dv.cantidad, dv.precio_unitario, p.nombre, p.tipo_metal, p.kilataje
       FROM detalle_ventas dv JOIN productos p ON p.id = dv.id_producto
       WHERE dv.id_venta = $1 ORDER BY dv.id`,
      [idVenta]
    );
    if (detalles.length === 0) {
      throw new FacturaError(409, 'La venta no tiene conceptos que facturar');
    }

    // Regla del IVA: el precio ya lo incluye. Se saca de adentro, nunca se suma encima.
    const conceptos: ConceptoFactura[] = detalles.map(d => {
      const precioUnitario = Number(d.precio_unitario);
      const cantidad = Number(d.cantidad);
      const valor_unitario = Math.round((precioUnitario / 1.16) * 100) / 100;
      const importe = Math.round(((precioUnitario * cantidad) / 1.16) * 100) / 100;
      const kilataje = d.kilataje ? ` ${d.kilataje}` : '';
      return { descripcion: `${d.nombre} · ${d.tipo_metal}${kilataje}`, cantidad, valor_unitario, importe };
    });

    const subtotal = Math.round(conceptos.reduce((acc, c) => acc + c.importe, 0) * 100) / 100;
    const total = Number(venta.total); // se copia tal cual, no se recalcula
    const iva = Math.round((total - subtotal) * 100) / 100;

    const { rows: insertadas } = await client.query(
      `INSERT INTO facturas
         (serie, id_venta, id_sucursal, id_usuario, rfc_receptor, nombre_receptor,
          cp_receptor, regimen_fiscal, uso_cfdi, correo_receptor, subtotal, iva, total)
       VALUES ('F', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        idVenta, sucursalVenta, usuario.id, receptor.rfc, receptor.nombre, receptor.cp,
        receptor.regimen, receptor.uso, receptor.correo, subtotal, iva, total,
      ]
    );
    const factura = insertadas[0];

    for (const concepto of conceptos) {
      await client.query(
        `INSERT INTO detalle_facturas (id_factura, descripcion, cantidad, valor_unitario, importe)
         VALUES ($1, $2, $3, $4, $5)`,
        [factura.id, concepto.descripcion, concepto.cantidad, concepto.valor_unitario, concepto.importe]
      );
    }

    await client.query('COMMIT');
    return { ...formatearFactura(factura), conceptos };
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => undefined);
    if (error?.code === '23505') {
      // Dos clics rápidos chocan aquí: el índice único los detiene.
      throw new FacturaError(409, 'Esta venta ya tiene una factura vigente');
    }
    throw error;
  } finally {
    client.release();
  }
}

// GET /api/facturas
export async function listarFacturas(
  usuario: UsuarioToken,
  filtros: { rfc?: string; estado?: string }
): Promise<Factura[]> {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let i = 1;

  if (usuario.rol !== 'Administrador') {
    condiciones.push(`id_sucursal = $${i++}`);
    valores.push(usuario.id_sucursal);
  }
  if (filtros.rfc) {
    condiciones.push(`rfc_receptor = $${i++}`);
    valores.push(filtros.rfc.trim().toUpperCase());
  }
  if (filtros.estado) {
    if (!['Emitida', 'Cancelada'].includes(filtros.estado)) {
      throw new FacturaError(400, 'El estado del filtro no es válido');
    }
    condiciones.push(`estado = $${i++}`);
    valores.push(filtros.estado);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM facturas ${where} ORDER BY fecha_emision DESC LIMIT 100`,
    valores
  );
  return rows.map(formatearFactura);
}

// GET /api/facturas/:id
export async function obtenerFactura(idRaw: unknown, usuario: UsuarioToken): Promise<FacturaConConceptos> {
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new FacturaError(404, 'La factura no existe');
  }
  const { rows } = await pool.query(`SELECT * FROM facturas WHERE id = $1`, [id]);
  if (rows.length === 0) {
    throw new FacturaError(404, 'La factura no existe');
  }
  const factura = rows[0];
  verificarAccesoSucursal(usuario, Number(factura.id_sucursal), 'No puedes consultar facturas de otra sucursal');

  const { rows: conceptos } = await pool.query(
    `SELECT descripcion, cantidad, valor_unitario, importe FROM detalle_facturas
     WHERE id_factura = $1 ORDER BY id`,
    [factura.id]
  );
  return { ...formatearFactura(factura), conceptos: formatearConceptos(conceptos) };
}

// GET /api/facturas/venta/:idVenta
export async function obtenerFacturaDeVenta(
  idVentaRaw: unknown,
  usuario: UsuarioToken
): Promise<FacturaConConceptos> {
  const idVenta = Number(idVentaRaw);
  if (!Number.isSafeInteger(idVenta) || idVenta <= 0) {
    throw new FacturaError(404, 'No hay factura vigente para esa venta');
  }
  const { rows } = await pool.query(
    `SELECT * FROM facturas WHERE id_venta = $1 AND estado = 'Emitida'`,
    [idVenta]
  );
  if (rows.length === 0) {
    throw new FacturaError(404, 'No hay factura vigente para esa venta');
  }
  const factura = rows[0];
  verificarAccesoSucursal(usuario, Number(factura.id_sucursal), 'No puedes consultar facturas de otra sucursal');

  const { rows: conceptos } = await pool.query(
    `SELECT descripcion, cantidad, valor_unitario, importe FROM detalle_facturas
     WHERE id_factura = $1 ORDER BY id`,
    [factura.id]
  );
  return { ...formatearFactura(factura), conceptos: formatearConceptos(conceptos) };
}

// PATCH /api/facturas/:id/cancelar
export async function cancelarFactura(
  idRaw: unknown,
  motivoRaw: unknown,
  usuario: UsuarioToken
): Promise<Factura> {
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new FacturaError(404, 'La factura no existe');
  }
  const motivo = String(motivoRaw ?? '').trim();
  if (motivo.length === 0) {
    throw new FacturaError(400, 'El motivo de cancelación es obligatorio');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(`SELECT * FROM facturas WHERE id = $1 FOR UPDATE`, [id]);
    if (rows.length === 0) {
      throw new FacturaError(404, 'La factura no existe');
    }
    const factura = rows[0];
    verificarAccesoSucursal(usuario, Number(factura.id_sucursal), 'No puedes cancelar facturas de otra sucursal');

    if (factura.estado === 'Cancelada') {
      throw new FacturaError(409, 'Esta factura ya está cancelada');
    }

    const { rows: actualizada } = await client.query(
      `UPDATE facturas
       SET estado = 'Cancelada', motivo_cancelacion = $1, cancelada_por = $2, cancelada_en = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [motivo, usuario.id, id]
    );

    await client.query('COMMIT');
    return formatearFactura(actualizada[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}