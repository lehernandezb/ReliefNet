import { Router } from 'express';
import { requireRole } from '../middleware/requireRole.js';
import * as c from '../controllers/facilities.controller.js';

const router = Router();

router.get('/', c.list);                                         // clients can find shelters
router.patch('/:id/occupancy', requireRole('Admin', 'Dispatcher'), c.adjustOccupancy);

export default router;
