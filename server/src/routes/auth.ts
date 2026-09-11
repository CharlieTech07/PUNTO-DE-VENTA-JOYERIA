import { Router, type Request, type Response } from 'express';

const router = Router();

router.post('/login', async (_req: Request, res: Response) => {
  try {
    res.status(200).json({
      token: 'demo-token',
      user: {
        id: 1,
        nombre: 'Administrador',
        email: 'admin@joyeria.com',
        rol: 'admin',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo iniciar sesión' });
  }
});

export default router;
