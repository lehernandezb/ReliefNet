import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import * as c from '../controllers/emergencies.controller.js';

const router = Router();

router.get('/', c.list);                                          // any logged-in user
router.get('/:id', c.getOne);
router.post('/', requireRole('Admin', 'Dispatcher'), c.create);
router.post('/:id/updates', requireRole('Dispatcher'), c.addUpdate);

export default router;
