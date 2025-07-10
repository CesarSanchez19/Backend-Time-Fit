import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const membershipSchema = new Schema({
  name_membership: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  duration_days: { type: Number, required: true },
  period: { type: String, enum: ['semanal', 'quincenal', 'mensual', 'trimestral', 'anual'], required: true },
  status: { type: String, enum: ['Activado', 'Cancelado'], default: 'Activado' },
  gym_id: { type: Schema.Types.ObjectId, ref: 'Gym', required: true },
}, { timestamps: true, collection: 'memberships' });

export default model('Membership', membershipSchema);
