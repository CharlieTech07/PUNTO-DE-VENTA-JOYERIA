import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const resultado = await db.query(
      'SELECT * FROM productos ORDER BY id'
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al consultar productos:', error);

    res.status(500).json({
      mensaje: 'Error al obtener productos'
    });
  }
});

export default router;