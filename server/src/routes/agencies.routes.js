import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import * as c from '../controllers/agencies.controller.js';

const router = Router();

router.get('/', requireRole('Admin', 'Dispatcher'), c.list);
router.post('/', requireRole('Admin'), c.create);

export default router;
