import { Request, Response, Router } from 'express';
import { pool } from '../db.js';
import { permitirRoles, verificarToken } from '../middleware/verificarToken.js';

const router = Router();
router.use(verificarToken);

type DatosFiscales = {
  razon_social: string;
  rfc: string;
  regimen_fiscal: string;
  codigo_postal: string;
  calle: string;
  numero_exterior: string;
  numero_interior: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  correo: string | null;
  telefono: string | null;
};

function texto(body: Record<string, unknown>, key: string, max: number, requerido = false): string | null {
  const value = body[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;
  const result = value.trim();
  if (result.length > max || (requerido && !result)) return null;
  return result || null;
}

function normalizarDatosFiscales(body: Record<string, unknown>): DatosFiscales | null {
  const campos = ['razon_social', 'rfc', 'regimen_fiscal', 'codigo_postal', 'calle', 'numero_exterior', 'numero_interior', 'colonia', 'municipio', 'estado', 'correo', 'telefono'];
  if (campos.some(campo => body[campo] !== undefined && body[campo] !== null && typeof body[campo] !== 'string')) return null;
  const razon_social = texto(body, 'razon_social', 300, true);
  const rfc = texto(body, 'rfc', 13, true)?.toUpperCase() ?? null;
  const regimen_fiscal = texto(body, 'regimen_fiscal', 3, true);
  const codigo_postal = texto(body, 'codigo_postal', 5, true);
  const calle = texto(body, 'calle', 150, true);
  const numero_exterior = texto(body, 'numero_exterior', 20, true);
  const numero_interior = texto(body, 'numero_interior', 20);
  const colonia = texto(body, 'colonia', 100);
  const municipio = texto(body, 'municipio', 100);
  const estado = texto(body, 'estado', 100);
  const correo = texto(body, 'correo', 254);
  const telefono = texto(body, 'telefono', 20);

  if ([razon_social, rfc, regimen_fiscal, codigo_postal, calle, numero_exterior].some(value => value === null)) return null;
  if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/.test(rfc!)) return null;
  if (!/^\d{3}$/.test(regimen_fiscal!) || !/^\d{5}$/.test(codigo_postal!)) return null;
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return null;

  return {
    razon_social: razon_social!, rfc: rfc!, regimen_fiscal: regimen_fiscal!, codigo_postal: codigo_postal!,
    calle: calle!, numero_exterior: numero_exterior!, numero_interior, colonia, municipio, estado, correo, telefono,
  };
}

router.get('/facturacion', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public.datos_facturacion_empresa WHERE id = 1');
    res.json(rows[0] ?? null);
  } catch (error) {
    console.error('Error al consultar datos fiscales:', error);
    res.status(500).json({ error: 'No se pudieron consultar los datos fiscales' });
  }
});

router.use(permitirRoles('Administrador'));

