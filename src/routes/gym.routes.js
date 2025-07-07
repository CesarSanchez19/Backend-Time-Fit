import { Router } from 'express';
import { getGyms, createGym,} from '../controllers/gym.controller.js';

const router = Router();

router.get('/', getGyms);           // Obtener todos los gimnasios
router.post('/', createGym);        // Crear un nuevo gimnasio
export default router;
