import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express, type Request, type Response } from 'express';

import authRoutes from './routes/auth';
import cajaRoutes from './routes/caja';
import clientesRoutes from './routes/clientes';
import inventarioRoutes from './routes/inventario';
import productosRoutes from './routes/productos';
import ventasRoutes from './routes/ventas';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'POS Olimpo API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/caja', cajaRoutes);

app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
