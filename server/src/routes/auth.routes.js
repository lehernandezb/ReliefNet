import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as c from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', c.login);
router.post('/register', c.register);       // public sign-up -> Client
router.get('/me', authenticate, c.me);

export default router;
