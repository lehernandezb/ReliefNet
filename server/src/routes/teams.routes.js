import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import * as c from '../controllers/teams.controller.js';

const router = Router();

router.get('/', requireRole('Admin', 'Dispatcher'), c.list);

export default router;
