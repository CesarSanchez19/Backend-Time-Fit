// models/Product.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const productSchema = new Schema({
  name_product: { 
    type: String, 
    required: true 
  },
  stock: {
    quantity: { 
      type: Number, 
      required: true,
      min: 0 
    },
    unit: { 
      type: String, 
      required: true,
      enum: ['pieza', 'kg', 'litro', 'gramo', 'paquete', 'caja']
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
      enum: ['MXN', 'USD', 'EUR'],
      default: 'MXN'
    }
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Equipamento', 'Suplementos', 'Ropa', 'Accesorios', 'Bebidas', 'Otros']
  },
  barcode: { 
    type: String, 
    default: '' 
  },
  purchase_date: { 
    type: Date, 
    default: Date.now 
  },
  status: {
    type: String,
    enum: ['Activo', 'Inactivo', 'Agotado', 'Cancelado'],
    default: 'active'
  },
  supplier_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Supplier',
    default: null 
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
  }
}, { 
  timestamps: true, 
  collection: 'products' 
});

// Índices para optimizar búsquedas
productSchema.index({ gym_id: 1 });
productSchema.index({ barcode: 1, gym_id: 1 });
productSchema.index({ name_product: 1, gym_id: 1 });

export default model('Product', productSchema);