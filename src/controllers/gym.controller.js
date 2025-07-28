import Gym from '../models/Gym.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';
import Client from '../models/Clients.js';
import Membership from '../models/Membership.js';
import Product from '../models/Product.js';
import ProductSale from '../models/ProductSale.js';
import Supplier from '../models/Supplier.js';
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

// Eliminar gimnasio por ID - VERSIÓN CORREGIDA
export const deleteGym = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'ID del gimnasio requerido' });

    // PASO 1: Verificar si el gimnasio tiene datos dependientes
    const [
      colaboratorsCount,
      clientsCount,
      membershipsCount,
      productsCount,
      salesCount,
      suppliersCount
    ] = await Promise.all([
      Colaborator.countDocuments({ gym_id: id }),
      Client.countDocuments({ gym_id: id }),
      Membership.countDocuments({ gym_id: id }),
      Product.countDocuments({ gym_id: id }),
      ProductSale.countDocuments({ gym_id: id }),
      Supplier.countDocuments({ gym_id: id })
    ]);

    // PASO 2: Calcular totales y crear mensaje detallado
    const totalDependencies = colaboratorsCount + clientsCount + membershipsCount + 
                            productsCount + salesCount + suppliersCount;

    if (totalDependencies > 0) {
      const dependencies = [];
      
      if (colaboratorsCount > 0) dependencies.push(`${colaboratorsCount} colaborador(es)`);
      if (clientsCount > 0) dependencies.push(`${clientsCount} cliente(s)`);
      if (membershipsCount > 0) dependencies.push(`${membershipsCount} membresía(s)`);
      if (productsCount > 0) dependencies.push(`${productsCount} producto(s)`);
      if (salesCount > 0) dependencies.push(`${salesCount} venta(s)`);
      if (suppliersCount > 0) dependencies.push(`${suppliersCount} proveedor(es)`);

      return res.status(400).json({
        message: `No se puede eliminar el gimnasio. Tiene los siguientes registros asociados: ${dependencies.join(', ')}. Primero debe eliminar todos estos registros.`,
        dependencies: {
          colaborators: colaboratorsCount,
          clients: clientsCount,
          memberships: membershipsCount,
          products: productsCount,
          sales: salesCount,
          suppliers: suppliersCount,
          total: totalDependencies
        }
      });
    }

    // PASO 3: Si no hay dependencias, proceder con la eliminación
    const deleted = await Gym.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Gimnasio no encontrado' });

    // PASO 4: Quitar la referencia del gimnasio en administradores (solo si se eliminó exitosamente)
    await Admin.updateMany({ gym_id: id }, { $unset: { gym_id: "" } });

    res.json({ 
      message: 'Gimnasio eliminado correctamente',
      gymName: deleted.name || 'Sin nombre'
    });
    
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};