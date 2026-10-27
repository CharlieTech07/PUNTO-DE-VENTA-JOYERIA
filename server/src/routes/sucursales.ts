// server/src/routes/sucursales.ts
import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { verificarToken, permitirRoles } from '../middleware/verificarToken';

const router = Router();

// Seguridad: cualquier usuario con sesión puede consultar las sucursales;
// solo el Administrador puede darlas de alta o eliminarlas.

// GET: Obtener todas las sucursales
router.get('/', verificarToken, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM sucursales ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar sucursales:', error);
    res.status(500).json({ error: 'Error al consultar sucursales en pos_olimpo' });
  }
});

// POST: Registrar sucursal (solo Administrador)
router.post('/', verificarToken, permitirRoles('Administrador'), async (req: Request, res: Response) => {
  try {
    const { nombre, direccion, telefono } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la sucursal es obligatorio' });
    }

    // La columna direccion es NOT NULL en la base de datos
    if (!direccion || !direccion.trim()) {
      return res.status(400).json({ error: 'La dirección de la sucursal es obligatoria' });
    }

    const query = `
      INSERT INTO sucursales (nombre, direccion, telefono)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [nombre.trim(), direccion.trim(), telefono && telefono.trim() ? telefono.trim() : null];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al crear sucursal:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una sucursal con ese nombre' });
    }
    res.status(500).json({ error: 'Error al registrar sucursal en PostgreSQL' });
  }
});

// DELETE: Eliminar sucursal (solo Administrador)
router.delete('/:id', verificarToken, permitirRoles('Administrador'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Si tiene inventario, usuarios o ventas asociadas, Postgres lo bloquea por llave foránea
    const result = await pool.query('DELETE FROM sucursales WHERE id = $1 RETURNING id, nombre;', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    res.json({ mensaje: 'Sucursal eliminada correctamente', sucursal: result.rows[0] });
  } catch (error: any) {
    console.error('Error al eliminar sucursal:', error);
    // 23503 = llave foránea; con ON DELETE RESTRICT (como en DB_v3) Postgres responde 23001
    if (error.code === '23503' || error.code === '23001') {
      return res.status(409).json({
        error: 'No se puede eliminar la sucursal porque tiene empleados, inventario o ventas asociadas.'
      });
    }
    res.status(500).json({ error: 'Error al eliminar sucursal' });
  }
});

export default router;
