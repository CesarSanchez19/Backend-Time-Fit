import { Router } from "express";
import {
  registerColaborator,
  loginColaborator,
  getAllColaborators,
  getMyColaboratorProfile,
  updateColaborator,
  deleteColaborator,
  getColaboratorById
} from "../controllers/colaborator.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/rol.middleware.js";

const router = Router();

// Rutas públicas
router.post("/login", loginColaborator);

// Rutas protegidas
router.use(verifyToken); // Aplicar verificación de token a todas las rutas siguientes

// Ruta para obtener el perfil del colaborador autenticado
router.get("/me", getMyColaboratorProfile); // ✅ Solo necesita estar autenticado

// Rutas solo para administradores
router.post("/register", isAdmin, registerColaborator); // Solo admin puede crear colaboradores
router.get("/all", isAdmin, getAllColaborators);
router.post("/updated", isAdmin, updateColaborator);
router.post("/delete", isAdmin, deleteColaborator);
router.get("/:id", isAdmin, getColaboratorById);

export default router;