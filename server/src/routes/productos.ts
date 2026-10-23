// server/src/routes/productos.ts (o productos.routes.ts)
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { pool } from '../db';
import { verificarToken, permitirRoles } from '../middleware/verificarToken';

const router = Router();

// Configuración de Multer en memoria (máximo 5MB por imagen)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Seguridad: cualquier usuario con sesión puede consultar el catálogo;
// solo el Administrador puede registrar, editar o eliminar productos.

// GET: Obtener productos convirtiendo el bytea en imagen base64 para el navegador
router.get('/', verificarToken, async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        id, 
        nombre, 
        descripcion, 
        tipo_metal, 
        kilataje, 
        peso_gramos, 
        precio_compra, 
        precio_venta, 
        id_categoria,
        CASE 
          WHEN imagen IS NOT NULL THEN encode(imagen, 'base64')
          ELSE NULL 
        END AS imagen_base64
      FROM productos 
      ORDER BY id ASC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar productos:', error);
    res.status(500).json({ error: 'Error al consultar productos' });
  }
});

// POST: Registrar joya recibiendo el archivo binario ('imagen')
router.post('/', verificarToken, permitirRoles('Administrador'), upload.single('imagen'), async (req: Request, res: Response) => {
  try {
    const { 
      nombre, 
      descripcion, 
      tipo_metal, 
      kilataje, 
      peso_gramos, 
      precio_compra, 
      precio_venta, 
      id_categoria 
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    // req.file contiene el archivo recibido por Multer
    const archivoImagen = req.file ? req.file.buffer : null;

    const query = `
      INSERT INTO productos (
        nombre, 
        descripcion, 
        tipo_metal, 
        kilataje, 
        peso_gramos, 
        precio_compra, 
        precio_venta, 
        id_categoria,
        imagen
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, nombre, descripcion, tipo_metal, kilataje, peso_gramos, 
        precio_compra, precio_venta, id_categoria,
        CASE 
          WHEN imagen IS NOT NULL THEN encode(imagen, 'base64')
          ELSE NULL 
        END AS imagen_base64;
    `;

    const values = [
      nombre.trim(),
      descripcion || null,
      tipo_metal || 'Oro',
      kilataje || null,
      peso_gramos ? Number(peso_gramos) : null,
      precio_compra ? Number(precio_compra) : 0,
      precio_venta ? Number(precio_venta) : 0,
      id_categoria ? Number(id_categoria) : 1,
      archivoImagen // Se guarda en la columna bytea
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al insertar producto con imagen:', error);
    res.status(500).json({ error: 'Error al guardar joya en PostgreSQL', detalle: error });
  }
});

// PUT: Editar una joya existente (la imagen es opcional: si no se manda, se conserva la actual)
router.put(
  '/:id',
  verificarToken,
  permitirRoles('Administrador'),
  (req: Request, res: Response, next) => {
    // Se atrapa el error de Multer (por ejemplo, imagen mayor a 5 MB) para responder algo claro
    upload.single('imagen')(req, res, (err: any) => {
      if (err) {
        const mensaje = err.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen no debe pasar de 5 MB'
          : 'No se pudo procesar la imagen';
        return res.status(400).json({ error: mensaje });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID de producto inválido' });
      }

      const {
        nombre,
        descripcion,
        tipo_metal,
        kilataje,
        peso_gramos,
        precio_compra,
        precio_venta,
        id_categoria
      } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }
      if (!tipo_metal || !tipo_metal.trim()) {
        return res.status(400).json({ error: 'El tipo de metal es obligatorio' });
      }

      const peso = Number(peso_gramos || 0);
      const compra = Number(precio_compra || 0);
      const venta = Number(precio_venta || 0);
      if ([peso, compra, venta].some(n => !Number.isFinite(n) || n < 0)) {
        return res.status(400).json({ error: 'Peso y precios deben ser números mayores o iguales a 0' });
      }

      // Si no llega archivo nuevo, queda null y COALESCE conserva la imagen guardada
      const imagenNueva = req.file ? req.file.buffer : null;
      const categoria = id_categoria ? Number(id_categoria) : null;

      const query = `
        UPDATE productos SET
          nombre = $1,
          descripcion = $2,
          tipo_metal = $3,
          kilataje = $4,
          peso_gramos = $5,
          precio_compra = $6,
          precio_venta = $7,
          id_categoria = COALESCE($8, id_categoria),
          imagen = COALESCE($9, imagen)
        WHERE id = $10
        RETURNING
          id, nombre, descripcion, tipo_metal, kilataje, peso_gramos,
          precio_compra, precio_venta, id_categoria,
          CASE
            WHEN imagen IS NOT NULL THEN encode(imagen, 'base64')
            ELSE NULL
          END AS imagen_base64;
      `;

      const values = [
        nombre.trim(),
        descripcion || null,
        tipo_metal.trim(),
        kilataje || null,
        peso,
        compra,
        venta,
        categoria,
        imagenNueva,
        id
      ];

      const result = await pool.query(query, values);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'El producto no existe en la base de datos' });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error al actualizar producto:', error);
      if (error.code === '23503') {
        return res.status(400).json({ error: 'La categoría indicada no existe' });
      }
      res.status(500).json({ error: 'Error al actualizar la joya en PostgreSQL' });
    }
  }
);

// DELETE: Eliminar una joya por ID
router.delete('/:id', verificarToken, permitirRoles('Administrador'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Ejecuta el DELETE retornando el registro eliminado
    const query = 'DELETE FROM productos WHERE id = $1 RETURNING id, nombre;';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'El producto no existe en la base de datos' });
    }

    res.status(200).json({
      mensaje: 'Producto eliminado con éxito',
      productoEliminado: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);

    // Código 23503 en Postgres = restricción de clave foránea (por ejemplo si ya se vendió)
    if (error.code === '23503') {
      return res.status(409).json({
        error: 'No se puede eliminar la joya porque ya está ligada a un inventario o venta.'
      });
    }

    res.status(500).json({ error: 'Error al eliminar de PostgreSQL', detalle: error });
  }
});

export default router;
