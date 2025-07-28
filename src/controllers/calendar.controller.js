// controllers/calendar.controller.js
import Calendar from '../models/Calendar.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';

// ✅ Crear evento de calendario (admin y colaborador)
export const createCalendarEvent = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;
    const {
      title,
      event_date,
      start_time,
      end_time,
      category
    } = req.body;

    // Validaciones básicas - solo campos requeridos según el modelo
    if (!title || !event_date || !start_time || !end_time || !category) {
      return res.status(400).json({
        message: "Datos requeridos: title, event_date, start_time, end_time, category"
      });
    }

    // Validar formato de fecha
    const eventDate = new Date(event_date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({
        message: "Formato de fecha inválido"
      });
    }

    // Validar categoría
    const validCategories = [
      'meetings', 'sales', 'feedback', 'reports', 'evaluation',
      'maintenance', 'training', 'metrics', 'special'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: "Categoría inválida. Categorías válidas: " + validCategories.join(', ')
      });
    }

    // Validar formato de tiempo
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        message: "Formato de tiempo inválido. Use HH:MM"
      });
    }

    // Validar que end_time sea posterior a start_time
    const startMinutes = start_time.split(':').reduce((h, m) => h * 60 + +m);
    const endMinutes = end_time.split(':').reduce((h, m) => h * 60 + +m);
    
    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        message: "La hora de fin debe ser posterior a la hora de inicio"
      });
    }

    // Crear el evento de calendario (solo con campos del modelo)
    const newEvent = new Calendar({
      title: title.trim(),
      event_date: eventDate,
      start_time,
      end_time,
      category,
      user_id,
      user_type: role
    });

    const savedEvent = await newEvent.save();

    // Obtener información del usuario que creó el evento
    let createdByInfo = { name: 'Usuario', role: role };
    if (role === 'Administrador') {
      const admin = await Admin.findById(user_id, 'name last_name');
      if (admin) {
        createdByInfo.name = `${admin.name || ''} ${admin.last_name || ''}`.trim();
      }
    } else if (role === 'Colaborador') {
      const colaborator = await Colaborator.findById(user_id, 'name last_name');
      if (colaborator) {
        createdByInfo.name = `${colaborator.name || ''} ${colaborator.last_name || ''}`.trim();
      }
    }

    res.status(201).json({
      message: "Evento creado exitosamente",
      event: {
        ...savedEvent.toObject(),
        created_by_name: createdByInfo.name
      }
    });

  } catch (err) {
    console.error("Error creando evento:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Obtener todos los eventos del usuario (admin y colaborador)
export const getAllUserEvents = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;

    // Obtener parámetros de filtrado opcionales
    const {
      category,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    // Construir filtros - solo eventos del usuario autenticado
    const filters = { 
      user_id, 
      user_type: role 
    };

    if (category) {
      const validCategories = [
        'meetings', 'sales', 'feedback', 'reports', 'evaluation',
        'maintenance', 'training', 'metrics', 'special'
      ];
      if (validCategories.includes(category)) {
        filters.category = category;
      }
    }

    if (start_date || end_date) {
      filters.event_date = {};
      if (start_date) {
        const startDate = new Date(start_date);
        if (!isNaN(startDate.getTime())) {
          filters.event_date.$gte = startDate;
        }
      }
      if (end_date) {
        const endDate = new Date(end_date);
        if (!isNaN(endDate.getTime())) {
          filters.event_date.$lte = endDate;
        }
      }
    }

    // Calcular paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener eventos ordenados por fecha y hora
    const events = await Calendar.find(filters)
      .sort({ event_date: 1, start_time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de eventos
    const totalEvents = await Calendar.countDocuments(filters);

    // Obtener información del usuario
    let userInfo = { name: 'Usuario', role: role };
    if (role === 'Administrador') {
      const admin = await Admin.findById(user_id, 'name last_name');
      if (admin) {
        userInfo.name = `${admin.name || ''} ${admin.last_name || ''}`.trim();
      }
    } else if (role === 'Colaborador') {
      const colaborator = await Colaborator.findById(user_id, 'name last_name');
      if (colaborator) {
        userInfo.name = `${colaborator.name || ''} ${colaborator.last_name || ''}`.trim();
      }
    }

    // Calcular estadísticas por categoría
    const stats = await Calendar.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      message: "Eventos obtenidos exitosamente",
      events,
      user_info: userInfo,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalEvents / parseInt(limit)),
        total_events: totalEvents,
        per_page: parseInt(limit)
      },
      statistics: {
        total_events: totalEvents,
        by_category: categoryStats
      }
    });

  } catch (err) {
    console.error("Error obteniendo eventos:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Obtener evento por ID (solo del usuario autenticado)
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id, role } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID del evento requerido" });
    }

    // Validar formato de ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Formato de ID inválido" });
    }

    // Buscar evento que pertenezca al usuario autenticado
    const event = await Calendar.findOne({
      _id: id,
      user_id,
      user_type: role
    });

    if (!event) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    // Obtener información del usuario
    let userInfo = { name: 'Usuario', role: role };
    if (role === 'Administrador') {
      const admin = await Admin.findById(user_id, 'name last_name');
      if (admin) {
        userInfo.name = `${admin.name || ''} ${admin.last_name || ''}`.trim();
      }
    } else if (role === 'Colaborador') {
      const colaborator = await Colaborator.findById(user_id, 'name last_name');
      if (colaborator) {
        userInfo.name = `${colaborator.name || ''} ${colaborator.last_name || ''}`.trim();
      }
    }

    res.json({
      message: "Evento obtenido exitosamente",
      event: {
        ...event.toObject(),
        owner_name: userInfo.name
      }
    });

  } catch (err) {
    console.error("Error obteniendo evento por ID:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Actualizar evento (solo del usuario autenticado)
export const updateCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params; // Cambiado para obtener ID desde params
    const dataToUpdate = req.body;
    const { id: user_id, role } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID del evento requerido" });
    }

    // Validar formato de ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Formato de ID inválido" });
    }

    // Buscar el evento que pertenezca al usuario autenticado
    const existingEvent = await Calendar.findOne({
      _id: id,
      user_id,
      user_type: role
    });

    if (!existingEvent) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    // Validar campos que se van a actualizar
    const allowedUpdates = ['title', 'event_date', 'start_time', 'end_time', 'category'];
    const updateData = {};

    // Solo permitir actualización de campos válidos
    for (const key of allowedUpdates) {
      if (dataToUpdate[key] !== undefined) {
        updateData[key] = dataToUpdate[key];
      }
    }

    // Validaciones específicas
    if (updateData.event_date) {
      const eventDate = new Date(updateData.event_date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
          message: "Formato de fecha inválido"
        });
      }
      updateData.event_date = eventDate;
    }

    if (updateData.category) {
      const validCategories = [
        'meetings', 'sales', 'feedback', 'reports', 'evaluation',
        'maintenance', 'training', 'metrics', 'special'
      ];
      if (!validCategories.includes(updateData.category)) {
        return res.status(400).json({
          message: "Categoría inválida"
        });
      }
    }

    // Validar formato de tiempo
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (updateData.start_time && !timeRegex.test(updateData.start_time)) {
      return res.status(400).json({
        message: "Formato de hora de inicio inválido. Use HH:MM"
      });
    }

    if (updateData.end_time && !timeRegex.test(updateData.end_time)) {
      return res.status(400).json({
        message: "Formato de hora de fin inválido. Use HH:MM"
      });
    }

    // Validar que end_time sea posterior a start_time
    const startTime = updateData.start_time || existingEvent.start_time;
    const endTime = updateData.end_time || existingEvent.end_time;
    
    const startMinutes = startTime.split(':').reduce((h, m) => h * 60 + +m);
    const endMinutes = endTime.split(':').reduce((h, m) => h * 60 + +m);
    
    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        message: "La hora de fin debe ser posterior a la hora de inicio"
      });
    }

    // Limpiar campos de texto
    if (updateData.title) updateData.title = updateData.title.trim();

    // Actualizar el evento
    const updatedEvent = await Calendar.findOneAndUpdate(
      { _id: id, user_id, user_type: role },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Error al actualizar el evento" });
    }

    res.json({
      message: "Evento actualizado exitosamente",
      event: updatedEvent
    });

  } catch (err) {
    console.error("Error actualizando evento:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Eliminar evento (solo del usuario autenticado)
export const deleteCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params; // Cambiado para obtener ID desde params
    const { id: user_id, role } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID del evento requerido" });
    }

    // Validar formato de ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Formato de ID inválido" });
    }

    // Buscar y eliminar el evento que pertenezca al usuario autenticado
    const deletedEvent = await Calendar.findOneAndDelete({
      _id: id,
      user_id,
      user_type: role
    });

    if (!deletedEvent) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    res.json({
      message: "Evento eliminado exitosamente",
      deleted_event: {
        id: deletedEvent._id,
        title: deletedEvent.title,
        event_date: deletedEvent.event_date,
        category: deletedEvent.category
      }
    });

  } catch (err) {
    console.error("Error eliminando evento:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Obtener eventos del día actual del usuario
export const getTodayEvents = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const todayEvents = await Calendar.find({
      user_id,
      user_type: role,
      event_date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ start_time: 1 });

    // Agrupar eventos por categoría
    const eventsByCategory = todayEvents.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    }, {});

    res.json({
      message: "Eventos de hoy obtenidos exitosamente",
      date: today.toISOString().split('T')[0],
      events: todayEvents,
      events_by_category: eventsByCategory,
      total_events: todayEvents.length
    });

  } catch (err) {
    console.error("Error obteniendo eventos de hoy:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Obtener eventos por rango de fechas
export const getEventsByDateRange = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: "start_date y end_date son requeridos"
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: "Formato de fecha inválido"
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        message: "La fecha de inicio debe ser anterior a la fecha de fin"
      });
    }

    const events = await Calendar.getEventsByUser(user_id, role, start_date, end_date);

    res.json({
      message: "Eventos obtenidos exitosamente",
      date_range: {
        start: start_date,
        end: end_date
      },
      events,
      total_events: events.length
    });

  } catch (err) {
    console.error("Error obteniendo eventos por rango de fechas:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};