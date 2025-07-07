import Colaborator from "../models/Colaborator.js";
import Role from "../models/Role.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Obtener el rol de colaborador
const getColaboratorRoleId = async () => {
  const role = await Role.findOne({ role_name: "Colaborador" });
  if (!role) throw new Error("Rol de colaborador no encontrado");
  return role._id;
};

// Generar código único del colaborador
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

export const registerColaborator = async (req, res) => {
  try {
    const { username, name, last_name, email, password, gym_id, working_hour } = req.body;

    if (!gym_id) {
      return res.status(400).json({ message: "El campo gym_id es obligatorio para colaboradores." });
    }

    const existingEmail = await Colaborator.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Este correo ya está en uso." });

    const existingUsername = await Colaborator.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Este nombre de usuario ya está en uso." });

    const rol_id = await getColaboratorRoleId();
    const colaborator_code = generateColaboratorCode(name, last_name);

    // 👉 No encriptamos manualmente aquí. Deja que el esquema lo haga.
    const colaborator = new Colaborator({
      username,
      name,
      last_name,
      email,
      password, // sin hash aquí
      colaborator_code,
      rol_id,
      gym_id,
      working_hour,
    });

    await colaborator.save();

    const token = jwt.sign(
      {
        id: colaborator._id,
        role: "Colaborador",
        gym_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.status(201).json({
      message: "Colaborador registrado exitosamente",
      token,
      colaborator: {
        _id: colaborator._id,
        username: colaborator.username,
        name: colaborator.name,
        last_name: colaborator.last_name,
        email: colaborator.email,
        role: { role_name: "Colaborador" },
        gym: colaborator.gym_id,
        working_hour: colaborator.working_hour,
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

    const colaborator = await Colaborator.findOne({ email }).populate("rol_id").populate("gym_id");

    if (!colaborator) {
      return res.status(404).json({ message: "Colaborador no encontrado o correo inválido." });
    }

    const isMatch = await bcrypt.compare(password, colaborator.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña incorrecta." });
    }

    const token = jwt.sign(
      {
        id: colaborator._id,
        role: colaborator.rol_id.role_name,
        gym_id: colaborator.gym_id?._id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

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
    console.error("Error en login colaborador:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};
