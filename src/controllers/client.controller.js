import Client from '../models/Clients.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';
import Membership from '../models/Membership.js';

/**
 * Recalcula el porcentaje de uso de todas las membresías de un gym
 */
async function recalculateUsagePercentages(gym_id) {
  try {
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
  } catch (error) {
    console.error('Error recalculando porcentajes:', error);
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

    // Validaciones básicas
    if (!email || !membership_id || !gym_id) {
      return res.status(400).json({
        message: 'Email, membership_id y gym_id son requeridos'
      });
    }

    // Validación de cliente activo existente
    const existingClient = await Client.findOne({ 
      email, 
      gym_id, 
      status: 'Activo' 
    });
    
    if (existingClient) {
      return res.status(400).json({
        message: 'Este cliente ya tiene una membresía activa registrada en este gimnasio'
      });
    }

    // Verificar que la membresía existe y pertenece al mismo gym
    const membership = await Membership.findOne({ 
      _id: membership_id, 
      gym_id 
    });
    
    if (!membership) {
      return res.status(400).json({
        message: 'Membresía no encontrada o no pertenece a este gimnasio'
      });
    }

    // Crear nuevo cliente
    const newClient = new Client({
      full_name,
      birth_date,
      email,
      phone,
      rfc,
      emergency_contact,
      membership_id,
      start_date,
      end_date,
      status: status || 'Activo',
      payment,
      registered_by_id: user_id,
      registered_by_type: role,
      gym_id
    });

    const saved = await newClient.save();

    // Incrementar cantidad_usuarios en la membresía seleccionada
    await Membership.updateOne(
      { _id: membership_id },
      { $inc: { cantidad_usuarios: 1 } }
    );

    // Recalcular porcentaje_uso para todas las membresías de este gym
    await recalculateUsagePercentages(gym_id);

    return res.status(201).json(saved);

  } catch (err) {
    console.error('Error creando cliente:', err);
    return res.status(400).json({ error: err.message });
  }
};

