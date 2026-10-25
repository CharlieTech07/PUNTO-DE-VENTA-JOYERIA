import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';
import sucursalesRoutes from './routes/sucursales.js';
import inventarioRoutes from './routes/inventario.js';
import traduccionRoutes from './routes/traduccion.js';
import ventasRoutes from './routes/ventas.js';
import metalesRoutes from './routes/metales.js';
import terminosRoutes from './routes/terminos.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/', (_req, res) => {
  res.send('Servidor del Punto de Venta funcionando');
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/traduccion', traduccionRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/metales', metalesRoutes);
app.use('/api/terminos', terminosRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

