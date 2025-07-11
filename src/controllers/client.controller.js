import Client from '../models/Clients.js';

// Crear cliente
export const createClient = async (req, res) => {
  try {
    const { id: colaborator_id, gym_id } = req.user;
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

    // Buscar si ya existe un cliente con ese email y una membresía activa en el mismo gimnasio
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

    // Crear nuevo cliente con membresía activa
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
      colaborator_id,
      gym_id
    });

    const saved = await newClient.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Obtener todos los clientes del gimnasio del colaborador
export const getAllClients = async (req, res) => {
  try {
    console.log('Usuario autenticado:', req.user); // <-- para verificar

    const { gym_id } = req.user;

    const clients = await Client.find({ gym_id })
      .populate('membership_id', 'name_membership price')
      .populate('colaborator_id', 'name last_name');

    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



// Obtener cliente por ID
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('membership_id', 'name_membership price')
      .populate('colaborator_id', 'name last_name');

    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(client);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Actualizar cliente
export const updateClient = async (req, res) => {
  try {
    const { id, ...dataToUpdate } = req.body;  // Obtener id y resto de campos
    if (!id) return res.status(400).json({ message: 'ID del cliente requerido' });

    // Actualiza el cliente con los campos que envíes
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
