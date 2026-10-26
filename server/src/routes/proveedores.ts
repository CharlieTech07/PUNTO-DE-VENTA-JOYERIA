import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { permitirRoles, verificarToken } from '../middleware/verificarToken.js';

const router = Router();
const campos = ['nombre_empresa', 'nombre_contacto', 'telefono', 'correo', 'direccion', 'rfc_identificacion'] as const;
type CampoProveedor = typeof campos[number];

function normalizarDatos(body: Record<string, unknown>): Record<CampoProveedor, string | null> | null {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  if (!nombre || nombre.length > 150) return null;
  const resultado = {} as Record<CampoProveedor, string | null>;
  resultado.nombre_empresa = nombre;
  for (const campo of campos.slice(1) as Exclude<CampoProveedor, 'nombre_empresa'>[]) {
    const claveFormulario: Record<Exclude<CampoProveedor, 'nombre_empresa'>, string> = {
      nombre_contacto: 'contacto', telefono: 'telefono', correo: 'correo',
      direccion: 'direccion', rfc_identificacion: 'rfc_identificacion'
    };
    const valor = body[claveFormulario[campo]];
    if (valor !== undefined && valor !== null && typeof valor !== 'string') return null;
    const texto = typeof valor === 'string' ? valor.trim() : '';
    const limite = campo === 'correo' ? 150 : campo === 'telefono' ? 20 : campo === 'direccion' ? 1000 : campo === 'rfc_identificacion' ? 20 : 150;
    if (texto.length > limite) return null;
    resultado[campo] = texto || null;
  }
  return resultado;
}

router.get('/', verificarToken, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_empresa AS nombre, nombre_contacto AS contacto, telefono, correo,
              direccion, rfc_identificacion, TRUE AS activo
       FROM public.proveedores ORDER BY nombre_empresa ASC, id ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar proveedores:', error);
    res.status(500).json({ error: 'Error al consultar proveedores' });
  }
});

router.post('/', verificarToken, permitirRoles('Administrador', 'Gerente'), async (req: Request, res: Response) => {
  const datos = normalizarDatos(req.body ?? {});
  if (!datos) return res.status(400).json({ error: 'El nombre es obligatorio y los datos deben respetar los formatos y límites permitidos.' });
  try {
    const result = await pool.query(
      `INSERT INTO public.proveedores (nombre_empresa, nombre_contacto, telefono, correo, direccion, rfc_identificacion)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre_empresa AS nombre, nombre_contacto AS contacto, telefono, correo, direccion, rfc_identificacion, TRUE AS activo`,
      campos.map(campo => datos[campo])
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al registrar proveedor:', error);
    res.status(500).json({ error: 'Error al registrar proveedor' });
  }
});

router.put('/:id', verificarToken, permitirRoles('Administrador', 'Gerente'), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID de proveedor inválido' });
  const datos = normalizarDatos(req.body ?? {});
  if (!datos) return res.status(400).json({ error: 'El nombre es obligatorio y los datos deben respetar los formatos y límites permitidos.' });
  try {
    const result = await pool.query(
      `UPDATE public.proveedores SET nombre_empresa = $1, nombre_contacto = $2, telefono = $3,
         correo = $4, direccion = $5, rfc_identificacion = $6
       WHERE id = $7
       RETURNING id, nombre_empresa AS nombre, nombre_contacto AS contacto, telefono, correo, direccion, rfc_identificacion, TRUE AS activo`,
      [...campos.map(campo => datos[campo]), id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'El proveedor no existe' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

export default router;
