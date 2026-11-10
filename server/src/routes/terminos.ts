// server/src/routes/terminos.ts
// Confirmación de lectura de los términos de uso y el aviso de privacidad.
// Las dos primeras rutas son públicas porque se usan desde el enlace del correo:
// ahí la clave personal del enlace hace de llave. Las otras dos piden sesión.
import { Router, Request, Response } from 'express';
import { verificarToken, RequestConUsuario } from '../middleware/verificarToken.js';
import {
  VERSION_TERMINOS,
  buscarPorClave,
  fechaDeAceptacion,
  registrarAceptacion
} from '../services/terminos.service.js';

const router = Router();

const ENLACE_INVALIDO = 'El enlace no es válido o ya venció. Entre al sistema con su usuario y ahí podrá leerlos y confirmar.';
const FALTA_CASILLA = 'Hay que marcar la casilla para confirmar.';

// Desde dónde aceptó, para el registro
const origen = (req: Request) => ({
  ip: req.ip ?? null,
  navegador: String(req.headers['user-agent'] || '').slice(0, 300) || null
});

// 1. Datos del enlace del correo, para saludar y saber si ya había confirmado
router.post('/clave', async (req: Request, res: Response) => {
  try {
    const empleado = await buscarPorClave(req.body?.clave);
    if (!empleado) return res.status(404).json({ error: ENLACE_INVALIDO });
    res.json({
      nombres: empleado.nombres,
      nombre_usuario: empleado.nombre_usuario,
      version: VERSION_TERMINOS,
      aceptado_en: empleado.aceptado_en
    });
  } catch (error) {
    console.error('Error al revisar el enlace de términos:', error);
    res.status(500).json({ error: 'No se pudo revisar el enlace.' });
  }
});

// 2. Aceptar desde el enlace del correo
router.post('/aceptar-con-clave', async (req: Request, res: Response) => {
  try {
    if (req.body?.acepto !== true) return res.status(400).json({ error: FALTA_CASILLA });
    const empleado = await buscarPorClave(req.body?.clave);
    if (!empleado) return res.status(404).json({ error: ENLACE_INVALIDO });
    const aceptado_en = await registrarAceptacion(empleado.id, 'correo', origen(req));
    res.json({ nombres: empleado.nombres, nombre_usuario: empleado.nombre_usuario, aceptado_en });
  } catch (error) {
    console.error('Error al registrar la aceptación con enlace:', error);
    res.status(500).json({ error: 'No se pudo registrar la confirmación.' });
  }
});

// 3. Si el usuario con sesión ya aceptó la versión vigente
router.get('/estado', verificarToken, async (req: RequestConUsuario, res: Response) => {
  try {
    const aceptado_en = await fechaDeAceptacion(req.usuarioToken!.id);
    res.json({ version: VERSION_TERMINOS, pendiente: !aceptado_en, aceptado_en });
  } catch (error) {
    console.error('Error al consultar la aceptación de términos:', error);
    res.status(500).json({ error: 'No se pudo consultar la confirmación.' });
  }
});

// 4. Aceptar con sesión: la primera vez que entra, si no lo hizo desde el correo
router.post('/aceptar', verificarToken, async (req: RequestConUsuario, res: Response) => {
  try {
    if (req.body?.acepto !== true) return res.status(400).json({ error: FALTA_CASILLA });
    const aceptado_en = await registrarAceptacion(req.usuarioToken!.id, 'primer_acceso', origen(req));
    res.json({ aceptado_en });
  } catch (error) {
    console.error('Error al registrar la aceptación con sesión:', error);
    res.status(500).json({ error: 'No se pudo registrar la confirmación.' });
  }
});

export default router;
