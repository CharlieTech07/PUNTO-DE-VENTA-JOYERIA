import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/estado', async (_req: Request, res: Response) => {
  res.status(200).json({
    apertura: true,
    monto: 5000,
  });
});

router.post('/abrir', async (req: Request, res: Response) => {
  res.status(200).json({
    mensaje: 'Caja abierta correctamente',
    montoBase: req.body.montoBase ?? 0,
  });
});

router.post('/cerrar', async (_req: Request, res: Response) => {
  res.status(200).json({
    fecha: new Date().toISOString(),
    ingresos: 15000,
    egresos: 3000,
    saldoFinal: 12000,
  });
});

export default router;
