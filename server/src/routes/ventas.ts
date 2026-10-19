import { Router, Response } from 'express';
import { pool } from '../db.js';
import { RequestConUsuario, verificarToken } from '../middleware/verificarToken.js';

const router = Router();
const metodosPago = ['efectivo', 'tarjeta', 'transferencia', 'mixto'];

router.get('/', verificarToken, async (req: RequestConUsuario, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, folio, id_sucursal, id_usuario, fecha_venta AS fecha, subtotal,
              impuesto AS iva, total, metodo_pago, estado
       FROM ventas WHERE ($1::bigint IS NULL OR id_sucursal = $1) ORDER BY fecha_venta DESC LIMIT 100`,
      [req.usuarioToken!.rol === 'Administrador' ? null : req.usuarioToken!.id_sucursal]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al consultar ventas:', error);
    res.status(500).json({ error: 'No se pudieron consultar las ventas' });
  }
});

router.post('/', verificarToken, async (req: RequestConUsuario, res: Response) => {
  const { items, metodo_pago } = req.body as {
    items?: Array<{ id_inventario: number; cantidad: number }>;
    metodo_pago?: string;
  };
  const usuario = req.usuarioToken!;
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return res.status(400).json({ error: 'La venta debe incluir entre 1 y 100 piezas' });
  }
  if (!metodosPago.includes(metodo_pago ?? '')) {
    return res.status(400).json({ error: 'El método de pago no es válido' });
  }
  const normalizados = new Map<number, number>();
  for (const item of items) {
    const id = Number(item?.id_inventario);
    const cantidad = Number(item?.cantidad);
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'Las piezas o cantidades de la venta no son válidas' });
    }
    normalizados.set(id, (normalizados.get(id) ?? 0) + cantidad);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ids = [...normalizados.keys()].sort((a, b) => a - b);
    const { rows: existencias } = await client.query(
      `SELECT inv.id AS id_inventario, inv.id_sucursal, inv.stock, inv.id_producto,
              p.nombre, p.precio_venta, p.tipo_metal, p.kilataje
       FROM inventario_sucursal inv JOIN productos p ON p.id = inv.id_producto
       WHERE inv.id = ANY($1::bigint[]) ORDER BY inv.id FOR UPDATE`, [ids]
    );
    if (existencias.length !== ids.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Una o más piezas ya no están disponibles' });
    }
    const sucursalId = Number(existencias[0].id_sucursal);
    if (existencias.some(row => Number(row.id_sucursal) !== sucursalId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Una venta solo puede incluir piezas de una sucursal' });
    }
    if (usuario.rol !== 'Administrador' && Number(usuario.id_sucursal) !== sucursalId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No puedes registrar ventas de otra sucursal' });
    }
    let total = 0;
    const detalles = existencias.map(row => {
      const cantidad = normalizados.get(Number(row.id_inventario))!;
      const stock = Number(row.stock);
      const precio = Number(row.precio_venta);
      if (cantidad > stock) throw new Error(`STOCK:${row.nombre}`);
      if (!Number.isFinite(precio) || precio < 0) throw new Error('PRECIO_INVALIDO');
      total += precio * cantidad;
      return { ...row, cantidad, precio };
    });
    total = Math.round(total * 100) / 100;
    const subtotal = Math.round((total / 1.16) * 100) / 100;
    const iva = Math.round((total - subtotal) * 100) / 100;
    const folio = `OL-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const { rows: ventas } = await client.query(
      `INSERT INTO ventas (folio, id_sucursal, id_usuario, subtotal, impuesto, total, metodo_pago, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Completada')
       RETURNING id, folio, id_sucursal, id_usuario, fecha_venta AS fecha,
                 subtotal, impuesto AS iva, total, metodo_pago, estado`,
      [folio, sucursalId, usuario.id, subtotal, iva, total, metodo_pago]
    );
    const venta = ventas[0];
    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal_linea)
         VALUES ($1, $2, $3, $4, $5)`,
        [venta.id, detalle.id_producto, detalle.cantidad, detalle.precio, detalle.precio * detalle.cantidad]
      );
      const actualizacion = await client.query(
        `UPDATE inventario_sucursal SET stock = stock - $1, actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $2 AND stock >= $1`, [detalle.cantidad, detalle.id_inventario]
      );
      if (actualizacion.rowCount !== 1) throw new Error(`STOCK:${detalle.nombre}`);
    }
    await client.query('COMMIT');
    res.status(201).json({ ...venta, detalles: detalles.map(d => ({
      id_inventario: d.id_inventario, nombre: d.nombre, cantidad: d.cantidad,
      precio_unitario: d.precio, importe: d.precio * d.cantidad
    })) });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    if (error instanceof Error && error.message.startsWith('STOCK:')) {
      return res.status(409).json({ error: `Existencias insuficientes para ${error.message.slice(6)}` });
    }
    if (error instanceof Error && error.message === 'PRECIO_INVALIDO') {
      return res.status(409).json({ error: 'El precio de una pieza no es válido' });
    }
    console.error('Error al registrar venta:', error);
    res.status(500).json({ error: 'No se pudo registrar la venta' });
  } finally {
    client.release();
  }
});

export default router;
