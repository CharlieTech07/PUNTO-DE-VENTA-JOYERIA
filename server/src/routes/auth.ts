// server/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { hashPassword, comparePassword } from '../utils/security';
import jwt from 'jsonwebtoken';
import { verificarToken, permitirRoles, RequestConUsuario } from '../middleware/verificarToken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'olimpo_secret_jwt_2026';

// ==========================================
// 1. INICIAR SESIÓN (POST /api/auth/login)
// ==========================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Debes proporcionar correo y contraseña' });
    }

    const query = `
      SELECT
        u.id,
        u.nombres,
        u.apellido_paterno,
        u.correo,
        u.contrasena_hash,
        u.rol,
        u.id_sucursal,
        u.activo,
        s.nombre AS nombre_sucursal
      FROM usuarios u
      LEFT JOIN sucursales s ON u.id_sucursal = s.id
      WHERE LOWER(u.correo) = LOWER($1);
    `;

    const { rows } = await db.query(query, [correo.trim()]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = rows[0];

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Tu usuario se encuentra inactivo. Contacta al Administrador.' });
    }

    const esValida = await comparePassword(contrasena, usuario.contrasena_hash);
    if (!esValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id: usuario.id,
      nombreCompleto: `${usuario.nombres} ${usuario.apellido_paterno}`,
      correo: usuario.correo,
      rol: usuario.rol,
      id_sucursal: usuario.id_sucursal,
      nombre_sucursal: usuario.nombre_sucursal || 'Acceso Global'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      mensaje: 'Acceso autorizado',
      token,
      usuario: payload
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno en el servidor de autenticación' });
  }
});

// ==========================================
// 2. LISTAR EMPLEADOS (GET /api/auth/usuarios)
// - Administrador: todos los empleados.
// - Gerente: solo los de su sucursal.
// - Cajero: sin acceso.
// ==========================================
router.get('/usuarios', verificarToken, permitirRoles('Administrador', 'Gerente'), async (req: RequestConUsuario, res: Response) => {
  try {
    const solicitante = req.usuarioToken!;

    let query = `
      SELECT 
        u.id, 
        u.nombres, 
        u.apellido_paterno, 
        u.apellido_materno, 
        u.correo, 
        u.rol, 
        u.id_sucursal, 
        u.activo,
        s.nombre AS nombre_sucursal
      FROM usuarios u
      LEFT JOIN sucursales s ON u.id_sucursal = s.id
    `;
    const values: any[] = [];

    if (solicitante.rol === 'Gerente') {
      query += ` WHERE u.id_sucursal = $1`;
      values.push(solicitante.id_sucursal);
    }
    query += ` ORDER BY u.id ASC;`;

    const { rows } = await db.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'No se pudo obtener la lista de usuarios' });
  }
});

// ==========================================
// 3. REGISTRAR EMPLEADO (POST /api/auth/usuarios)
// - Administrador: puede dar de alta Administradores y Gerentes.
// - Gerente: solo puede dar de alta Cajeros, y únicamente en su sucursal.
// - Cajero: sin acceso.
// ==========================================
router.post('/usuarios', verificarToken, permitirRoles('Administrador', 'Gerente'), async (req: RequestConUsuario, res: Response) => {
  try {
    const solicitante = req.usuarioToken!;
    const { nombres, apellido_paterno, apellido_materno, correo, contrasena, rol, id_sucursal } = req.body;

    if (!nombres || !apellido_paterno || !correo || !contrasena || !rol) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    const rolesQuePuedeCrear = solicitante.rol === 'Administrador'
      ? ['Administrador', 'Gerente']
      : ['Cajero'];

    if (!rolesQuePuedeCrear.includes(rol)) {
      return res.status(403).json({
        error: solicitante.rol === 'Administrador'
          ? 'Un Administrador solo puede dar de alta Administradores y Gerentes.'
          : 'Un Gerente solo puede dar de alta Cajeros.'
      });
    }

    let sucursalAsignada: number | null = null;
    if (solicitante.rol === 'Gerente') {
      // La sucursal del nuevo cajero siempre es la del gerente que lo registra
      if (!solicitante.id_sucursal) {
        return res.status(403).json({ error: 'Tu usuario no tiene una sucursal asignada.' });
      }
      if (id_sucursal && Number(id_sucursal) !== Number(solicitante.id_sucursal)) {
        return res.status(403).json({ error: 'Solo puedes dar de alta cajeros en tu propia sucursal.' });
      }
      sucursalAsignada = Number(solicitante.id_sucursal);
    } else if (rol === 'Gerente') {
      if (!id_sucursal) {
        return res.status(400).json({ error: 'El rol Gerente requiere tener una sucursal asignada.' });
      }
      sucursalAsignada = Number(id_sucursal);
    }

    const hash = await hashPassword(contrasena);

    const query = `
      INSERT INTO usuarios (
        id_sucursal, nombres, apellido_paterno, apellido_materno, correo, contrasena_hash, rol, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id, nombres, apellido_paterno, correo, rol, id_sucursal, activo;
    `;

    const values = [
      sucursalAsignada,
      nombres.trim(),
      apellido_paterno.trim(),
      apellido_materno ? apellido_materno.trim() : null,
      correo.trim().toLowerCase(),
      hash,
      rol
    ];

    const result = await db.query(query, values);
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error al registrar usuario:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un usuario con este correo, o ya hay un Administrador / un Gerente para esa sucursal.' });
    }
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Inconsistencia de sucursal para el rol asignado.' });
    }
    res.status(500).json({ error: 'Error interno al registrar usuario.' });
  }
});

