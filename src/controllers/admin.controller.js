import Admin from "../models/Admin.js";
import Role from "../models/Role.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Función auxiliar para obtener el rol de administrador
const getAdminRoleId = async () => {
  const adminRole = await Role.findOne({ role_name: "Administrador" });
  if (!adminRole) {
    throw new Error("Rol de administrador no encontrado");
  }
  return adminRole._id;
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, name, last_name, email, password, admin_code, gym_id } = req.body;

    // Validar si ya existe el correo
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "El correo ya está registrado. Por favor, use otro correo.",
      });
    }

    // Validar si ya existe el nombre de usuario
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: "El nombre de usuario ya está en uso. Elija otro.",
      });
    }

    const rol_id = await getAdminRoleId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      name,
      last_name,
      email,
      password,
      admin_code,
      rol_id,
      gym_id: gym_id || null, // Puede ser null al registrarse
    });

    await admin.save();

    // Generar token
    const token = jwt.sign(
      {
        id: admin._id,
        role: "Administrador",
        gym_id: admin.gym_id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.status(201).json({
      message: "Administrador creado exitosamente",
      token,
      admin: {
        _id: admin._id,
        username: admin.username,
        name: admin.name,
        last_name: admin.last_name,
        email: admin.email,
        role: { role_name: "Administrador" },
        gym: admin.gym_id,
      },
    });
  } catch (err) {
    console.error("Error creando admin:", err);
    return res.status(500).json({ message: "Error al crear el administrador" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).populate("rol_id").populate("gym_id");

    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado o el correo electrónico no está registrado." });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ message: "La contraseña ingresada es incorrecta. Inténtalo nuevamente." });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.rol_id?.role_name || "unknown",
        gym_id: admin.gym_id?._id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      admin: {
        _id: admin._id,
        username: admin.username,
        name: admin.name,
        last_name: admin.last_name,
        email: admin.email,
        role: admin.rol_id,
        gym: admin.gym_id,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error del servidor" });
  }
};
