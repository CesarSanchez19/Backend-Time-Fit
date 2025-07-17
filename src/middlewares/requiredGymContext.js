export function requireGymContext(req, res, next) {
  if (!req.user || !req.user.gym || !req.user.gym._id) {
    return res.status(400).json({
      message: 'Tu usuario no tiene un gimnasio asignado. Asigna uno antes de continuar.',
    });
  }
  next();
}
