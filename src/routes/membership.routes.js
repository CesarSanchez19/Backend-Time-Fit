import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireGymContext } from '../middlewares/gym.middleware.js';
import {
  getAllMemberships,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership
} from '../controllers/membershipController.js';

const router = express.Router();

// **GET** siempre libre (solo requiere token)
router.get('/', verifyToken, getAllMemberships);
router.get('/:id', verifyToken, getMembershipById);

// **POST** CREAR / ACTUALIZAR / ELIMINAR solo si tiene gym_id
router.post('/created', verifyToken, requireGymContext, createMembership);
router.post('/updated', verifyToken, requireGymContext, updateMembership);
router.post('/deleted', verifyToken, requireGymContext, deleteMembership);

export default router;
