// models/Calendar.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const calendarSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  event_date: {
    type: Date,
    required: true
  },
  start_time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // Formato HH:MM
  },
  end_time: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // Formato HH:MM
  },
  category: {
    type: String,
    required: true,
    enum: [
      'meetings',     // Reuniones
      'sales',        // Ventas
      'feedback',     // Feedback
      'reports',      // Reportes
      'evaluation',   // Evaluación
      'maintenance',  // Mantenimiento
      'training',     // Capacitación
      'metrics',      // Métricas
      'special'       // Especial
    ],
    default: 'meetings'
  },
  
  // Referencia al usuario propietario del evento
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
  collection: 'calendar'
});

// Índices para optimizar consultas
calendarSchema.index({ user_id: 1, user_type: 1, event_date: 1 });
calendarSchema.index({ user_id: 1, event_date: 1 });

// Validación personalizada: la hora de fin debe ser posterior a la hora de inicio
calendarSchema.pre('save', function(next) {
  const startTime = this.start_time.split(':').map(Number);
  const endTime = this.end_time.split(':').map(Number);
  
  const startMinutes = startTime[0] * 60 + startTime[1];
  const endMinutes = endTime[0] * 60 + endTime[1];
  
  if (endMinutes <= startMinutes) {
    next(new Error('La hora de fin debe ser posterior a la hora de inicio'));
    return;
  }
  next();
});

// Método estático para obtener eventos de un usuario específico
calendarSchema.statics.getEventsByUser = function(userId, userType, startDate = null, endDate = null) {
  let query = { user_id: userId, user_type: userType };
  
  if (startDate && endDate) {
    query.event_date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.find(query).sort({ event_date: 1, start_time: 1 });
};

export default model('Calendar', calendarSchema);