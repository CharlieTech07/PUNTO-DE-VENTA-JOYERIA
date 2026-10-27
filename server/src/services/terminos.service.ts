// server/src/services/terminos.service.ts
// Quién leyó y aceptó los términos de uso y el aviso de privacidad, y el enlace personal
// que llega en el correo de bienvenida para hacerlo. Tablas: aceptaciones_terminos y las
// columnas clave_terminos_* de usuarios (server/scripts/migracion-aceptacion-terminos.sql).
import crypto from 'crypto';
import { db } from '../db.js';

// Versión de los textos de client/src/pages/legal/textos.ts. Si cambian, se cambia aquí
// y a todos se les vuelve a pedir que los acepten (cada versión se acepta una vez).
export const VERSION_TERMINOS = '2026-10-22';
const DIAS_VIGENCIA_ENLACE = 30;

export type MedioAceptacion = 'correo' | 'primer_acceso';

// La clave del enlace no se guarda: solo su huella, como se hace con las contraseñas
const huella = (clave: string) => crypto.createHash('sha256').update(clave).digest('hex');

export function enlaceTerminos(clave: string): string {
  const base = (process.env.APP_URL || 'http://localhost:4300').replace(/\/+$/, '');
  return `${base}/confirmar-lectura?clave=${encodeURIComponent(clave)}`;
}

// Crea el enlace personal del correo. Si ya tenía uno, el anterior deja de servir.
export async function crearClaveTerminos(idUsuario: number): Promise<string> {
  const clave = crypto.randomBytes(32).toString('base64url');
  await db.query(
    `UPDATE usuarios
        SET clave_terminos_hash = $1,
            clave_terminos_vence = now() + make_interval(days => $2::int)
      WHERE id = $3`,
    [huella(clave), DIAS_VIGENCIA_ENLACE, idUsuario]
  );
  return clave;
}

export interface EmpleadoDelEnlace {
  id: number;
  nombres: string;
  nombre_usuario: string;
  aceptado_en: Date | null;
}

// El empleado al que pertenece el enlace, o null si no existe, ya venció o la cuenta está inactiva
export async function buscarPorClave(clave: unknown): Promise<EmpleadoDelEnlace | null> {
  if (typeof clave !== 'string' || clave.length < 20 || clave.length > 100) return null;
  const { rows } = await db.query(
    `SELECT u.id, u.nombres, u.nombre_usuario, a.aceptado_en
       FROM usuarios u
       LEFT JOIN aceptaciones_terminos a ON a.id_usuario = u.id AND a.version = $2
      WHERE u.clave_terminos_hash = $1
        AND u.clave_terminos_vence > now()
        AND u.activo = true`,
    [huella(clave), VERSION_TERMINOS]
  );
  return rows[0] ?? null;
}

// Cuándo aceptó la versión vigente; null si todavía no
export async function fechaDeAceptacion(idUsuario: number): Promise<Date | null> {
  const { rows } = await db.query(
    'SELECT aceptado_en FROM aceptaciones_terminos WHERE id_usuario = $1 AND version = $2',
    [idUsuario, VERSION_TERMINOS]
  );
  return rows[0]?.aceptado_en ?? null;
}

// Guarda la aceptación. Si ya la había dado, se conserva la fecha de la primera vez.
export async function registrarAceptacion(
  idUsuario: number,
  medio: MedioAceptacion,
  origen: { ip: string | null; navegador: string | null }
): Promise<Date> {
  const { rows } = await db.query(
    `INSERT INTO aceptaciones_terminos (id_usuario, version, medio, ip, navegador)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id_usuario, version) DO UPDATE SET id_usuario = aceptaciones_terminos.id_usuario
     RETURNING aceptado_en`,
    [idUsuario, VERSION_TERMINOS, medio, origen.ip, origen.navegador]
  );
  return rows[0].aceptado_en;
}
