// server/src/middleware/verificarToken.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface RequestConUsuario extends Request {
  usuarioToken?: {
    id: number;
    rol: 'Administrador' | 'Gerente' | 'Cajero';
    id_sucursal: number | null;
  };
}

// Valida el token JWT y deja los datos del usuario en req.usuarioToken
export const verificarToken = (req: RequestConUsuario, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado: Falta token de sesión' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Mismo secreto que usa auth.ts para firmar el token
    const secreto = process.env.JWT_SECRET || 'olimpo_secret_jwt_2026';
    req.usuarioToken = jwt.verify(token, secreto) as any;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Deja pasar solo a los roles indicados. Se usa después de verificarToken.
export const permitirRoles = (...roles: Array<'Administrador' | 'Gerente' | 'Cajero'>) =>
  (req: RequestConUsuario, res: Response, next: NextFunction) => {
    if (!req.usuarioToken || !roles.includes(req.usuarioToken.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }
    next();
  };
