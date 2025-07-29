// controllers/note.controller.js
import Note from '../models/Note.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';

// ✅ Crear nota (admin y colaborador) - POST
export const createNote = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;
    const { title, content, category } = req.body;

    // Validaciones básicas - campos exactos del frontend
    if (!title || !content || !category) {
      return res.status(400).json({
        message: "Datos requeridos: title, content, category"
      });
    }

    // Validar categoría - exactas del frontend
    const validCategories = [
      'nota', 'recordatorio', 'reporte', 'curso', 
      'capacitacion', 'productos', 'soporte', 'quejas'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: "Categoría inválida. Categorías válidas: " + validCategories.join(', ')
      });
    }

    // Validar longitud del contenido
    if (content.length > 2000) {
      return res.status(400).json({
        message: "El contenido no puede exceder 2000 caracteres"
      });
    }

    if (title.length > 100) {
      return res.status(400).json({
        message: "El título no puede exceder 100 caracteres"
      });
    }

    // Crear la nota
    const newNote = new Note({
      title: title.trim(),
      content: content.trim(),
      category,
      user_id,
      user_type: role
    });

    const savedNote = await newNote.save();

    // Obtener información del usuario que creó la nota
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
      message: "Nota creada exitosamente",
      note: {
        ...savedNote.toObject(),
        created_by_name: createdByInfo.name
      }
    });

  } catch (err) {
    console.error("Error creando nota:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Actualizar nota (solo del usuario autenticado) - POST con ID en body
export const updateNote = async (req, res) => {
  try {
    const { id, title, content, category } = req.body; // ID viene en el body
    const { id: user_id, role } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID de la nota requerido" });
    }

    // Validar formato de ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Formato de ID inválido" });
    }

    // Buscar la nota que pertenezca al usuario autenticado
    const existingNote = await Note.findOne({
      _id: id,
      user_id,
      user_type: role
    });

    if (!existingNote) {
      return res.status(404).json({ message: "Nota no encontrada" });
    }

    // Preparar datos para actualizar
    const updateData = {};

    // Solo actualizar campos que se enviaron
    if (title !== undefined) {
      if (title.length > 100) {
        return res.status(400).json({
          message: "El título no puede exceder 100 caracteres"
        });
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      if (content.length > 2000) {
        return res.status(400).json({
          message: "El contenido no puede exceder 2000 caracteres"
        });
      }
      updateData.content = content.trim();
    }

    if (category !== undefined) {
      const validCategories = [
        'nota', 'recordatorio', 'reporte', 'curso', 
        'capacitacion', 'productos', 'soporte', 'quejas'
      ];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          message: "Categoría inválida"
        });
      }
      updateData.category = category;
    }

    // Actualizar la nota
    const updatedNote = await Note.findOneAndUpdate(
      { _id: id, user_id, user_type: role },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Error al actualizar la nota" });
    }

    res.json({
      message: "Nota actualizada exitosamente",
      note: updatedNote
    });

  } catch (err) {
    console.error("Error actualizando nota:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Eliminar nota (solo del usuario autenticado) - POST con ID en body
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.body; // ID viene en el body
    const { id: user_id, role } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID de la nota requerido" });
    }

    // Validar formato de ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Formato de ID inválido" });
    }

    // Buscar y eliminar la nota que pertenezca al usuario autenticado
    const deletedNote = await Note.findOneAndDelete({
      _id: id,
      user_id,
      user_type: role
    });

    if (!deletedNote) {
      return res.status(404).json({ message: "Nota no encontrada" });
    }

    res.json({
      message: "Nota eliminada exitosamente",
      deleted_note: {
        id: deletedNote._id,
        title: deletedNote.title,
        category: deletedNote.category,
        created_at: deletedNote.createdAt
      }
    });

  } catch (err) {
    console.error("Error eliminando nota:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Obtener todas las notas del usuario (admin y colaborador) - GET
export const getAllUserNotes = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;

    // Obtener parámetros de filtrado opcionales
    const {
      category,
      search,
      page = 1,
      limit = 50,
      sort_by = 'createdAt',
      sort_order = 'desc'
    } = req.query;

    // Construir filtros - solo notas del usuario autenticado
    const filters = { 
      user_id, 
      user_type: role 
    };

    if (category) {
      const validCategories = [
        'nota', 'recordatorio', 'reporte', 'curso', 
        'capacitacion', 'productos', 'soporte', 'quejas'
      ];
      if (validCategories.includes(category)) {
        filters.category = category;
      }
    }

    // Búsqueda por texto
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filters.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }

    // Calcular paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Configurar ordenamiento
    let sortConfig = {};
    const validSortFields = ['title', 'category', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'createdAt';
    const sortDirection = sort_order === 'asc' ? 1 : -1;
    sortConfig[sortField] = sortDirection;

    // Obtener notas ordenadas
    const notes = await Note.find(filters)
      .sort(sortConfig)
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de notas
    const totalNotes = await Note.countDocuments(filters);

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
    const stats = await Note.aggregate([
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
      message: "Notas obtenidas exitosamente",
      notes,
      user_info: userInfo,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalNotes / parseInt(limit)),
        total_notes: totalNotes,
        per_page: parseInt(limit)
      },
      statistics: {
        total_notes: totalNotes,
        by_category: categoryStats
      }
    });

  } catch (err) {
    console.error("Error obteniendo notas:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Obtener nota por ID (solo del usuario autenticado) - GET
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id, role } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID de la nota requerido" });
    }

    // Validar formato de ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Formato de ID inválido" });
    }

    // Buscar nota que pertenezca al usuario autenticado
    const note = await Note.findOne({
      _id: id,
      user_id,
      user_type: role
    });

    if (!note) {
      return res.status(404).json({ message: "Nota no encontrada" });
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
      message: "Nota obtenida exitosamente",
      note: {
        ...note.toObject(),
        owner_name: userInfo.name
      }
    });

  } catch (err) {
    console.error("Error obteniendo nota por ID:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Obtener estadísticas de notas del usuario - GET
export const getUserNotesStats = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;

    // Total de notas
    const totalNotes = await Note.countDocuments({
      user_id,
      user_type: role
    });

    // Notas por categoría
    const categoryStats = await Note.countNotesByCategory(user_id, role);

    // Notas recientes (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentNotes = await Note.countDocuments({
      user_id,
      user_type: role,
      createdAt: { $gte: sevenDaysAgo }
    });

    // Nota más reciente
    const latestNote = await Note.findOne({
      user_id,
      user_type: role
    }).sort({ createdAt: -1 });

    res.json({
      message: "Estadísticas obtenidas exitosamente",
      statistics: {
        total_notes: totalNotes,
        recent_notes: recentNotes,
        by_category: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        latest_note: latestNote ? {
          id: latestNote._id,
          title: latestNote.title,
          category: latestNote.category,
          created_at: latestNote.createdAt
        } : null
      }
    });

  } catch (err) {
    console.error("Error obteniendo estadísticas:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};

// ✅ Buscar notas por texto - GET
export const searchNotes = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;
    const { q: searchTerm, category, limit = 20 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        message: "Término de búsqueda requerido"
      });
    }

    // Construir filtros
    const filters = {
      user_id,
      user_type: role,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (category) {
      filters.category = category;
    }

    const notes = await Note.find(filters)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      message: "Búsqueda completada exitosamente",
      search_term: searchTerm,
      notes,
      total_results: notes.length
    });

  } catch (err) {
    console.error("Error en búsqueda de notas:", err);
    res.status(500).json({
      message: "Error interno del servidor",
      error: err.message
    });
  }
};