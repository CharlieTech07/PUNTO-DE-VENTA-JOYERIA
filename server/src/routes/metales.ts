// server/src/routes/metales.ts
// Precios reales (spot) de metales preciosos desde gold-api.com (gratuita, sin llave).
// Se consulta desde el servidor y se guarda en memoria para no saturar la API:
// la propia API pide cachear las respuestas al menos 30 segundos.
import { Router, Request, Response } from 'express';
import { verificarToken } from '../middleware/verificarToken';

const router = Router();

const API_BASE = 'https://api.gold-api.com';
const GRAMOS_POR_ONZA_TROY = 31.1034768;
const TIEMPO_CACHE_MS = 60 * 1000;
const TIEMPO_ESPERA_MS = 8000;

const METALES = [
  { symbol: 'XAU', nombre: 'Oro' },
  { symbol: 'XAG', nombre: 'Plata' },
  { symbol: 'XPT', nombre: 'Platino' },
  { symbol: 'XPD', nombre: 'Paladio' }
];

interface RespuestaPrecio {
  price: number;
  updatedAt: string;
}

async function pedirPrecio(symbol: string, moneda?: string): Promise<RespuestaPrecio> {
  const url = moneda ? `${API_BASE}/price/${symbol}/${moneda}` : `${API_BASE}/price/${symbol}`;
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(TIEMPO_ESPERA_MS) });

  if (!respuesta.ok) {
    throw new Error(`gold-api.com respondió ${respuesta.status} para ${symbol}`);
  }

  const datos = (await respuesta.json()) as RespuestaPrecio;
  if (typeof datos.price !== 'number' || !(datos.price > 0)) {
    throw new Error(`Precio inválido recibido para ${symbol}`);
  }
  return datos;
}

let cache: { guardadoEn: number; datos: any } | null = null;

async function consultarPrecios() {
  // Cuatro metales en USD + el oro en MXN (de ahí sale el tipo de cambio)
  const [usd, oroMxn] = await Promise.all([
    Promise.all(METALES.map(m => pedirPrecio(m.symbol))),
    pedirPrecio('XAU', 'MXN')
  ]);

  const tipoCambioMxn = oroMxn.price / usd[0].price; // pesos por cada dólar

  const metales = METALES.map((m, i) => {
    const usdOnza = usd[i].price;
    const usdGramo = usdOnza / GRAMOS_POR_ONZA_TROY;
    return {
      symbol: m.symbol,
      nombre: m.nombre,
      usd_onza: usdOnza,
      usd_gramo: usdGramo,
      mxn_onza: usdOnza * tipoCambioMxn,
      mxn_gramo: usdGramo * tipoCambioMxn,
      actualizado: usd[i].updatedAt
    };
  });

  return {
    fuente: 'gold-api.com',
    tipo_cambio_mxn: tipoCambioMxn,
    actualizado: usd.map(u => u.updatedAt).sort().pop() ?? null,
    metales
  };
}

// GET /api/metales — cualquier usuario con sesión puede consultar el precio
router.get('/', verificarToken, async (_req: Request, res: Response) => {
  try {
    if (cache && Date.now() - cache.guardadoEn < TIEMPO_CACHE_MS) {
      return res.json({ ...cache.datos, desactualizado: false });
    }

    const datos = await consultarPrecios();
    cache = { guardadoEn: Date.now(), datos };
    res.json({ ...datos, desactualizado: false });
  } catch (error) {
    console.error('Error al consultar precios de metales:', error);

    // Si el servicio externo falla, se devuelve el último precio bueno (marcado como desactualizado)
    if (cache) {
      return res.json({ ...cache.datos, desactualizado: true });
    }
    res.status(502).json({ error: 'No se pudo consultar el precio de los metales. Intenta de nuevo en un momento.' });
  }
});

export default router;
