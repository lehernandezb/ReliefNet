import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import * as c from '../controllers/resources.controller.js';

const router = Router();

router.get('/', requireRole('Admin', 'Dispatcher'), c.list);   // ?available=true
router.post('/', requireRole('Admin'), c.create);

export default router;
