import { createAccessToken } from "../libs/jwt.js";
import Colaborator from "../models/Colaborator.js";
import Role from "../models/Role.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Ya definidos:
const getColaboratorRoleId = async () => {
  const role = await Role.findOne({ role_name: "Colaborador" });
  if (!role) throw new Error("Rol de colaborador no encontrado");
  return role._id;
};

const generateColaboratorCode = (name, last_name) => {
  const initials = (
    last_name.trim().split(" ")[0].charAt(0) +
    last_name.trim().split(" ")[1]?.charAt(0) +
    name.trim().split(" ")[0].charAt(0) +
    name.trim().split(" ")[1]?.charAt(0)
  ).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${initials}${random}`;
};

// ✅ Crear colaborador (solo admin)
export const registerColaborator = async (req, res) => {
  try {
    const { username, name, last_name, email, password, working_hour } = req.body;
    const gym_id = req.user.gym_id;

    if (!gym_id) {
      return res.status(400).json({ message: "El administrador no tiene un gimnasio asignado." });
    }

    const existsEmail = await Colaborator.findOne({ email });
    if (existsEmail) return res.status(400).json({ message: "Correo ya en uso." });

    const existsUser = await Colaborator.findOne({ username });
    if (existsUser) return res.status(400).json({ message: "Nombre de usuario ya en uso." });

    const rol_id = await getColaboratorRoleId();
    const colaborator_code = generateColaboratorCode(name, last_name);

    const colaborator = new Colaborator({
      username,
      name,
      last_name,
      email,
      password,
      colaborator_code,
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
        working_hour,
      },
    });
  } catch (err) {
    console.error("Error registrando colaborador:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ✅ Login colaborador (ya lo tienes)
export const loginColaborator = async (req, res) => {
  try {
    const { email, password } = req.body;
    const colaborator = await Colaborator.findOne({ email }).populate("rol_id").populate("gym_id");
    if (!colaborator) return res.status(404).json({ message: "Colaborador no encontrado." });

    const isMatch = await bcrypt.compare(password, colaborator.password);
    if (!isMatch) return res.status(401).json({ message: "Contraseña incorrecta." });

    const token = await createAccessToken({
      id: colaborator._id,
      role: colaborator.rol_id.role_name,
      gym_id: colaborator.gym_id?._id || null,
    });
    
    res.cookie("token", token);

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      colaborator: {
        _id: colaborator._id,
        username: colaborator.username,
        name: colaborator.name,
        last_name: colaborator.last_name,
        email: colaborator.email,
        role: colaborator.rol_id,
        gym: colaborator.gym_id,
        working_hour: colaborator.working_hour,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error del servidor" });
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
