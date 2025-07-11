import { Router } from 'express';
import { login, registerAdmin, getAllAdmins, updateAdmin, deleteAdmin,getMyProfile  } from '../controllers/admin.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/rol.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', registerAdmin);

// CRUD protegido solo para administradores
router.use(verifyToken); // Aplicar token a las siguientes rutas
router.get('/all', isAdmin, getAllAdmins);
router.post('/updated', isAdmin, updateAdmin);
router.post('/delete', isAdmin, deleteAdmin);
router.get('/me', isAdmin, getMyProfile);



export default router;
