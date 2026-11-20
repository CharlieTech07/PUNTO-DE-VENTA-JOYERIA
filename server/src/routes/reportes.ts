import { Router, Response } from 'express';
import { permitirRoles, RequestConUsuario, verificarToken } from '../middleware/verificarToken.js';
import { enviarReporte } from '../services/correo.service.js';
import { prepararReporte } from '../services/reportes.service.js';

const router = Router();
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function fechaValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !FECHA_ISO.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

router.post('/', verificarToken, permitirRoles('Administrador', 'Gerente'), async (req: RequestConUsuario, res: Response) => {
  const usuario = req.usuarioToken!;
  const idioma: 'es' | 'en' = req.body?.idioma === 'en' ? 'en' : 'es';
  const fechaInicio = req.body?.fecha_inicio;
  const fechaFin = req.body?.fecha_fin;
  if (!fechaValida(fechaInicio) || !fechaValida(fechaFin)) {
    return res.status(400).json({ error: 'Selecciona fechas de inicio y finalización válidas.' });
  }
  if (fechaInicio > fechaFin) {
    return res.status(400).json({ error: 'La fecha de inicio debe ser anterior o igual a la fecha de finalización.' });
  }

  const idSucursal = usuario.rol === 'Gerente' ? Number(usuario.id_sucursal) : Number(req.body?.id_sucursal);
  if (!Number.isSafeInteger(idSucursal) || idSucursal <= 0) {
    return res.status(400).json({ error: 'Selecciona una sucursal válida.' });
  }
  if (usuario.rol === 'Gerente' && idSucursal !== Number(usuario.id_sucursal)) {
    return res.status(403).json({ error: 'Solo puedes generar reportes de tu sucursal.' });
  }
  const correo = (usuario as typeof usuario & { correo?: string }).correo;
  if (!correo) return res.status(400).json({ error: 'Tu cuenta no tiene un correo registrado para recibir el reporte.' });

  try {
    const reporte = await prepararReporte({
      idSucursal, fechaInicio, fechaFin, correo, idioma,
      generadoPor: (usuario as typeof usuario & { nombreCompleto?: string }).nombreCompleto ?? 'Usuario POS'
    });
    await enviarReporte({
      correo: reporte.correo, archivo: reporte.archivo, buffer: reporte.buffer,
      sucursal: reporte.sucursal, fechaInicio, fechaFin, idioma
    });

    res.status(202).json({
      mensaje: idioma === 'en'
        ? `The report was generated and emailed to ${reporte.correo}.`
        : `Reporte generado y enviado al correo ${reporte.correo}.`,
      sucursal: reporte.sucursal,
      correo: reporte.correo,
      ventas: reporte.ventas,
      total: reporte.total
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'SUCURSAL_NO_ENCONTRADA') {
      return res.status(404).json({ error: 'La sucursal seleccionada no existe o está inactiva.' });
    }
    console.error('Error al generar/enviar reporte:', error);
    res.status(500).json({ error: 'No se pudo generar o enviar el reporte. Revisa la configuración de correo e inténtalo de nuevo.' });
  }
});

export default router;
