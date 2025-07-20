import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const clientSchema = new Schema({
  full_name: {
    first: { type: String, required: true },
    last_father: { type: String, required: true },
    last_mother: { type: String, required: true },
  },
  birth_date: { type: Date, required: true }, 
  email: { type: String, required: true },
  phone: { type: String, required: true },
  rfc: { type: String, required: true },
  emergency_contact: {
    name: String,
    phone: String,
  },
  membership_id: { type: Schema.Types.ObjectId, ref: 'Membership', required: true },
  start_date: { type: Date, required: true },   
  end_date: { type: Date, required: true },    
  status: String,
  payment: {
    method: { type: String, required: true },
    amount: Number,
    currency: { type: String, required: true },
  },
  registered_by_id: { type: Schema.Types.ObjectId, required: true },
  registered_by_type: { type: String, enum: ['Administrador', 'Colaborador'], required: true },
  updated_by_id: { type: Schema.Types.ObjectId },   // nuevo
  updated_by_type: { type: String, enum: ['Administrador', 'Colaborador'] },  // nuevo
  gym_id: { type: Schema.Types.ObjectId, ref: 'Gym', required: true },
}, {
  timestamps: true,
  collection: 'clients'
});

export default model('Client', clientSchema);
