// routes/product.routes.js
import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  sellProduct
} from "../controllers/product.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isColaboratorOrAdmin } from "../middlewares/rol.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas que pueden usar tanto admin como colaborador
router.post("/create", isColaboratorOrAdmin, createProduct);        // Crear producto
router.get("/all", isColaboratorOrAdmin, getAllProducts);           // Obtener todos los productos
router.get("/:id", isColaboratorOrAdmin, getProductById);           // Obtener producto por ID
       
router.post("/sell", isColaboratorOrAdmin, sellProduct);            // Vender producto

// Rutas que solo puede usar el admin
router.post("/delete", isAdmin, deleteProduct);                     // Eliminar producto
router.post("/update", isAdmin, updateProduct);

export default router;