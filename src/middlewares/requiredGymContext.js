// middlewares/gym.middleware.js
export function requireGymContext(req, res, next) {
  // Suponiendo que verifyToken ya puso req.user
  if (!req.user || !req.user.gym_id) {
    return res.status(400).json({
      message: 'Tu usuario no tiene un gimnasio asignado. Asigna uno antes de continuar.',
    });
  }
  next();
}