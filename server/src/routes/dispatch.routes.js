import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import * as c from '../controllers/dispatch.controller.js';

const router = Router();

router.use(requireRole('Dispatcher', 'Admin'));
router.get('/', c.list);                                  // ?emergencyId=1
router.get('/recommend/:emergencyId', c.recommend);
router.post('/', requireRole('Dispatcher'), c.create);
router.patch('/:id/status', requireRole('Dispatcher'), c.updateStatus);

export default router;
