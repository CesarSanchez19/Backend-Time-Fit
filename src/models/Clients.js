import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const clientSchema = new Schema({
  full_name: {
    first: String,
    last_father: String,
    last_mother: String,
  },
  birth_date: Date,
  email: String,
  phone: String,
  rfc: String,
  emergency_contact: {
    name: String,
    phone: String,
  },
  membership_id: { type: Schema.Types.ObjectId, ref: 'Membership', required: true },
  start_date: Date,
  status: String,
  payment: {
    method: String,
    amount: Number,
    currency: String,
  },
  colaborator_id: { type: Schema.Types.ObjectId, ref: 'Colaborator', required: true },
  gym_id: { type: Schema.Types.ObjectId, ref: 'Gym', required: true },
}, {
  timestamps: true,
  collection: 'clients'
});

export default model('Client', clientSchema);
