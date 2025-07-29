import { Router } from 'express';
import { 
  sellProduct,
  cancelSale,
  getSaleById,
  getAllSales,
  deleteSale,
  deleteMultipleCancelledSales
} from '../controllers/productSale.controller.js';

import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin, isColaboratorOrAdmin } from '../middlewares/rol.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// ✅ RUTAS PRINCIPALES

// Ruta para obtener todas las ventas realizadas (admin y colaborador)
// Esta debe ir ANTES de las rutas con parámetros para evitar conflictos
router.get('/all', isColaboratorOrAdmin, getAllSales);

// Ruta para vender productos (admin y colaborador)
router.post('/sell', isColaboratorOrAdmin, sellProduct); 

// Ruta para cancelar una venta (solo admin)
router.post('/cancel', isAdmin, cancelSale);

// Ruta para eliminar una sola venta del historial (solo admin - solo ventas canceladas)
router.post('/delete', isAdmin, deleteSale);

// Ruta para eliminar múltiples ventas canceladas del historial (solo admin)
router.post('/delete-multiple', isAdmin, deleteMultipleCancelledSales);

// Ruta para obtener detalles de una venta específica (admin y colaborador)
// Esta debe ir AL FINAL para evitar conflictos con rutas específicas
router.get('/:id', isColaboratorOrAdmin, getSaleById);

export default router;