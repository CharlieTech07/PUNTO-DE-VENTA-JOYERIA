import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.status(200).json([
    {
      id: 1,
      folio: 'V-1001',
      usuarioId: 1,
      subtotal: 1800,
      total: 1800,
      metodoPago: 'efectivo',
      estado: 'completada',
    },
  ]);
});

router.get('/:id', async (req: Request, res: Response) => {
  res.status(200).json({
    id: Number(req.params.id),
    folio: 'V-1001',
    usuarioId: 1,
    subtotal: 1800,
    total: 1800,
    metodoPago: 'efectivo',
    estado: 'completada',
  });
});

router.post('/', async (req: Request, res: Response) => {
  res.status(201).json({
    message: 'Venta registrada correctamente',
    data: req.body,
  });
});

router.put('/:id', async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Venta actualizada correctamente',
    id: req.params.id,
    data: req.body,
  });
});

export default router;
