import { Router, Response } from 'express';
import { PoolClient } from 'pg';
import { pool } from '../db.js';
import { permitirRoles, RequestConUsuario, verificarToken } from '../middleware/verificarToken.js';

const router = Router();
const rolesCaja = permitirRoles('Administrador', 'Gerente', 'Cajero');

const CONSULTA_RESUMEN = `
  SELECT
    t.id, t.id_sucursal, t.id_usuario_apertura, t.id_usuario_cierre,
    t.estado, t.efectivo_inicial, t.ventas_efectivo, t.ventas_tarjeta,
    t.ventas_transferencia, t.ingresos, t.egresos, t.efectivo_esperado,
    t.efectivo_contado, t.diferencia, t.fecha_apertura, t.fecha_cierre,
    COALESCE(p.ventas_efectivo, 0) AS ventas_efectivo_actuales,
    COALESCE(p.ventas_tarjeta, 0) AS ventas_tarjeta_actuales,
    COALESCE(p.ventas_transferencia, 0) AS ventas_transferencia_actuales,
    COALESCE(m.ingresos, 0) AS ingresos_actuales,
    COALESCE(m.egresos, 0) AS egresos_actuales,
    t.efectivo_inicial + COALESCE(p.ventas_efectivo, 0)
      + COALESCE(m.ingresos, 0) - COALESCE(m.egresos, 0) AS efectivo_esperado_actual,
    COALESCE(p.ventas_efectivo, 0) + COALESCE(p.ventas_tarjeta, 0)
      + COALESCE(p.ventas_transferencia, 0) AS total_ventas_actual
  FROM caja_turnos t
  LEFT JOIN LATERAL (
    SELECT
      SUM(CASE WHEN pv.metodo = 'efectivo' THEN pv.monto ELSE 0 END) AS ventas_efectivo,
      SUM(CASE WHEN pv.metodo IN ('debito', 'credito') THEN pv.monto ELSE 0 END) AS ventas_tarjeta,
      SUM(CASE WHEN pv.metodo = 'transferencia' THEN pv.monto ELSE 0 END) AS ventas_transferencia
    FROM ventas v JOIN pagos_venta pv ON pv.id_venta = v.id
    WHERE v.id_caja_turno = t.id AND v.estado = 'Completada'
  ) p ON true
  LEFT JOIN LATERAL (
    SELECT
      SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END) AS ingresos,
      SUM(CASE WHEN tipo = 'EGRESO' THEN monto ELSE 0 END) AS egresos
    FROM caja_movimientos WHERE id_turno = t.id
  ) m ON true
  WHERE t.id = $1
`;

function montoValido(valor: unknown, permitirCero = false): number | null {
  const monto = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(monto) || (permitirCero ? monto < 0 : monto <= 0) || monto > 9_999_999_999.99) return null;
  if (Math.abs(monto * 100 - Math.round(monto * 100)) > 1e-8) return null;
  return Math.round(monto * 100) / 100;
}

function numero(valor: unknown): number {
  return Number(valor ?? 0);
}

async function obtenerResumen(client: PoolClient, turnoId: number) {
  const { rows } = await client.query(CONSULTA_RESUMEN, [turnoId]);
  return rows[0] ?? null;
}

router.get('/estado', verificarToken, rolesCaja, async (req: RequestConUsuario, res: Response) => {
  try {
    const usuarioId = Number(req.usuarioToken!.id);
    const { rows: turnos } = await pool.query(
      `SELECT id FROM caja_turnos WHERE id_usuario_apertura = $1 AND estado = 'abierta'`, [usuarioId]
    );
    if (!turnos.length) return res.json({ turno: null, resumen: null });

    const { rows } = await pool.query(CONSULTA_RESUMEN, [turnos[0].id]);
    const datos = rows[0];
    res.json({
      turno: {
        id: Number(datos.id), id_sucursal: Number(datos.id_sucursal), estado: datos.estado,
        efectivo_inicial: numero(datos.efectivo_inicial), fecha_apertura: datos.fecha_apertura
      },
      resumen: {
        ventas_efectivo: numero(datos.ventas_efectivo_actuales),
        ventas_tarjeta: numero(datos.ventas_tarjeta_actuales),
        ventas_transferencia: numero(datos.ventas_transferencia_actuales),
        ingresos: numero(datos.ingresos_actuales), egresos: numero(datos.egresos_actuales),
        efectivo_esperado: numero(datos.efectivo_esperado_actual),
        total_ventas: numero(datos.total_ventas_actual)
      }
    });
  } catch (error) {
    console.error('Error al consultar el estado de caja:', error);
    res.status(500).json({ error: 'No se pudo consultar el estado de caja' });
  }
});