router.put('/facturacion', async (req: Request, res: Response) => {
  const datos = normalizarDatosFiscales(req.body ?? {});
  if (!datos) return res.status(400).json({ error: 'Revisa los datos fiscales: razón social, RFC, régimen, código postal y domicilio son obligatorios.' });
  try {
    const columnas = Object.keys(datos) as (keyof DatosFiscales)[];
    const valores = columnas.map(campo => datos[campo]);
    const asignaciones = columnas.map((campo, index) => `${campo} = $${index + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO public.datos_facturacion_empresa (id, ${columnas.join(', ')})
       VALUES (1, ${valores.map((_, index) => `$${index + 1}`).join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${asignaciones}, actualizado_en = now()
       RETURNING *`,
      valores,
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al guardar datos fiscales:', error);
    res.status(500).json({ error: 'No se pudieron guardar los datos fiscales' });
  }
});

type DatosCuenta = {
  id_sucursal: number;
  alias: string;
  banco: string;
  titular: string;
  tipo_cuenta: string;
  numero_cuenta: string | null;
  clabe: string | null;
  moneda: string;
  forma_pago: string | null;
};

function normalizarCuenta(body: Record<string, unknown>): DatosCuenta | null {
  const campos = ['id_sucursal', 'alias', 'banco', 'titular', 'tipo_cuenta', 'numero_cuenta', 'clabe', 'moneda', 'forma_pago'];
  if (campos.filter(campo => campo !== 'id_sucursal').some(campo => body[campo] !== undefined && body[campo] !== null && typeof body[campo] !== 'string')) return null;
  const alias = texto(body, 'alias', 80, true);
  const banco = texto(body, 'banco', 100, true);
  const titular = texto(body, 'titular', 200, true);
  const tipo_cuenta = texto(body, 'tipo_cuenta', 30, true);
  const numero_cuenta = texto(body, 'numero_cuenta', 30);
  const clabe = texto(body, 'clabe', 18);
  const monedaRaw = texto(body, 'moneda', 3, true);
  const forma_pago = texto(body, 'forma_pago', 100);
  const id_sucursal = Number(body['id_sucursal']);

  if (!Number.isSafeInteger(id_sucursal) || id_sucursal <= 0 || [alias, banco, titular, tipo_cuenta, monedaRaw].some(value => value === null)) return null;
  if (clabe && !/^\d{18}$/.test(clabe)) return null;
  if (numero_cuenta && !/^[\da-zA-Z-]{4,30}$/.test(numero_cuenta)) return null;
  if (!numero_cuenta && !clabe) return null;
  if (!/^[A-Za-z]{3}$/.test(monedaRaw!)) return null;

  return { id_sucursal, alias: alias!, banco: banco!, titular: titular!, tipo_cuenta: tipo_cuenta!, numero_cuenta, clabe, moneda: monedaRaw!.toUpperCase(), forma_pago };
}

router.get('/bancarios', async (req: Request, res: Response) => {
  const rawSucursal = req.query['sucursalId'];
  let idSucursal: number | null = null;
  if (rawSucursal !== undefined) {
    idSucursal = Number(rawSucursal);
    if (!Number.isSafeInteger(idSucursal) || idSucursal <= 0) {
      return res.status(400).json({ error: 'Selecciona una sucursal válida.' });
    }
  }
  try {
    const { rows } = await pool.query(
      `SELECT cb.*, s.nombre AS sucursal
       FROM public.cuentas_bancarias cb
       LEFT JOIN public.sucursales s ON s.id = cb.id_sucursal
       WHERE ($1::bigint IS NULL OR cb.id_sucursal = $1 OR cb.id_sucursal IS NULL)
       ORDER BY cb.activa DESC, s.nombre NULLS FIRST, cb.banco, cb.alias, cb.id`,
      [idSucursal],
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al consultar cuentas bancarias:', error);
    res.status(500).json({ error: 'No se pudieron consultar las cuentas bancarias' });
  }
});

router.post('/bancarios', async (req: Request, res: Response) => {
  const datos = normalizarCuenta(req.body ?? {});
  if (!datos) return res.status(400).json({ error: 'Completa alias, banco, titular y tipo de cuenta; captura una CLABE válida o número de cuenta.' });
  try {
    const columnas = Object.keys(datos) as (keyof DatosCuenta)[];
    const valores = columnas.map(campo => datos[campo]);
    const { rows } = await pool.query(
      `INSERT INTO public.cuentas_bancarias (${columnas.join(', ')})
       VALUES (${valores.map((_, index) => `$${index + 1}`).join(', ')}) RETURNING *`,
      valores,
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al registrar cuenta bancaria:', error);
    res.status(500).json({ error: 'No se pudo registrar la cuenta bancaria' });
  }
});

router.put('/bancarios/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'ID de cuenta inválido' });
  const datos = normalizarCuenta(req.body ?? {});
  if (!datos) return res.status(400).json({ error: 'Completa alias, banco, titular y tipo de cuenta; captura una CLABE válida o número de cuenta.' });
  try {
    const { id_sucursal, ...datosCuenta } = datos;
    const columnas = Object.keys(datosCuenta) as (keyof Omit<DatosCuenta, 'id_sucursal'>)[];
    const asignaciones = columnas.map((campo, index) => `${campo} = $${index + 1}`).join(', ');
    const valores = columnas.map(campo => datos[campo]);
    const { rows } = await pool.query(
      `UPDATE public.cuentas_bancarias SET id_sucursal = $${valores.length + 1}, ${asignaciones}, actualizado_en = now()
       WHERE id = $${valores.length + 2} RETURNING *`,
      [...valores, id_sucursal, id],
    );
    if (!rows.length) return res.status(404).json({ error: 'La cuenta bancaria no existe' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al actualizar cuenta bancaria:', error);
    res.status(500).json({ error: 'No se pudo actualizar la cuenta bancaria' });
  }
});

router.patch('/bancarios/:id/estado', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { activa } = req.body ?? {};
  if (!Number.isSafeInteger(id) || id <= 0 || typeof activa !== 'boolean') {
    return res.status(400).json({ error: 'ID o estado de cuenta inválido' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE public.cuentas_bancarias SET activa = $1, actualizado_en = now() WHERE id = $2 RETURNING *`,
      [activa, id],
    );
    if (!rows.length) return res.status(404).json({ error: 'La cuenta bancaria no existe' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al cambiar estado de cuenta bancaria:', error);
    res.status(500).json({ error: 'No se pudo cambiar el estado de la cuenta bancaria' });
  }
});

export default router;
