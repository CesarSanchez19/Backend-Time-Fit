import express from 'express';
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient
} from '../controllers/client.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isColaboratorOrAdmin } from '../middlewares/rol.middleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(isColaboratorOrAdmin);

router.post('/created', createClient);
router.post('/updated', updateClient);
router.post('/delete', deleteClient);
router.get('/all', getAllClients);
router.get('/:id', getClientById);

export default router;
