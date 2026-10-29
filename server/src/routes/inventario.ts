// server/src/routes/inventario.ts
import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { verificarToken, permitirRoles, RequestConUsuario } from '../middleware/verificarToken';

const router = Router();

// GET: Consultar inventario
// - Gerente / Cajero: solo el de su sucursal (sale del token, no se puede cambiar).
// - Administrador: todas las sucursales, o una si manda ?sucursalId=
router.get('/', verificarToken, async (req: RequestConUsuario, res: Response) => {
  try {
    const usuario = req.usuarioToken;

    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    let sucursalFiltro: number | null = null;

    if (usuario.rol === 'Administrador') {
      if (req.query.sucursalId) sucursalFiltro = Number(req.query.sucursalId);
    } else {
      if (!usuario.id_sucursal) {
        return res.status(403).json({ error: 'Tu usuario no tiene una sucursal asignada' });
      }
      sucursalFiltro = usuario.id_sucursal;
    }

    let query = `
      SELECT 
        inv.id,
        inv.id_sucursal,
        s.nombre AS nombre_sucursal,
        inv.id_producto,
        p.nombre AS nombre_producto,
        p.tipo_metal,
        p.kilataje,
        p.precio_venta,
        inv.stock,
        inv.stock_minimo,
        inv.ubicacion_vitrina,
        inv.actualizado_en
      FROM inventario_sucursal inv
      INNER JOIN productos p ON inv.id_producto = p.id
      INNER JOIN sucursales s ON inv.id_sucursal = s.id
    `;

    const values: any[] = [];
    if (sucursalFiltro) {
      query += ` WHERE inv.id_sucursal = $1`;
      values.push(sucursalFiltro);
    }

    query += ` ORDER BY inv.id_sucursal ASC, p.nombre ASC;`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar inventario:', error);
    res.status(500).json({ error: 'Error al consultar inventario en pos_olimpo' });
  }
});

// GET: Inventario para la página de inicio
// - Gerente / Cajero: solo ven el de su sucursal (sale del token, no se puede cambiar).
// - Administrador: ve todas las sucursales, o una si manda ?sucursalId=
router.get('/mi-sucursal', verificarToken, async (req: RequestConUsuario, res: Response) => {
  try {
    const usuario = req.usuarioToken;

    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    let sucursalFiltro: number | null = null;

    if (usuario.rol === 'Administrador') {
      if (req.query.sucursalId) sucursalFiltro = Number(req.query.sucursalId);
    } else {
      if (!usuario.id_sucursal) {
        return res.status(403).json({ error: 'Tu usuario no tiene una sucursal asignada' });
      }
      sucursalFiltro = usuario.id_sucursal;
    }

    let query = `
      SELECT
        p.id,
        inv.id AS id_inventario,
        inv.id_sucursal,
        s.nombre AS nombre_sucursal,
        p.nombre,
        p.descripcion,
        p.tipo_metal,
        p.kilataje,
        p.precio_venta,
        inv.stock,
        inv.stock_minimo,
        inv.ubicacion_vitrina,
        CASE
          WHEN p.imagen IS NOT NULL THEN encode(p.imagen, 'base64')
          ELSE NULL
        END AS imagen_base64
      FROM inventario_sucursal inv
      INNER JOIN productos p ON inv.id_producto = p.id
      INNER JOIN sucursales s ON inv.id_sucursal = s.id
    `;

    const values: any[] = [];
    if (sucursalFiltro) {
      query += ` WHERE inv.id_sucursal = $1`;
      values.push(sucursalFiltro);
    }
    query += ` ORDER BY s.nombre ASC, p.nombre ASC;`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar inventario para inicio:', error);
    res.status(500).json({ error: 'Error al consultar el inventario' });
  }
});

