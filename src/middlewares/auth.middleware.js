// middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';   // <--- usa el mismo

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET); // <--- unificado
    req.user = decoded; // { id, role, gym_id }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};