router.get('/historial', verificarToken, rolesCaja, async (req: RequestConUsuario, res: Response) => {
  try {
    const usuario = req.usuarioToken!;
    const condiciones: string[] = ["t.estado = 'cerrada'"];
    const valores: number[] = [];
    if (usuario.rol === 'Cajero') {
      condiciones.push('t.id_usuario_apertura = $1');
      valores.push(Number(usuario.id));
    } else if (usuario.rol === 'Gerente') {
      if (!usuario.id_sucursal) return res.status(403).json({ error: 'Tu usuario no tiene una sucursal asignada' });
      condiciones.push('t.id_sucursal = $1');
      valores.push(Number(usuario.id_sucursal));
    }
    const { rows } = await pool.query(
      `SELECT t.id, t.id_sucursal, t.id_usuario_apertura, t.id_usuario_cierre,
              t.efectivo_inicial, t.ventas_efectivo, t.ventas_tarjeta, t.ventas_transferencia,
              t.ingresos, t.egresos, t.efectivo_esperado, t.efectivo_contado, t.diferencia,
              t.fecha_apertura, t.fecha_cierre,
              ua.nombre_usuario AS usuario_apertura, uc.nombre_usuario AS usuario_cierre,
              s.nombre AS nombre_sucursal
       FROM caja_turnos t
       JOIN usuarios ua ON ua.id = t.id_usuario_apertura
       LEFT JOIN usuarios uc ON uc.id = t.id_usuario_cierre
       JOIN sucursales s ON s.id = t.id_sucursal
       WHERE ${condiciones.join(' AND ')}
       ORDER BY t.fecha_cierre DESC LIMIT 100`, valores
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al consultar el historial de caja:', error);
    res.status(500).json({ error: 'No se pudo consultar el historial de caja' });
  }
});

router.post('/abrir', verificarToken, rolesCaja, async (req: RequestConUsuario, res: Response) => {
  const usuario = req.usuarioToken!;
  const efectivoInicial = montoValido(req.body?.efectivo_inicial, true);
  if (efectivoInicial === null) return res.status(400).json({ error: 'El fondo inicial debe ser un monto válido con máximo dos decimales' });

  const sucursalId = usuario.rol === 'Administrador'
    ? Number(req.body?.id_sucursal)
    : Number(usuario.id_sucursal);
  if (!Number.isSafeInteger(sucursalId) || sucursalId <= 0) {
    return res.status(400).json({ error: 'Selecciona una sucursal válida para abrir la caja' });
  }
  if (usuario.rol !== 'Administrador' && sucursalId !== Number(usuario.id_sucursal)) {
    return res.status(403).json({ error: 'No puedes abrir una caja en otra sucursal' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO caja_turnos (id_sucursal, id_usuario_apertura, efectivo_inicial)
       VALUES ($1, $2, $3)
       RETURNING id, id_sucursal, estado, efectivo_inicial, fecha_apertura`,
      [sucursalId, Number(usuario.id), efectivoInicial]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Ya tienes una caja abierta; ciérrala antes de iniciar otra' });
    }
    if ((error as { code?: string }).code === '23503') {
      return res.status(400).json({ error: 'La sucursal seleccionada no existe' });
    }
    console.error('Error al abrir caja:', error);
    res.status(500).json({ error: 'No se pudo abrir la caja' });
  }
});

router.post('/movimientos', verificarToken, rolesCaja, async (req: RequestConUsuario, res: Response) => {
  const usuario = req.usuarioToken!;
  const tipo = req.body?.tipo;
  const monto = montoValido(req.body?.monto);
  const motivo = typeof req.body?.motivo === 'string' ? req.body.motivo.trim() : '';
  if (tipo !== 'INGRESO' && tipo !== 'EGRESO') return res.status(400).json({ error: 'El movimiento debe ser un ingreso o egreso' });
  if (monto === null) return res.status(400).json({ error: 'El monto debe ser válido, positivo y tener máximo dos decimales' });
  if (!motivo || motivo.length > 240) return res.status(400).json({ error: 'Escribe un motivo de hasta 240 caracteres' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: turnos } = await client.query(
      `SELECT id FROM caja_turnos WHERE id_usuario_apertura = $1 AND estado = 'abierta' FOR UPDATE`,
      [Number(usuario.id)]
    );
    if (!turnos.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Abre una caja antes de registrar movimientos' });
    }
    const { rows } = await client.query(
      `INSERT INTO caja_movimientos (id_turno, id_usuario, tipo, monto, motivo)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, id_turno, tipo, monto, motivo, fecha`,
      [turnos[0].id, Number(usuario.id), tipo, monto, motivo]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Error al registrar movimiento de caja:', error);
    res.status(500).json({ error: 'No se pudo registrar el movimiento de caja' });
  } finally {
    client.release();
  }
});

router.post('/cerrar', verificarToken, rolesCaja, async (req: RequestConUsuario, res: Response) => {
  const contado = montoValido(req.body?.efectivo_contado, true);
  if (contado === null) return res.status(400).json({ error: 'El efectivo contado debe ser válido y tener máximo dos decimales' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: turnos } = await client.query(
      `SELECT id FROM caja_turnos WHERE id_usuario_apertura = $1 AND estado = 'abierta' FOR UPDATE`,
      [Number(req.usuarioToken!.id)]
    );
    if (!turnos.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'No tienes una caja abierta para cerrar' });
    }

    const resumen = await obtenerResumen(client, Number(turnos[0].id));
    if (!resumen) throw new Error('No se encontró el resumen de caja');
    const esperado = numero(resumen.efectivo_esperado_actual);
    const diferencia = Math.round((contado - esperado) * 100) / 100;
    const { rows } = await client.query(
      `UPDATE caja_turnos
       SET estado = 'cerrada', id_usuario_cierre = $1, fecha_cierre = now(),
           ventas_efectivo = $2, ventas_tarjeta = $3, ventas_transferencia = $4,
           ingresos = $5, egresos = $6, efectivo_esperado = $7,
           efectivo_contado = $8, diferencia = $9
       WHERE id = $10 AND estado = 'abierta'
       RETURNING id, id_sucursal, estado, efectivo_inicial, ventas_efectivo, ventas_tarjeta,
                 ventas_transferencia, ingresos, egresos, efectivo_esperado, efectivo_contado,
                 diferencia, fecha_apertura, fecha_cierre`,
      [Number(req.usuarioToken!.id), numero(resumen.ventas_efectivo_actuales), numero(resumen.ventas_tarjeta_actuales),
       numero(resumen.ventas_transferencia_actuales), numero(resumen.ingresos_actuales), numero(resumen.egresos_actuales),
       esperado, contado, diferencia, Number(turnos[0].id)]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ error: 'No se pudo cerrar la caja' });
  } finally {
    client.release();
  }
});

export default router;
