import Gym from '../models/Gym.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcrypt';

export const getGyms = async (req, res) => {
  try {
    const gyms = await Gym.find();
    res.status(200).json(gyms);
  } catch (err) {
    console.error('Error al obtener gimnasios:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const createGym = async (req, res) => {
  try {
    const existing = await Gym.findOne({ name: req.body.name });
    if (existing) {
      return res.status(400).json({ message: 'Este gimnasio ya existe' });
    }

    const newGym = new Gym(req.body);
    await newGym.save();

    res.status(201).json({
      message: 'Gimnasio creado exitosamente',
      gym: newGym,
    });
  } catch (err) {
    console.error('Error creando gimnasio:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const registerGymAndAssignAdmin = async (req, res) => {
  const {
    username,
    name,
    last_name,
    email,
    password,
    admin_code,
    rol_id,
    gym: gymData // gym: { name, address, opening_time, closing_time, logo_url }
  } = req.body;

  try {
    // Validar que no exista admin con el mismo email
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Validar que no exista gym con ese nombre
    let gym = await Gym.findOne({ name: gymData.name });
    if (gym) {
      return res.status(400).json({ message: 'El gimnasio ya existe' });
    }

    // Crear nuevo gimnasio (logo_url puede ser null o vacío)
    if (!gymData.logo_url) {
      gymData.logo_url = null;
    }
    gym = new Gym(gymData);
    await gym.save();

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo admin con gym_id creado
    const admin = new Admin({
      username,
      name,
      last_name,
      email,
      password: hashedPassword,
      admin_code,
      rol_id,
      gym_id: gym._id
    });

    await admin.save();

    res.status(201).json({
      message: 'Administrador y gimnasio registrados exitosamente',
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        last_name: admin.last_name,
        email: admin.email,
        rol_id: admin.rol_id,
        gym_id: admin.gym_id
      },
      gym
    });
  } catch (err) {
    console.error('Error registrando admin y gym:', err);
    res.status(500).json({ message: 'Error al registrar el administrador y el gimnasio' });
  }
};
