// routes/calendar.routes.js
import express from 'express';
import {
  createCalendarEvent,
  getAllUserEvents,
  getEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  getTodayEvents,
  getEventsByDateRange
} from '../controllers/calendar.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isColaboratorOrAdmin } from '../middlewares/rol.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Todas las rutas pueden ser usadas por admin y colaborador (calendario personal)
router.use(isColaboratorOrAdmin);

// 📅 RUTAS POST (Crear eventos)
router.post('/create', createCalendarEvent);           // Crear evento

// 📅 RUTAS PUT (Actualizar eventos)
router.put('/:id', updateCalendarEvent);               // Actualizar evento por ID

// 📅 RUTAS DELETE (Eliminar eventos)
router.delete('/:id', deleteCalendarEvent);            // Eliminar evento por ID

// 📅 RUTAS GET (Consultas)
router.get('/all', getAllUserEvents);                  // Obtener todos los eventos del usuario
router.get('/today', getTodayEvents);                  // Obtener eventos de hoy
router.get('/date-range', getEventsByDateRange);       // Obtener eventos por rango de fechas
router.get('/:id', getEventById);                      // Obtener evento por ID

export default router;