import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const addressSchema = new Schema({
  street: { type: String, required: true },
  colony: { type: String, required: true },
  Avenue: { type: String, required: true },
  'C.P': { type: String, required: true },
  City: { type: String, required: true },
  State: { type: String, required: true },
  Country: { type: String, required: true }
}, { _id: false });

const gymSchema = new Schema({
  name: { type: String, required: true },
  address: { type: addressSchema, required: true },
  opening_time: { type: String, required: true },
  closing_time: { type: String, required: true },
  logo_url: { type: String, default: null }
}, {
  collection: 'gyms',
  timestamps: true  // Esto crea automáticamente createdAt y updatedAt
});

export default model('Gym', gymSchema);
