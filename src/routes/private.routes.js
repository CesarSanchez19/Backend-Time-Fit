import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/dashboard', verifyToken, (req, res) => {
  res.json({
    message: 'Acceso concedido al dashboard 🔐',
    user: req.user
  });
});

export default router;
