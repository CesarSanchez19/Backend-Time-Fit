import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const productSaleSchema = new Schema({
  product_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  product_name: { 
    type: String, 
    required: true 
  },
  unit_price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  quantity_sold: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  sale_code: { 
    type: String, 
    required: true, 
    unique: true 
  },
  client_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Client',
    required: true 
  },
  client_name: { 
    type: String, 
    required: true 
  },
  sale_date: { 
    type: Date, 
    default: Date.now, 
    required: true 
  },
  seller_id: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  seller_name: { 
    type: String, 
    required: true 
  },
  seller_role: { 
    type: String, 
    enum: ['Administrador', 'Colaborador'], 
    required: true 
  },
  sale_status: { 
    type: String, 
    enum: ['Exitosa', 'Pendiente', 'Cancelada'], 
    default: 'Exitosa',
    required: true 
  },
  total_sale: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  gym_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Gym', 
    required: true 
  },
  
  // Campos adicionales para cancelaciones
  cancellation_reason: {
    type: String,
    default: null
  },
  cancelled_by_id: {
    type: Schema.Types.ObjectId,
    default: null
  },
  cancelled_by_type: {
    type: String,
    enum: ['Administrador', 'Colaborador'],
    default: null
  },
  cancelled_at: {
    type: Date,
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
  collection: 'product_sales' 
});

export default model('ProductSale', productSaleSchema);