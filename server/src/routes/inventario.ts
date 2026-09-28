import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.status(200).json([
    {
      id: 1,
      productoId: 1,
      stockActual: 15,
      stockMinimo: 5,
      ubicacion: 'Bodega A',
      esCritico: false,
    },
  ]);
});

router.get('/alertas', async (_req: Request, res: Response) => {
  res.status(200).json({
    totalAlertas: 1,
    items: [{ productoId: 1, stockActual: 2, stockMinimo: 5 }],
  });
});

export default router;
