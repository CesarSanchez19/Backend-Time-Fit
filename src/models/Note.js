// models/Note.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'nota',           // Nota
      'recordatorio',   // Recordatorio
      'reporte',        // Reporte
      'curso',          // Curso
      'capacitacion',   // Capacitacion
      'productos',      // Productos
      'soporte',        // Soporte
      'quejas'          // Quejas
    ],
    default: 'nota'
  },
  
  // Referencia al usuario propietario de la nota
  user_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  user_type: {
    type: String,
    enum: ['Administrador', 'Colaborador'],
    required: true
  }
}, {
  timestamps: true,
  collection: 'notes'
});

// Método estático para obtener notas de un usuario específico
noteSchema.statics.getNotesByUser = function(userId, userType, category = null, searchTerm = null) {
  let query = { user_id: userId, user_type: userType };
  
  if (category) {
    query.category = category;
  }
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Método para contar notas por categoría
noteSchema.statics.countNotesByCategory = function(userId, userType) {
  return this.aggregate([
    { $match: { user_id: userId, user_type: userType } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    }
  ]);
};

export default model('Note', noteSchema);