// ==========================================
// 4. MODIFICAR EMPLEADO (PUT /api/auth/usuarios/:id)
// ==========================================
router.put('/usuarios/:id', verificarToken, async (req: RequestConUsuario, res: Response) => {
  try {
    const idUsuarioDestino = Number(req.params.id);
    const solicitante = req.usuarioToken!;
    const { nombres, apellido_paterno, apellido_materno, correo, rol, id_sucursal, contrasena } = req.body;

    const checkUser = await db.query('SELECT * FROM usuarios WHERE id = $1', [idUsuarioDestino]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    const usuarioActual = checkUser.rows[0];

    let rolFinal = rol;
    let sucursalFinal = id_sucursal ? Number(id_sucursal) : null;

    if (solicitante.rol === 'Gerente') {
      const esElMismo = usuarioActual.id === solicitante.id;

      if (usuarioActual.rol === 'Administrador' || (usuarioActual.rol === 'Gerente' && !esElMismo)) {
        return res.status(403).json({ error: 'No tienes permisos para modificar a este usuario' });
      }
      if (Number(usuarioActual.id_sucursal) !== Number(solicitante.id_sucursal)) {
        return res.status(403).json({ error: 'Solo puedes administrar empleados de tu propia sucursal' });
      }

      // Un Gerente no puede cambiar roles ni mover a nadie de sucursal:
      // el rol se queda como estaba y la sucursal es siempre la suya.
      rolFinal = usuarioActual.rol;
      sucursalFinal = Number(solicitante.id_sucursal);
    } else if (solicitante.rol !== 'Administrador') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    if (rolFinal === 'Administrador') {
      sucursalFinal = null;
    }

    let nuevoHash = usuarioActual.contrasena_hash;
    if (contrasena && contrasena.trim().length > 0) {
      nuevoHash = await hashPassword(contrasena.trim());
    }

    const updateQuery = `
      UPDATE usuarios
      SET nombres = $1,
          apellido_paterno = $2,
          apellido_materno = $3,
          correo = $4,
          rol = $5,
          id_sucursal = $6,
          contrasena_hash = $7
      WHERE id = $8
      RETURNING id, nombres, apellido_paterno, apellido_materno, correo, rol, id_sucursal, activo;
    `;

    const values = [
      nombres.trim(),
      apellido_paterno.trim(),
      apellido_materno ? apellido_materno.trim() : null,
      correo.trim().toLowerCase(),
      rolFinal,
      sucursalFinal,
      nuevoHash,
      idUsuarioDestino
    ];

    const result = await db.query(updateQuery, values);
    res.json({
      mensaje: 'Empleado actualizado correctamente',
      usuario: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error al editar usuario:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo electrónico ya pertenece a otro usuario registrado.' });
    }
    if (error.code === '23514') {
      return res.status(400).json({ error: 'Inconsistencia de sucursal para el rol asignado.' });
    }
    res.status(500).json({ error: 'Error interno al actualizar datos del usuario' });
  }
});

// ==========================================
// 5. ACTIVAR / DESACTIVAR (PATCH /api/auth/usuarios/:id/estado)
// ==========================================
router.patch('/usuarios/:id/estado', verificarToken, async (req: RequestConUsuario, res: Response) => {
  try {
    const idUsuarioDestino = Number(req.params.id);
    const solicitante = req.usuarioToken!;
    const { activo } = req.body;

    const checkUser = await db.query('SELECT * FROM usuarios WHERE id = $1', [idUsuarioDestino]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const usuarioActual = checkUser.rows[0];

    if (usuarioActual.id === solicitante.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta activa' });
    }

    if (solicitante.rol === 'Gerente') {
      if (usuarioActual.rol !== 'Cajero' || Number(usuarioActual.id_sucursal) !== Number(solicitante.id_sucursal)) {
        return res.status(403).json({ error: 'Solo tienes permisos para desactivar cajeros de tu sucursal' });
      }
    } else if (solicitante.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    const updateQuery = `
      UPDATE usuarios
      SET activo = $1
      WHERE id = $2
      RETURNING id, nombres, apellido_paterno, activo;
    `;
    const result = await db.query(updateQuery, [Boolean(activo), idUsuarioDestino]);

    res.json({
      mensaje: `Usuario ${result.rows[0].activo ? 'activado' : 'desactivado'} exitosamente`,
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado del empleado' });
  }
});

export default router;