// POST: Asignar o actualizar existencias (alta o modificación)
// SOLO el Gerente puede hacerlo, y SOLO en su propia sucursal.
// La sucursal sale del token: aunque el navegador mande otra, se rechaza.
router.post('/', verificarToken, async (req: RequestConUsuario, res: Response) => {
  const usuario = req.usuarioToken;

  if (!usuario || usuario.rol !== 'Gerente') {
    return res.status(403).json({
      error: 'Solo el Gerente de la sucursal puede agregar productos al inventario'
    });
  }

  if (!usuario.id_sucursal) {
    return res.status(403).json({ error: 'Tu usuario no tiene una sucursal asignada' });
  }

  const client = await pool.connect();
  try {
    const { id_sucursal, id_producto, stock, stock_minimo, ubicacion_vitrina } = req.body;

    if (id_sucursal && Number(id_sucursal) !== Number(usuario.id_sucursal)) {
      return res.status(403).json({
        error: 'No puedes agregar productos a una sucursal distinta a la tuya'
      });
    }

    const sucursalId = Number(usuario.id_sucursal); // siempre la sucursal del gerente
    const productoId = Number(id_producto);
    const existencias = Number(stock ?? 0);
    const minimo = Number(stock_minimo ?? 1);

    if (!Number.isSafeInteger(productoId) || productoId <= 0) {
      return res.status(400).json({ error: 'El producto es obligatorio' });
    }
    if (!Number.isSafeInteger(existencias) || existencias < 0 ||
        !Number.isSafeInteger(minimo) || minimo < 0) {
      return res.status(400).json({ error: 'El stock y el mínimo deben ser números enteros no negativos' });
    }

    await client.query('BEGIN');
    // Serializa altas y modificaciones del mismo producto en la misma sucursal.
    // La tabla restaurada no define una clave única para este par.
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext($1::text || ':' || $2::text))`,
      [sucursalId, productoId]
    );
    const existente = await client.query(
      `SELECT id, stock FROM inventario_sucursal
       WHERE id_sucursal = $1 AND id_producto = $2
       ORDER BY id LIMIT 1 FOR UPDATE`, [sucursalId, productoId]
    );

    let result;
    if (existente.rowCount) {
      const stockActual = Number(existente.rows[0].stock);
      if (!Number.isSafeInteger(stockActual + existencias) || stockActual + existencias > 2147483647) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'La cantidad supera el máximo permitido para el inventario' });
      }
      result = await client.query(
        `UPDATE inventario_sucursal
         SET stock = stock + $1, stock_minimo = $2, ubicacion_vitrina = $3, actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $4 RETURNING *`,
        [existencias, minimo, ubicacion_vitrina || 'Vitrina Principal', existente.rows[0].id]
      );
    } else {
      result = await client.query(
        `INSERT INTO inventario_sucursal
           (id_sucursal, id_producto, stock, stock_minimo, ubicacion_vitrina, actualizado_en)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *`,
        [sucursalId, productoId, existencias, minimo, ubicacion_vitrina || 'Vitrina Principal']
      );
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Error al registrar inventario:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'El producto indicado no existe' });
    }
    res.status(500).json({ error: 'Error al actualizar inventario' });
  } finally {
    client.release();
  }
});

// server/src/routes/inventario.ts
// ... tus rutas GET y POST existentes

// Eliminar existencias: solo el Gerente, y solo registros de su propia sucursal.

// 1. ELIMINAR UN SOLO ÍTEM POR ID
router.delete('/:id', verificarToken, permitirRoles('Gerente'), async (req: RequestConUsuario, res: Response) => {
  try {
    const { id } = req.params;
    const idSucursal = req.usuarioToken!.id_sucursal;

    const query = 'DELETE FROM inventario_sucursal WHERE id = $1 AND id_sucursal = $2 RETURNING id;';
    const result = await pool.query(query, [id, idSucursal]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Registro de inventario no encontrado en tu sucursal' });
    }

    res.status(200).json({ mensaje: 'Registro de inventario eliminado', id });
  } catch (error) {
    console.error('Error al eliminar inventario:', error);
    res.status(500).json({ error: 'Error al eliminar registro de inventario' });
  }
});

// 2. ELIMINAR VARIOS ÍTEMS EN LOTE (MASIVO)
router.post('/eliminar-lote', verificarToken, permitirRoles('Gerente'), async (req: RequestConUsuario, res: Response) => {
  try {
    const { ids } = req.body; // Espera un arreglo: [1, 2, 5, ...]
    const idSucursal = req.usuarioToken!.id_sucursal;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debes proporcionar una lista de IDs para eliminar' });
    }

    const query = 'DELETE FROM inventario_sucursal WHERE id = ANY($1::bigint[]) AND id_sucursal = $2 RETURNING id;';
    const result = await pool.query(query, [ids, idSucursal]);

    res.status(200).json({
      mensaje: `${result.rowCount} registros eliminados con éxito`,
      eliminados: result.rows
    });
  } catch (error) {
    console.error('Error al eliminar lote de inventario:', error);
    res.status(500).json({ error: 'Error al procesar eliminación masiva' });
  }
});

export default router;
