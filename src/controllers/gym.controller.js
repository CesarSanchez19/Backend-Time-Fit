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

