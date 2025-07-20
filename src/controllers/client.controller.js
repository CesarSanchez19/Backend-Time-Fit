// src/controllers/client.controller.js

import Client from '../models/Clients.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';
import Membership from '../models/Membership.js';  // <-- Importamos el modelo de membresía

/**
 * Recalcula el porcentaje de uso de todas las membresías de un gym
 */
async function recalculateUsagePercentages(gym_id) {
  // Traer todas las membresías de este gimnasio
  const all = await Membership.find({ gym_id });
  // Sumar usuarios totales
  const totalUsers = all.reduce((sum, m) => sum + (m.cantidad_usuarios || 0), 0);

  // Preparar operaciones bulk para actualizar porcentaje_uso
  const bulkOps = all.map(m => ({
    updateOne: {
      filter: { _id: m._id },
      update: {
        porcentaje_uso: totalUsers > 0
          ? Math.round((m.cantidad_usuarios / totalUsers) * 100)
          : 0
      }
    }
  }));

  if (bulkOps.length) {
    await Membership.bulkWrite(bulkOps);
  }
}

// Crear cliente
export const createClient = async (req, res) => {
  try {
    const { id: user_id, gym_id, role } = req.user;
    const {
      full_name,
      birth_date,
      email,
      phone,
      rfc,
      emergency_contact,
      membership_id,
      start_date,
      end_date,
      status,
      payment
    } = req.body;

    // Validación de cliente activo existente...
    const existingClient = await Client.findOne({ email, gym_id, status: 'Activo' });
    if (existingClient) {
      return res.status(400).json({
        message: 'Este cliente ya tiene una membresía activa registrada en este gimnasio...'
      });
    }

    // Guardar nuevo cliente
    const newClient = new Client({
      full_name, birth_date, email, phone, rfc,
      emergency_contact, membership_id, start_date, end_date,
      status, payment,
      registered_by_id: user_id,
      registered_by_type: role,
      gym_id
    });
    const saved = await newClient.save();

    // **1) Incrementar cantidad_usuarios en la membresía seleccionada**
    await Membership.updateOne(
      { _id: membership_id },
      { $inc: { cantidad_usuarios: 1 } }
    );

    // **2) Recalcular porcentaje_uso para todas las membresías de este gym**
    await recalculateUsagePercentages(gym_id);

    return res.status(201).json(saved);

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Obtener todos los clientes (no cambia)
export const getAllClients = async (req, res) => {
  try {
    const { gym_id } = req.user;
    const clients = await Client.find({ gym_id })
      .populate('membership_id', 'name_membership price');

    // Mapear registered_by / updated_by...
    const clientsWithRegistrarInfo = await Promise.all(
      clients.map(async client => {
        // ... mismo código de before ...
        // (omito por brevedad, se mantiene idéntico)
      })
    );

    return res.json(clientsWithRegistrarInfo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener cliente por ID (no cambia)
export const getClientById = async (req, res) => {
  // ... mantenemos idéntico ...
};

// Actualizar cliente guardando quién actualiza
export const updateClient = async (req, res) => {
  try {
    const { id, membership_id: newMembershipId, ...dataToUpdate } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'ID del cliente requerido' });
    }

    // Registrar usuario que actualiza
    dataToUpdate.updated_by_id = req.user.id;
    dataToUpdate.updated_by_type = req.user.role;

    // 1) Recuperar cliente antiguo para ver si cambia de membresía
    const oldClient = await Client.findById(id);
    if (!oldClient) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    const oldMembershipId = oldClient.membership_id.toString();

    // 2) Actualizar el cliente
    const updated = await Client.findByIdAndUpdate(
      id,
      { ...dataToUpdate, ...(newMembershipId && { membership_id: newMembershipId }) },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Cliente no encontrado al actualizar' });
    }

    // 3) Si cambió membership_id: decrementar la antigua e incrementar la nueva
    if (newMembershipId && newMembershipId !== oldMembershipId) {
      // decrementar antigua
      await Membership.updateOne(
        { _id: oldMembershipId },
        { $inc: { cantidad_usuarios: -1 } }
      );
      // incrementar nueva
      await Membership.updateOne(
        { _id: newMembershipId },
        { $inc: { cantidad_usuarios: 1 } }
      );
    }

    // 4) Recalcular porcentaje_uso para todas las membresías del gym
    await recalculateUsagePercentages(req.user.gym_id);

    return res.json(updated);

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Eliminar cliente
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'ID del cliente requerido' });
    }

    // 1) Recuperar cliente para saber qué membresía tenía
    const clientToDelete = await Client.findById(id);
    if (!clientToDelete) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    const membershipId = clientToDelete.membership_id.toString();
    const gym_id = clientToDelete.gym_id;

    // 2) Eliminar el cliente
    await Client.findByIdAndDelete(id);

    // 3) Decrementar cantidad_usuarios en esa membresía
    await Membership.updateOne(
      { _id: membershipId },
      { $inc: { cantidad_usuarios: -1 } }
    );

    // 4) Recalcular porcentaje_uso para todas las membresías del gym
    await recalculateUsagePercentages(gym_id);

    return res.json({ message: 'Cliente eliminado correctamente' });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
