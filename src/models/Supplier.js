// models/Supplier.js
import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  gym_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Gym', 
    required: true 
  },
  // Campos de auditoría
  registered_by_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  registered_by_type: { 
    type: String, 
    enum: ['Administrador', 'Colaborador'], 
    required: true 
  },
  updated_by_id: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  updated_by_type: { 
    type: String, 
    enum: ['Administrador', 'Colaborador'] 
  }
}, { 
  timestamps: true, 
  collection: 'suppliers' 
});

// Índice para optimizar búsquedas
supplierSchema.index({ gym_id: 1 });

export default mongoose.model('Supplier', supplierSchema);