// Obtener todos los clientes
export const getAllClients = async (req, res) => {
  try {
    const { gym_id } = req.user;
    
    if (!gym_id) {
      return res.status(400).json({ error: 'gym_id no encontrado en el token' });
    }

    const clients = await Client.find({ gym_id })
      .populate('membership_id', 'name_membership price')
      .sort({ createdAt: -1 }); // Ordenar por más recientes primero

    // Mapear información adicional
    const clientsWithRegistrarInfo = await Promise.all(
      clients.map(async client => {
        try {
          const clientObj = client.toObject();
          
          // Buscar información de quien registró
          if (clientObj.registered_by_id && clientObj.registered_by_type) {
            let registeredByInfo = null;
            
            if (clientObj.registered_by_type === 'Administrador') {
              registeredByInfo = await Admin.findById(clientObj.registered_by_id, 'name last_name');
            } else if (clientObj.registered_by_type === 'Colaborador') {
              registeredByInfo = await Colaborator.findById(clientObj.registered_by_id, 'name last_name');
            }
            
            if (registeredByInfo) {
              clientObj.registered_by_name = `${registeredByInfo.name || ''} ${registeredByInfo.last_name || ''}`.trim();
            }
          }

          // Buscar información de quien actualizó (si existe)
          if (clientObj.updated_by_id && clientObj.updated_by_type) {
            let updatedByInfo = null;
            
            if (clientObj.updated_by_type === 'Administrador') {
              updatedByInfo = await Admin.findById(clientObj.updated_by_id, 'name last_name');
            } else if (clientObj.updated_by_type === 'Colaborador') {
              updatedByInfo = await Colaborator.findById(clientObj.updated_by_id, 'name last_name');
            }
            
            if (updatedByInfo) {
              clientObj.updated_by_name = `${updatedByInfo.name || ''} ${updatedByInfo.last_name || ''}`.trim();
            }
          }

          // Agregar información de la membresía
          if (clientObj.membership_id) {
            clientObj.membership_type = clientObj.membership_id.name_membership || 'N/A';
            clientObj.membership_price = clientObj.membership_id.price || 0;
          }

          return clientObj;
        } catch (error) {
          console.error('Error procesando cliente:', client._id, error);
          return client.toObject();
        }
      })
    );

    return res.json(clientsWithRegistrarInfo);
  } catch (error) {
    console.error('Error en getAllClients:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Obtener cliente por ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const { gym_id } = req.user;
    
    if (!gym_id) {
      return res.status(400).json({ error: 'gym_id no encontrado en el token' });
    }
    
    const client = await Client.findOne({ _id: id, gym_id })
      .populate('membership_id', 'name_membership price duration_days');
    
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    return res.json(client);
  } catch (error) {
    console.error('Error en getClientById:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Actualizar cliente
export const updateClient = async (req, res) => {
  try {
    const { id, membership_id: newMembershipId, ...dataToUpdate } = req.body;
    const { gym_id } = req.user;
    
    if (!id) {
      return res.status(400).json({ message: 'ID del cliente requerido' });
    }

    // Registrar usuario que actualiza
    dataToUpdate.updated_by_id = req.user.id;
    dataToUpdate.updated_by_type = req.user.role;

    // 1) Recuperar cliente antiguo
    const oldClient = await Client.findOne({ _id: id, gym_id });
    if (!oldClient) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const oldMembershipId = oldClient.membership_id.toString();

    // 2) Si hay nueva membresía, verificar que existe y pertenece al gym
    if (newMembershipId && newMembershipId !== oldMembershipId) {
      const membership = await Membership.findOne({ 
        _id: newMembershipId, 
        gym_id 
      });
      
      if (!membership) {
        return res.status(400).json({
          message: 'Nueva membresía no encontrada o no pertenece a este gimnasio'
        });
      }
    }

    // 3) Actualizar el cliente
    const updateData = { 
      ...dataToUpdate, 
      ...(newMembershipId && { membership_id: newMembershipId }) 
    };

    const updated = await Client.findOneAndUpdate(
      { _id: id, gym_id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Cliente no encontrado al actualizar' });
    }

    // 4) Si cambió membership_id: actualizar contadores
    if (newMembershipId && newMembershipId !== oldMembershipId) {
      // Decrementar antigua membresía
      await Membership.updateOne(
        { _id: oldMembershipId },
        { $inc: { cantidad_usuarios: -1 } }
      );
      
      // Incrementar nueva membresía
      await Membership.updateOne(
        { _id: newMembershipId },
        { $inc: { cantidad_usuarios: 1 } }
      );

      // Recalcular porcentajes
      await recalculateUsagePercentages(gym_id);
    }

    return res.json(updated);

  } catch (err) {
    console.error('Error actualizando cliente:', err);
    return res.status(400).json({ error: err.message });
  }
};

// Eliminar cliente
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.body;
    const { gym_id } = req.user;
    
    if (!id) {
      return res.status(400).json({ message: 'ID del cliente requerido' });
    }

    // 1) Recuperar cliente para saber qué membresía tenía
    const clientToDelete = await Client.findOne({ _id: id, gym_id });
    if (!clientToDelete) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const membershipId = clientToDelete.membership_id.toString();

    // 2) Eliminar el cliente
    await Client.findOneAndDelete({ _id: id, gym_id });

    // 3) Decrementar cantidad_usuarios en esa membresía
    await Membership.updateOne(
      { _id: membershipId },
      { $inc: { cantidad_usuarios: -1 } }
    );

    // 4) Recalcular porcentaje_uso para todas las membresías del gym
    await recalculateUsagePercentages(gym_id);

    return res.json({ message: 'Cliente eliminado correctamente' });

  } catch (err) {
    console.error('Error eliminando cliente:', err);
    return res.status(400).json({ error: err.message });
  }
};