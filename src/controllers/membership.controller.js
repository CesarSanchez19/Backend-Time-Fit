import Membership from '../models/Membership.js';

// Obtener todas las memberships
export const getAllMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find().populate('gym_id', 'name');
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener membership por id (usando URL param)
export const getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id).populate('gym_id', 'name');
    if (!membership) return res.status(404).json({ message: 'Membresia no encontrada' });
    res.json(membership);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Crear membership
export const createMembership = async (req, res) => {
  try {
    const { name_membership, description, price, duration_days, period, status, gym_id } = req.body;

    const newMembership = new Membership({
      name_membership,
      description,
      price,
      duration_days,
      period,
      status,
      gym_id,
    });

    const saved = await newMembership.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Actualizar membership (recibiendo el ID en el body)
export const updateMembership = async (req, res) => {
  const { id, ...dataToUpdate } = req.body;
  if (!id) return res.status(400).json({ message: 'ID de la membresía requerido' });

  try {
    const updated = await Membership.findByIdAndUpdate(id, dataToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: 'Membresia no encontrada' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar membership (recibiendo el ID en el body)
export const deleteMembership = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: 'ID de la membresía requerido' });

  try {
    const deleted = await Membership.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Membresia no encontrada' });
    res.json({ message: 'Membresia eliminada correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
