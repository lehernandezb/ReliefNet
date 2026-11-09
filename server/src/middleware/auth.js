import jwt from 'jsonwebtoken';
import { HttpError } from './errorHandler.js';

/** Reads "Authorization: Bearer <token>" and sets req.user = { userId, personId, username, role } */
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Not logged in');

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    throw new HttpError(401, 'Session expired, please log in again');
  }
}

export function signToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '8h' });
}
