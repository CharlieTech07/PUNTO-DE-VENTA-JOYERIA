import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.status(200).json([
    {
      id: 1,
      nombre: 'María',
      apellido: 'López',
      telefono: '55512345',
      email: 'maria@test.com',
      activo: true,
    },
  ]);
});

router.get('/:id', async (req: Request, res: Response) => {
  res.status(200).json({
    id: Number(req.params.id),
    nombre: 'María',
    apellido: 'López',
    telefono: '55512345',
    email: 'maria@test.com',
    activo: true,
  });
});

router.post('/', async (req: Request, res: Response) => {
  res.status(201).json({
    message: 'Cliente registrado correctamente',
    data: req.body,
  });
});

router.put('/:id', async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Cliente actualizado correctamente',
    id: req.params.id,
    data: req.body,
  });
});

router.delete('/:id', async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Cliente eliminado correctamente',
    id: req.params.id,
  });
});

export default router;
