import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const addressSchema = new Schema({
  street: { type: String, required: true },
  colony: { type: String, required: true },
  avenue: { type: String, required: true },
  codigoPostal: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true }
}, { _id: false });

const gymSchema = new Schema({
  name: { type: String, required: true },
  address: { type: addressSchema, required: true },
  opening_time: { type: String, required: true },
  closing_time: { type: String, required: true },
  logo_url: { type: String, default: null }
}, {
  collection: 'gyms',
  timestamps: true
});

export default model('Gym', gymSchema);
