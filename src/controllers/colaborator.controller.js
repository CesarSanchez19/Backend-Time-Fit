import { createAccessToken } from "../libs/jwt.js";
import Colaborator from "../models/Colaborator.js";
import Role from "../models/Role.js";
import bcrypt from "bcrypt";

// Ya definidos:
const getColaboratorRoleId = async () => {
  const role = await Role.findOne({ role_name: "Colaborador" });
  if (!role) throw new Error("Rol de colaborador no encontrado");
  return role._id;
};

// ✅ Crear colaborador (solo admin)
export const registerColaborator = async (req, res) => {
  
  try {
    const { username, name, last_name, email, password, working_hour, color, colaborator_code } = req.body;
    const gym_id = req.user.gym_id;

    if (!gym_id) {
      return res.status(400).json({ message: "El administrador no tiene un gimnasio asignado." });
    }

    const existsEmail = await Colaborator.findOne({ email });
    if (existsEmail) return res.status(400).json({ message: "Correo ya en uso." });

    const existsUser = await Colaborator.findOne({ username });
    if (existsUser) return res.status(400).json({ message: "Nombre de usuario ya en uso." });

    const rol_id = await getColaboratorRoleId();

    const colaborator = new Colaborator({
      username,
      name,
      last_name,
      email,
      password,
      color,
      colaborator_code: colaborator_code,  
      rol_id,
      gym_id,
      working_hour,
    });

    await colaborator.save();

    const token = await createAccessToken({
      id: colaborator._id,
      role: "Colaborador",
      gym_id,
    });

    res.cookie("token", token);

    res.status(201).json({
      message: "Colaborador creado",
      token,
      colaborator: {
        _id: colaborator._id,
        username,
        name,
        last_name,
        email,
        role: { role_name: "Colaborador" },
        gym: gym_id,
        color,
        colaborator_code,
        working_hour,
      },
    });
  } catch (err) {
    console.error("Error registrando colaborador:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


export const loginColaborator = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1) Buscamos el colaborador y poblamos rol_id y gym_id
    const colaborator = await Colaborator
      .findOne({ email })
      .populate("rol_id")   // trae role_name + permissions
      .populate("gym_id");  // trae gym._id + name

    if (!colaborator) {
      return res.status(404).json({ message: "Colaborador no encontrado." });
    }

    // 2) Verificamos contraseña
    const isMatch = await bcrypt.compare(password, colaborator.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta." });
    }

    // 3) Creamos el payload del JWT con role_name, permissions y gym_id
    const payload = {
      id: colaborator._id.toString(),
      role: colaborator.rol_id.role_name,
      permissions: colaborator.rol_id.permissions,
      gym_id: colaborator.gym_id?._id?.toString() || null
    };
    const token = await createAccessToken(payload);

    // 4) Enviamos respuesta con token + user
    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        _id: colaborator._id,
        username: colaborator.username,
        name: colaborator.name,
        last_name: colaborator.last_name,
        email: colaborator.email,
        colaborator_code: colaborator.colaborator_code,
        color: colaborator.color,
        role: {
          _id: colaborator.rol_id._id,
          role_name: colaborator.rol_id.role_name,
          permissions: colaborator.rol_id.permissions
        },
        gym_id: colaborator.gym_id?._id || null,
        working_hour: colaborator.working_hour,
        createdAt: colaborator.createdAt,
        updatedAt: colaborator.updatedAt
      }
    });
  } catch (err) {
    console.error("Error en login colaborador:", err);
    return res.status(500).json({ message: "Error del servidor" });
  }
};

// ✅ Obtener perfil del colaborador autenticado
export const getMyColaboratorProfile = async (req, res) => {
  try {
    const colaborator = await Colaborator.findById(req.user.id).populate("rol_id").populate("gym_id");
    if (!colaborator) return res.status(404).json({ message: "Colaborador no encontrado" });
    res.json(colaborator);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Obtener todos los colaboradores (solo admin)
export const getAllColaborators = async (req, res) => {
  try {
    const gymId = req.user.gym_id;
    const colaboradores = await Colaborator.find({ gym_id: gymId }).populate("rol_id").populate("gym_id");
    res.json(colaboradores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Actualizar colaborador por ID (solo admin)
export const updateColaborator = async (req, res) => {
  try {
    const { id, ...dataToUpdate } = req.body;
    if (!id) return res.status(400).json({ message: "ID requerido" });

    // Si incluye contraseña nueva, encripta antes de guardar
    if (dataToUpdate.password) {
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
    }

    const updated = await Colaborator.findByIdAndUpdate(id, dataToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Colaborador no encontrado" });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// ✅ Eliminar colaborador por ID (solo admin)
export const deleteColaborator = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "ID requerido" });

    const deleted = await Colaborator.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Colaborador no encontrado" });

    res.json({ message: "Colaborador eliminado correctamente" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Obtener colaborador específico por ID (solo si pertenece al mismo gimnasio que el admin)
export const getColaboratorById = async (req, res) => {
  try {
    const { id } = req.params;
    const adminGymId = req.user.gym_id; // string

    if (!id) return res.status(400).json({ message: "ID requerido" });

    const colaborator = await Colaborator.findById(id)
      .populate("rol_id")
      .populate("gym_id");

    if (!colaborator) 
      return res.status(404).json({ message: "Colaborador no encontrado" });

    // Extrae correctamente el ID del gym del colaborador
    const colaboratorGymId = colaborator.gym_id._id
      ? colaborator.gym_id._id.toString()
      : colaborator.gym_id.toString();

    if (colaboratorGymId !== adminGymId.toString()) {
      return res.status(403).json({ message: "No tienes permiso para ver este colaborador" });
    }

    res.json(colaborator);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

