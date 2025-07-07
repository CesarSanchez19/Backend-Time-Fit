import { Router } from 'express';
import { login, registerAdmin } from '../controllers/admin.controller.js';

const router = Router();

router.post('/login', login);  
router.post('/register', registerAdmin);


export default router;

