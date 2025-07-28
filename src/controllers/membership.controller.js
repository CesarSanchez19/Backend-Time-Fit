import Membership from '../models/Membership.js';
import Client from '../models/Clients.js';

// Obtener todas las memberships
export const getAllMemberships = async (req, res) => {
  try {
    const filter = { gym_id: req.user.gym_id }; // <--- scope
    const memberships = await Membership.find(filter)
      .populate('gym_id', 'name');
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener membership por id (usando URL param)
export const getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findOne({
      _id: req.params.id,
      gym_id: req.user.gym_id, // <--- scope
    }).populate('gym_id', 'name');

    if (!membership) {
      return res.status(404).json({ message: 'Membresía no encontrada en tu gimnasio' });
    }
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
      // gym_id  <-- ignorado
    } = req.body;

    if (!req.user.gym_id) {
      return res.status(400).json({
        message: 'Tu usuario no tiene un gimnasio asignado. No puedes crear membresías.',
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
      gym_id: req.user.gym_id, // <--- forzado
    });

    const saved = await newMembership.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Actualizar membership (recibiendo el ID en el body)
export const updateMembership = async (req, res) => {
  const { id, gym_id, ...dataToUpdate } = req.body; // gym_id ignorado
  if (!id) return res.status(400).json({ message: 'ID de la membresía requerido' });

  try {
    const updated = await Membership.findOneAndUpdate(
      { _id: id, gym_id: req.user.gym_id }, // <--- scope
      dataToUpdate,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Membresía no encontrada en tu gimnasio' });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar membership (recibiendo el ID en el body) - VERSIÓN CORREGIDA
export const deleteMembership = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ message: 'ID de la membresía requerido' });

  try {
    // PASO 1: Verificar si existen clientes usando esta membresía
    const clientsUsingMembership = await Client.countDocuments({
      membership_id: id,
      gym_id: req.user.gym_id
    });

    // PASO 2: Si hay clientes usando la membresía, no permitir eliminación
    if (clientsUsingMembership > 0) {
      return res.status(400).json({
        message: `No se puede eliminar la membresía. Hay ${clientsUsingMembership} cliente(s) que la están usando. Primero debe reasignar o eliminar estos clientes.`,
        clientCount: clientsUsingMembership
      });
    }

    // PASO 3: Si no hay clientes, proceder con la eliminación normal
    const deleted = await Membership.findOneAndDelete({
      _id: id,
      gym_id: req.user.gym_id, // <--- scope
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Membresía no encontrada en tu gimnasio' });
    }

    res.json({ message: 'Membresía eliminada correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};