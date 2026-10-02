// server/src/routes/inventario.ts
import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// GET: Consultar inventario completo o filtrado por sucursal
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sucursalId } = req.query;

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
    if (sucursalId) {
      query += ` WHERE inv.id_sucursal = $1`;
      values.push(sucursalId);
    }

    query += ` ORDER BY inv.id_sucursal ASC, p.nombre ASC;`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar inventario:', error);
    res.status(500).json({ error: 'Error al consultar inventario en pos_olimpo', detalle: error });
  }
});

// POST: Asignar o actualizar existencias en una sucursal (UPSERT)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id_sucursal, id_producto, stock, stock_minimo, ubicacion_vitrina } = req.body;

    if (!id_sucursal || !id_producto) {
      return res.status(400).json({ error: 'La sucursal y el producto son obligatorios' });
    }

    const query = `
      INSERT INTO inventario_sucursal (id_sucursal, id_producto, stock, stock_minimo, ubicacion_vitrina, actualizado_en)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (id_sucursal, id_producto)
      DO UPDATE SET 
        stock = EXCLUDED.stock,
        stock_minimo = EXCLUDED.stock_minimo,
        ubicacion_vitrina = EXCLUDED.ubicacion_vitrina,
        actualizado_en = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      Number(id_sucursal),
      Number(id_producto),
      Number(stock) || 0,
      Number(stock_minimo) || 1,
      ubicacion_vitrina || 'Vitrina Principal'
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al registrar inventario:', error);
    res.status(500).json({ error: 'Error al actualizar inventario', detalle: error });
  }
});

// server/src/routes/inventario.ts
// ... tus rutas GET y POST existentes

// 1. ELIMINAR UN SOLO ÍTEM POR ID
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM inventario_sucursal WHERE id = $1 RETURNING id;';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Registro de inventario no encontrado' });
    }

    res.status(200).json({ mensaje: 'Registro de inventario eliminado', id });
  } catch (error) {
    console.error('Error al eliminar inventario:', error);
    res.status(500).json({ error: 'Error al eliminar registro de inventario', detalle: error });
  }
});

// 2. ELIMINAR VARIOS ÍTEMS EN LOTE (MASIVO)
router.post('/eliminar-lote', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body; // Espera un arreglo: [1, 2, 5, ...]

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debes proporcionar una lista de IDs para eliminar' });
    }

    const query = 'DELETE FROM inventario_sucursal WHERE id = ANY($1::int[]) RETURNING id;';
    const result = await pool.query(query, [ids]);

    res.status(200).json({
      mensaje: `${result.rowCount} registros eliminados con éxito`,
      eliminados: result.rows
    });
  } catch (error) {
    console.error('Error al eliminar lote de inventario:', error);
    res.status(500).json({ error: 'Error al procesar eliminación masiva', detalle: error });
  }
});

export default router;