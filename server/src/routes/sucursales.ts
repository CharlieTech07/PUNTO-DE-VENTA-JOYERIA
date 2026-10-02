// server/src/routes/sucursales.routes.ts
import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// GET: Obtener todas las sucursales
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM sucursales ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar sucursales:', error);
    res.status(500).json({ error: 'Error al consultar sucursales en pos_olimpo' });
  }
});

// POST: Registrar sucursal
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nombre, direccion, telefono } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la sucursal es obligatorio' });
    }

    const query = `
      INSERT INTO sucursales (nombre, direccion, telefono)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [nombre.trim(), direccion || null, telefono || null];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({ error: 'Error al registrar sucursal en PostgreSQL', detalle: error });
  }
});

// DELETE: Eliminar sucursal
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validación: si tiene inventario asociado en inventario_sucursal, Postgres bloqueará por FK
    const result = await pool.query('DELETE FROM sucursales WHERE id = $1 RETURNING id, nombre;', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    res.json({ mensaje: 'Sucursal eliminada correctamente', sucursal: result.rows[0] });
  } catch (error: any) {
    console.error('Error al eliminar sucursal:', error);
    if (error.code === '23503') {
      return res.status(409).json({
        error: 'No se puede eliminar la sucursal porque tiene piezas de inventario o ventas asociadas.'
      });
    }
    res.status(500).json({ error: 'Error al eliminar sucursal' });
  }
});

export default router;