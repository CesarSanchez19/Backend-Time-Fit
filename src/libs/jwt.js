// libs/jwt.js
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';

export function createAccessToken(payload) {
  // payload debe incluir { id, role, gym_id }
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      TOKEN_SECRET,
      { expiresIn: '1d' },
      (err, token) => (err ? reject(err) : resolve(token))
    );
  });
}
