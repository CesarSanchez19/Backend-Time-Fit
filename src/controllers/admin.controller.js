import Admin from "../models/Admin.js";
import Gym from "../models/Gym.js";
import Role from "../models/Role.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Helper para obtener id de rol "Administrador"
export const registerWithGym = async (req, res) => {
  try {
    const {
      username,
      name,
      last_name,
      email,
      password,
      admin_code,
      gym: gymData, // gym: { name, address, opening_time, closing_time, logo_url }
    } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    let gym = await Gym.findOne({ name: gymData.name });

    if (!gym) {
      gym = new Gym(gymData);
      await gym.save();
    }

    const rol_id = await getAdminRoleId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      name,
      last_name,
      email,
      password: hashedPassword,
      admin_code,
      rol_id,
      gym_id: gym._id,
    });

    await admin.save();

    return res.status(201).json({
      message: "Administrador y gimnasio registrados exitosamente",
      admin: {
        _id: admin._id,
        username: admin.username,
        name: admin.name,
        last_name: admin.last_name,
        email: admin.email,
        rol_id: admin.rol_id,
        gym_id: admin.gym_id,
      },
      gym,
    });
  } catch (err) {
    console.error("Error en registerWithGym:", err);
    return res.status(500).json({ message: "Error al registrar administrador y gimnasio" });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, name, last_name, email, password, admin_code, gym_id } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const rol_id = await getAdminRoleId();
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      name,
      last_name,
      email,
      password: hashedPassword,
      admin_code,
      rol_id,
      gym_id,
    });

    await admin.save();

    return res.status(201).json({
      message: "Administrador creado exitosamente",
      admin: {
        _id: admin._id,
        username: admin.username,
        name: admin.name,
        last_name: admin.last_name,
        email: admin.email,
        rol_id: admin.rol_id,
        gym_id: admin.gym_id,
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
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
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
