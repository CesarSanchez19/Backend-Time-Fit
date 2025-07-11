import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin, isColaboratorOrAdmin } from '../middlewares/rol.middleware.js';
import {
  createGym,
  getAllGyms,
  getMyGym,
  updateGym,
  deleteGym
} from '../controllers/gym.controller.js';

const router = express.Router();

router.use(verifyToken);

// Solo administradores
router.post('/created', isAdmin, createGym);
router.post('/updated', isAdmin, updateGym);
router.post('/delete', isAdmin, deleteGym);
router.get('/all', isAdmin, getAllGyms);

// Admin o colaborador pueden consultar su propio gym
router.get('/mygym', isColaboratorOrAdmin, getMyGym);

export default router;
