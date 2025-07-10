export function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'Administrador') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado: solo administradores' });
}

export function isColaboratorOrAdmin(req, res, next) {
  if (req.user && (req.user.role === 'Administrador' || req.user.role === 'Colaborador')) {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado' });
}
