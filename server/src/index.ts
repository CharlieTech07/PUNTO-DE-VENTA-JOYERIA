import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db.js';
import productosRoutes from './routes/productos.js';
import sucursalesRoutes from './routes/sucursales.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Servidor del Punto de Venta funcionando');
});

app.use('/api/productos', productosRoutes);
app.use('/api/sucursales', sucursalesRoutes);

db.query('SELECT NOW()')
  .then((resultado) => {
    console.log('PostgreSQL conectado:', resultado.rows[0]);
  })
  .catch((error) => {
    console.error('Error al conectar con PostgreSQL:', error);
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});


