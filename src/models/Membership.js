import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const membershipSchema = new Schema({
  name_membership: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  duration_days: { type: Number, required: true },
  period: {
    type: String,
    enum: [ 'quincenal', 'mensual', 'trimestral', 'anual'],
    required: true
  },
  status: {
    type: String,
    enum: ['Activado', 'Desactivado'],
    default: 'Activado'
  },
  currency: {
    type: String,
    enum: ['MXN', 'USD', 'EUR'],
    default: 'MXN'
  },
  color: { type: String, default: 'Verde' },
  cantidad_usuarios: { type: Number, default: 0 },
  porcentaje_uso: { type: Number, default: 0 },
  gym_id: { type: Schema.Types.ObjectId, ref: 'Gym', required: true }
}, { timestamps: true, collection: 'memberships' });

export default model('memberships', membershipSchema);

