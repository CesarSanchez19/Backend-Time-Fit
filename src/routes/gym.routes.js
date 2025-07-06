import { Router } from 'express';
import { getGyms, createGym, registerGymAndAssignAdmin } from '../controllers/gym.controller.js';

const router = Router();

router.get('/', getGyms);           // Obtener todos los gimnasios
router.post('/', createGym);        // Crear un nuevo gimnasio
router.post('/register-and-assign-admin', registerGymAndAssignAdmin); // Nuevo endpoint

export default router;
