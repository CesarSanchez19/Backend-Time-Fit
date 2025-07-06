import { Router } from 'express';
import { login, registerAdmin, registerWithGym } from '../controllers/admin.controller.js';

const router = Router();

router.post('/login', login);  
router.post('/register', registerAdmin);

// Opcional: evitar duplicar, indicamos que se use /api/gyms/register-and-assign-admin
router.post('/registerWithGym', registerWithGym);

export default router;

