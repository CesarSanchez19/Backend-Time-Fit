import { Router } from 'express';
import { 
  sellProduct,
  cancelSale,
  getSaleById,
  getAllSales 
} from '../controllers/productSale.controller.js';

import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin, isColaboratorOrAdmin } from '../middlewares/rol.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Ruta para vender productos (admin y colaborador)
router.post('/sell', isColaboratorOrAdmin, sellProduct); 

// Ruta para cancelar una venta (solo admin)
router.post('/cancel', isAdmin, cancelSale);  // Se cambió de DELETE a POST, y el ID se pasa en el cuerpo

// Ruta para obtener detalles de una venta (admin y colaborador)
router.get('/:id', isColaboratorOrAdmin, getSaleById);

// Ruta para obtener todas las ventas realizadas (admin y colaborador)
router.get('/', isColaboratorOrAdmin, getAllSales); 

export default router;
