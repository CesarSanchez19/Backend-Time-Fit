import { createAccessToken } from "../libs/jwt.js";
import Admin from "../models/Admin.js";
import Role from "../models/Role.js";
import bcrypt from "bcrypt";

// Función auxiliar
const getAdminRoleId = async () => {
  const adminRole = await Role.findOne({ role_name: "Administrador" });
  if (!adminRole) throw new Error("Rol de administrador no encontrado");
  return adminRole._id;
};

// REGISTRO
export const registerAdmin = async (req, res) => {
  try {
    const { username, name, last_name, email, password, admin_code, gym_id } = req.body;

    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "El correo ya está registrado." });

    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "El nombre de usuario ya está en uso." });

    const rol_id = await getAdminRoleId();

    const admin = new Admin({
      username,
      name,
      last_name,
      email,
      password,
      admin_code,
      rol_id,
      gym_id: gym_id || null,
    });

    await admin.save();

    const token = await createAccessToken({
      id: admin._id,
      role: "Administrador",
      gym_id: admin.gym_id || null,
    });

    res.cookie("token", token);

    return res.status(201).json({
      message: "Administrador creado exitosamente",
      token,
      admin: {
        _id: admin._id,
        username,
        name,
        last_name,
        email,
        role: { role_name: "Administrador" },
        gym: admin.gym_id,
      },
    });
  } catch (err) {
    console.error("Error creando admin:", err);
    return res.status(500).json({ message: "Error al crear el administrador" });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin
      .findOne({ email })
      .populate("rol_id")   // trae role_name + permissions
      .populate("gym_id");  // trae gym._id + name

    if (!admin) 
      return res.status(404).json({ message: "Administrador no encontrado" });

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) 
      return res.status(401).json({ message: "Contraseña incorrecta" });

    // 1) Creamos el payload del JWT con role_name, permissions y gym_id
    const payload = {
      id: admin._id.toString(),
      role: admin.rol_id.role_name,           // "Administrador"
      permissions: admin.rol_id.permissions,  // [ "view_clients", ... ]
      gym_id: admin.gym_id?._id?.toString() || null
    };
    const token = await createAccessToken(payload);

    // 2) Respondemos token + user (con la forma que espera el frontend)
    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        _id: admin._id,
        username: admin.username,
        name: admin.name,
        last_name: admin.last_name,
        email: admin.email,
        role: {
          _id: admin.rol_id._id,
          role_name: admin.rol_id.role_name,
          permissions: admin.rol_id.permissions
        },
        gym_id: admin.gym_id?._id || null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error del servidor" });
  }
};


// OBTENER TODOS LOS ADMINISTRADORES
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().populate("rol_id", "role_name").populate("gym_id", "name");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ACTUALIZAR ADMIN
export const updateAdmin = async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ message: "ID del administrador requerido" });

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updated = await Admin.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("rol_id", "role_name")
      .populate("gym_id", "name");

    if (!updated) return res.status(404).json({ message: "Administrador no encontrado" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ELIMINAR ADMIN
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "ID requerido" });

    const deleted = await Admin.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Administrador no encontrado" });

    res.json({ message: "Administrador eliminado correctamente" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtener perfil del administrador actual (desde el token)
export const getMyProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).populate("rol_id", "role_name").populate("gym_id", "name");

    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    res.json({
      _id: admin._id,
      username: admin.username,
      name: admin.name,
      last_name: admin.last_name,
      email: admin.email,
      role: admin.rol_id,
      gym: admin.gym_id,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
