import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const roleSchema = new Schema({
  role_name: { type: String, required: true },
  permissions: [String]
}, { collection: 'roles' });

export default model('Role', roleSchema);
