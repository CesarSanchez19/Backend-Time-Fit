// routes/product.routes.js
import { Router } from "express";
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from "../controllers/supplier.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { isAdmin, isColaboratorOrAdmin } from "../middlewares/rol.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas que pueden usar tanto admin como colaborador
router.post("/create", isColaboratorOrAdmin, createSupplier);       
router.get("/all", isColaboratorOrAdmin, getAllSuppliers);        
router.get("/:id", isColaboratorOrAdmin, getSupplierById);        

// Rutas que solo puede usar el admin
router.post("/delete", isAdmin, deleteSupplier);                   
router.post("/update", isAdmin, updateSupplier);

export default router;