import { HttpError } from './errorHandler.js';

/**
 * Only let certain roles through. Use after authenticate.
 *   router.post('/', requireRole('Dispatcher'), controller.create)
 *   router.get('/',  requireRole('Admin', 'Dispatcher'), controller.list)
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, `Requires role: ${roles.join(' or ')}`);
    }
    next();
  };
}
