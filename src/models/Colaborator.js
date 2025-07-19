// models/Colaborator.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema, model } = mongoose;

const colaboratorSchema = new Schema({
  username: String,
  name: String,
  last_name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  colaborator_code: { type: String, required: true },
  color: { type: String, default: 'Verde' },
  rol_id: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  gym_id: { type: Schema.Types.ObjectId, ref: 'Gym', required: true },
  working_hour: {
    days: [String],
    start_time: String,
    end_time: String,
  },
}, { timestamps: true, collection: 'colaborators' });

colaboratorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const hashed = await bcrypt.hash(this.password, 10);
    this.password = hashed;
    next();
  } catch (err) {
    next(err);
  }
});

export default model('Colaborator', colaboratorSchema);
