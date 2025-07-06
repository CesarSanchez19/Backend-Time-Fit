import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const gymSchema = new Schema({
  name: String,
  address: {
    street: String,
    colony: String,
    Avenue: String,
    "C.P": String,
    City: String,
    State: String,
    Country: String
  },
  opening_time: String,
  closing_time: String,
  logo_url: { type: String, default: null },
}, { collection: 'gyms' });

export default model('Gym', gymSchema);
