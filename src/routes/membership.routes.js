import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin, isColaboratorOrAdmin } from '../middlewares/rol.middleware.js';
import {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
} from '../controllers/membership.controller.js';

const router = express.Router();

router.use(verifyToken);

// Obtener todas memberships (admin o colaborador)
router.get('/', isColaboratorOrAdmin, getAllMemberships);

// Obtener una membership por ID (en la URL)
router.get('/:id', isColaboratorOrAdmin, getMembershipById);

// Crear una nueva membership (solo admin)
router.post('/created', isAdmin, createMembership);

// Actualizar una membership por ID enviado en el body
router.post('/updated', isAdmin, updateMembership);

// Eliminar una membership por ID enviado en el body
router.post('/delete', isAdmin, deleteMembership);

export default router;
