import Client from '../models/Clients.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';
import Membership from '../models/Membership.js';

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
      status,
      payment
    } = req.body;

    const existingClient = await Client.findOne({
      email,
      gym_id,
      status: 'Activo'
    });

    if (existingClient) {
      return res.status(400).json({
        message:
          'Este cliente ya tiene una membresía activa registrada en este gimnasio. Si desea cambiar de membresía, debe cancelar la actual primero.'
      });
    }

    const newClient = new Client({
      full_name,
      birth_date,
      email,
      phone,
      rfc,
      emergency_contact,
      membership_id,
      start_date,
      status,
      payment,
      registered_by_id: user_id,
      registered_by_type: role,
      gym_id
    });

    const saved = await newClient.save();
    res.status(201).json(saved);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtener todos los clientes con info de quien creó y actualizó
export const getAllClients = async (req, res) => {
  try {
    const { gym_id } = req.user;

    const clients = await Client.find({ gym_id })
      .populate('membership_id', 'name_membership price');

    const clientsWithRegistrarInfo = await Promise.all(
      clients.map(async (client) => {
        let registrar = null;
        let updater = null;

        if (client.registered_by_type === 'Administrador') {
          registrar = await Admin.findById(client.registered_by_id, 'name last_name');
        } else if (client.registered_by_type === 'Colaborador') {
          registrar = await Colaborator.findById(client.registered_by_id, 'name last_name');
        }

        if (client.updated_by_id && client.updated_by_type) {
          if (client.updated_by_type === 'Administrador') {
            updater = await Admin.findById(client.updated_by_id, 'name last_name');
          } else if (client.updated_by_type === 'Colaborador') {
            updater = await Colaborator.findById(client.updated_by_id, 'name last_name');
          }
        }

        return {
          ...client.toObject(),
          registered_by: {
            role: client.registered_by_type,
            name: registrar?.name || null,
            last_name: registrar?.last_name || null
          },
          updated_by: updater
            ? {
                role: client.updated_by_type,
                name: updater.name,
                last_name: updater.last_name
              }
            : null
        };
      })
    );

    res.json(clientsWithRegistrarInfo);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener cliente por ID con info completa
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('membership_id', 'name_membership price');

    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    let registrar = null;
    let updater = null;

    if (client.registered_by_type === 'Administrador') {
      registrar = await Admin.findById(client.registered_by_id, 'name last_name');
    } else if (client.registered_by_type === 'Colaborador') {
      registrar = await Colaborator.findById(client.registered_by_id, 'name last_name');
    }

    if (client.updated_by_id && client.updated_by_type) {
      if (client.updated_by_type === 'Administrador') {
        updater = await Admin.findById(client.updated_by_id, 'name last_name');
      } else if (client.updated_by_type === 'Colaborador') {
        updater = await Colaborator.findById(client.updated_by_id, 'name last_name');
      }
    }

    res.json({
      ...client.toObject(),
      registered_by: {
        role: client.registered_by_type,
        name: registrar?.name || null,
        last_name: registrar?.last_name || null
      },
      updated_by: updater
        ? {
            role: client.updated_by_type,
            name: updater.name,
            last_name: updater.last_name
          }
        : null
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar cliente guardando quién actualiza
export const updateClient = async (req, res) => {
  try {
    const { id, ...dataToUpdate } = req.body;
    if (!id) return res.status(400).json({ message: 'ID del cliente requerido' });

    // Registrar usuario que actualiza
    dataToUpdate.updated_by_id = req.user.id;
    dataToUpdate.updated_by_type = req.user.role;

    const updated = await Client.findByIdAndUpdate(id, dataToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar cliente
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'ID del cliente requerido' });

    const deleted = await Client.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
