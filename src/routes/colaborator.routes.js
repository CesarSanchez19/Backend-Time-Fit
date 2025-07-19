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

// Públicas
router.post("/register", verifyToken, isAdmin, registerColaborator); // Solo admin
router.post("/login", loginColaborator);

// Privadas
router.get("/me", verifyToken, getMyColaboratorProfile); // Solo colaborador autenticado
router.get("/all", verifyToken, isAdmin, getAllColaborators); // Solo admin
router.post("/updated", verifyToken, isAdmin, updateColaborator); // Solo admin
router.post("/delete", verifyToken, isAdmin, deleteColaborator); // Solo admin
router.get("/:id", verifyToken, isAdmin, getColaboratorById); // Solo admin puede obtener colaborador por ID

export default router;
