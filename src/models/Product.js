import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const productSchema = new Schema({
  name_product: { 
    type: String, 
    required: true,
    trim: true
  },
  stock: {
    quantity: { 
      type: Number, 
      required: true, 
      min: 0, 
      default: 0 
    },
    unit: { 
      type: String, 
      required: true,
      enum: ['pieza', 'kg', 'g', 'litro', 'ml', 'caja', 'paquete', 'metro', 'cm'],
      default: 'pieza'
    }
  },
  price: {
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    currency: { 
      type: String, 
      required: true,
      enum: ['MXN', 'USD', 'EUR'],
      default: 'MXN'
    }
  },
  category: { 
    type: String, 
    required: true,
    trim: true
  },
  barcode: { 
    type: String,
    trim: true,
    sparse: true // Permite valores null/undefined pero mantiene unicidad cuando existe
  },
  purchase_date: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Activo', 'Inactivo', 'Agotado', 'Cancelado'], 
    default: 'Activo',
    required: true 
  },
  supplier_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Supplier',
    required: true 
  },
  gym_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Gym', 
    required: true 
  },
  image_url: { 
    type: String,
    default: null
  },
  cardColor: { 
    type: String, 
    enum: ['Azul', 'Verde', 'Naranja', 'Rojo', 'Morado', 'Turquesa', 'Rosa', 'Amarillo', 'Cian', 'Lima'], 
    default: 'Azul'
  },
  
  // 🆕 CAMPO AGREGADO PARA VENTAS OBTENIDAS
  sales_obtained: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Campos de auditoría
  registered_by_id: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  registered_by_type: { 
    type: String, 
    enum: ['Administrador', 'Colaborador'], 
    required: true 
  },
  updated_by_id: { 
    type: Schema.Types.ObjectId 
  },
  updated_by_type: { 
    type: String, 
    enum: ['Administrador', 'Colaborador'] 
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  collection: 'products'
});


// Middleware para actualizar updated_at automáticamente
productSchema.pre('findOneAndUpdate', function() {
  this.set({ updated_at: new Date() });
});

export default model('Product', productSchema);