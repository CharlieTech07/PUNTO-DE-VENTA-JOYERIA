// server/src/db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'pos_olimpo',
});

// Alias por si en algún archivo importas como { db }
export const db = pool;

// Notificaciones en consola para depuración
pool.on('connect', () => {
  console.log('Cliente conectado a la base de datos pos_olimpo');
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});