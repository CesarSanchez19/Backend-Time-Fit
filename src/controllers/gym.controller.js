import Gym from '../models/Gym.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';
import { resizeBase64Image } from '../libs/resizeImage.js';

// Crear gym y asociarlo al admin (solo uno por admin)
export const createGym = async (req, res) => {
  try {
    const { name, address, opening_time, closing_time, logo_url } = req.body;
    const { id: adminId } = req.user;

    const admin = await Admin.findById(adminId);

    if (!admin) return res.status(404).json({ message: 'Administrador no encontrado' });

    // Validar si ya tiene un gimnasio asignado
    if (admin.gym_id) {
      return res.status(400).json({ message: 'Este administrador ya tiene un gimnasio asignado' });
    }

    // Reducir imagen antes de guardar
    const compressedLogo = await resizeBase64Image(logo_url);

    const newGym = new Gym({
      name,
      address,
      opening_time,
      closing_time,
      logo_url: compressedLogo,
    });

    const savedGym = await newGym.save();
    admin.gym_id = savedGym._id;
    await admin.save();

    res.status(201).json(savedGym);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtener todos los gimnasios (solo admin)
export const getAllGyms = async (req, res) => {
  try {
    const gyms = await Gym.find();
    res.json(gyms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener el gimnasio asignado al usuario actual (admin o colaborador)
export const getMyGym = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let gymId = null;

    if (role === 'Administrador') {
      const admin = await Admin.findById(userId);
      if (!admin || !admin.gym_id) {
        return res.status(404).json({ message: 'Este administrador no tiene gimnasio asignado' });
      }
      gymId = admin.gym_id;
    } else if (role === 'Colaborador') {
      const colaborator = await Colaborator.findById(userId);
      if (!colaborator || !colaborator.gym_id) {
        return res.status(404).json({ message: 'Este colaborador no tiene gimnasio asignado' });
      }
      gymId = colaborator.gym_id;
    } else {
      return res.status(403).json({ message: 'Rol no autorizado para acceder a gimnasio' });
    }

    const gym = await Gym.findById(gymId);
    if (!gym) return res.status(404).json({ message: 'Gimnasio no encontrado' });

    res.json(gym);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Actualizar gimnasio por ID
export const updateGym = async (req, res) => {
  try {
    const { id, ...dataToUpdate } = req.body;
    if (!id) return res.status(400).json({ message: 'ID del gimnasio requerido' });

    const updated = await Gym.findByIdAndUpdate(id, dataToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: 'Gimnasio no encontrado' });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar gimnasio por ID
export const deleteGym = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'ID del gimnasio requerido' });

    const deleted = await Gym.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Gimnasio no encontrado' });

    // ⚠️ Quitar la referencia del gimnasio en administradores y colaboradores
    await Admin.updateMany({ gym_id: id }, { $unset: { gym_id: "" } });
    await Colaborator.updateMany({ gym_id: id }, { $unset: { gym_id: "" } });

    res.json({ message: 'Gimnasio y referencias eliminados correctamente' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
