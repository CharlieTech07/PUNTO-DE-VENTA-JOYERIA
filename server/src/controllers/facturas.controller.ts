// server/src/controllers/facturas.controller.ts
import { Response } from 'express';
import { RequestConUsuario } from '../middleware/verificarToken.js';
import {
  emitirFactura,
  listarFacturas,
  obtenerFactura,
  obtenerFacturaDeVenta,
  cancelarFactura,
  FacturaError,
} from '../services/facturas.service.js';

function manejarError(error: unknown, res: Response) {
  if (error instanceof FacturaError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Error en facturas:', error);
  return res.status(500).json({ error: 'No se pudo procesar la solicitud' });
}

export async function emitir(req: RequestConUsuario, res: Response) {
  try {
    const { id_venta, receptor } = req.body ?? {};
    const factura = await emitirFactura(id_venta, receptor, req.usuarioToken!);
    res.status(201).json(factura);
  } catch (error) {
    manejarError(error, res);
  }
}

export async function listar(req: RequestConUsuario, res: Response) {
  try {
    const { rfc, estado } = req.query as { rfc?: string; estado?: string };
    const facturas = await listarFacturas(req.usuarioToken!, { rfc, estado });
    res.json(facturas);
  } catch (error) {
    manejarError(error, res);
  }
}

export async function obtener(req: RequestConUsuario, res: Response) {
  try {
    const factura = await obtenerFactura(req.params.id, req.usuarioToken!);
    res.json(factura);
  } catch (error) {
    manejarError(error, res);
  }
}

export async function obtenerDeVenta(req: RequestConUsuario, res: Response) {
  try {
    const factura = await obtenerFacturaDeVenta(req.params.idVenta, req.usuarioToken!);
    res.json(factura);
  } catch (error) {
    manejarError(error, res);
  }
}

export async function cancelar(req: RequestConUsuario, res: Response) {
  try {
    const { motivo } = req.body ?? {};
    const factura = await cancelarFactura(req.params.id, motivo, req.usuarioToken!);
    res.json(factura);
  } catch (error) {
    manejarError(error, res);
  }
}