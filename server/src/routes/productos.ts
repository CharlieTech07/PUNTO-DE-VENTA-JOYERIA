import { Router, type Request, type Response } from 'express';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.status(200).json([
    {
      id: 1,
      codigo: 'PRD-001',
      nombre: 'Anillo de oro',
      categoria: 'Anillos',
      precioCompra: 1200,
      precioVenta: 1800,
      stock: 15,
    },
  ]);
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  res.status(200).json({
    id: Number(id),
    codigo: 'PRD-001',
    nombre: 'Anillo de oro',
    categoria: 'Anillos',
    precioCompra: 1200,
    precioVenta: 1800,
    stock: 15,
  });
});

router.post('/', async (req: Request, res: Response) => {
  res.status(201).json({
    message: 'Producto creado correctamente',
    data: req.body,
  });
});

router.put('/:id', async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Producto actualizado correctamente',
    id: req.params.id,
    data: req.body,
  });
});

router.delete('/:id', async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Producto eliminado correctamente',
    id: req.params.id,
  });
});

export default router;
