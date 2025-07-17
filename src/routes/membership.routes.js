import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin, isColaboratorOrAdmin } from '../middlewares/rol.middleware.js';
import { requireGymContext } from '../middlewares/requireGymContext.js'; 

import {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
} from '../controllers/membership.controller.js';

const router = express.Router();

router.use(verifyToken);

// Todas estas requieren que el usuario tenga gym asignado
router.use(requireGymContext);

// Obtener todas memberships (admin o colaborador)
router.get('/', isColaboratorOrAdmin, getAllMemberships);

// Obtener una membership por ID
router.get('/:id', isColaboratorOrAdmin, getMembershipById);

// Crear
router.post('/created', isAdmin, createMembership);

// Actualizar
router.post('/updated', isAdmin, updateMembership);

// Eliminar
router.post('/delete', isAdmin, deleteMembership);

export default router;
