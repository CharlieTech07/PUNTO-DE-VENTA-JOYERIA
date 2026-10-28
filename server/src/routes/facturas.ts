// server/src/routes/facturas.ts
import { Router } from 'express';
import { verificarToken, permitirRoles } from '../middleware/verificarToken.js';
import { emitir, listar, obtener, obtenerDeVenta, cancelar } from '../controllers/facturas.controller.js';

const router = Router();

// Cualquier usuario con sesión; el servicio revisa que la venta sea de su sucursal
router.post('/', verificarToken, emitir);

// Gerente (su sucursal) y Administrador (todas)
router.get('/', verificarToken, permitirRoles('Gerente', 'Administrador'), listar);

// Va antes de '/:id' para que 'venta' no se lea como un id
router.get('/venta/:idVenta', verificarToken, obtenerDeVenta);

// Usuarios de esa sucursal; el Administrador, todas
router.get('/:id', verificarToken, obtener);

// Gerente (su sucursal) y Administrador
router.patch('/:id/cancelar', verificarToken, permitirRoles('Gerente', 'Administrador'), cancelar);

export default router;