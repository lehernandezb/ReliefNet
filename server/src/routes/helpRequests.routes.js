import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import * as c from '../controllers/helpRequests.controller.js';

const router = Router();

router.get('/', c.list);                                  // clients see only their own
router.post('/', requireRole('Client'), c.create);
router.patch('/:id/status', requireRole('Dispatcher', 'Admin'), c.updateStatus);

export default router;
