// routes/note.routes.js
import express from 'express';
import {
  createNote,
  getAllUserNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getUserNotesStats,
  searchNotes
} from '../controllers/note.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isColaboratorOrAdmin } from '../middlewares/rol.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Todas las rutas pueden ser usadas por admin y colaborador (notas personales)
router.use(isColaboratorOrAdmin);

// 📝 RUTAS POST (Crear, actualizar y eliminar con ID en body)
router.post('/create', createNote);                    // Crear nota
router.post('/update', updateNote);                    // Actualizar nota (ID en body)
router.post('/delete', deleteNote);                    // Eliminar nota (ID en body)

// 📝 RUTAS GET (Consultas)
router.get('/all', getAllUserNotes);                   // Obtener todas las notas del usuario
router.get('/stats', getUserNotesStats);               // Obtener estadísticas de notas
router.get('/search', searchNotes);                    // Buscar notas por texto
router.get('/:id', getNoteById);                       // Obtener nota por ID

export default router;