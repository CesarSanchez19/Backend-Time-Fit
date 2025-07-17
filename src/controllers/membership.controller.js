import Membership from '../models/Membership.js';

// Obtener todas las memberships
export const getAllMemberships = async (req, res) => {
  try {
    // Si tiene gym_id, filtramos; si no, devolvemos todo o vacío según tu preferencia
    const filter = {};
    if (req.user.gym_id) {
      filter.gym_id = req.user.gym_id;
    }
    const memberships = await Membership.find(filter).populate('gym_id','name');
    return res.json(memberships);
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
    const {
      name_membership,
      description,
      price,
      duration_days,
      period,
      status,
      currency,
      color,
      cantidad_usuarios,
      porcentaje_uso,
      gym_id
    } = req.body;

    if (!gym_id) {
      return res.status(400).json({
        message: 'Para crear una membresía, primero debe registrar un gimnasio y asignarlo a su cuenta de administrador.',
      });
    }

    const newMembership = new Membership({
      name_membership,
      description,
      price,
      duration_days,
      period,
      status,
      currency,
      color,
      cantidad_usuarios,
      porcentaje_uso,
      gym_id
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
      runValidators: true
    });

    if (!updated) return res.status(404).json({ message: 'Membresía no encontrada' });
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
