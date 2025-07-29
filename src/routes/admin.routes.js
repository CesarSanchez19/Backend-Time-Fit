import { Router } from 'express';
import { login, registerAdmin, getAllAdmins, updateAdmin, deleteAdmin, getMyProfile } from '../controllers/admin.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/rol.middleware.js';

const router = Router();

// Rutas públicas
router.post('/login', login);
router.post('/register', registerAdmin);

// Rutas protegidas
router.use(verifyToken); // Aplicar verificación de token a todas las rutas siguientes

// Ruta para obtener el perfil del admin autenticado
router.get('/me', getMyProfile);

// Rutas solo para administradores
router.get('/all', isAdmin, getAllAdmins);
router.post('/updated', isAdmin, updateAdmin);
router.post('/delete', isAdmin, deleteAdmin);

export default router;