import cors from 'cors';
import express from 'express';
import { pool } from './db.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

import agencyRoutes from './routes/agencies.routes.js';
import authRoutes from './routes/auth.routes.js';
import dispatchRoutes from './routes/dispatch.routes.js';
import emergencyRoutes from './routes/emergencies.routes.js';
import facilityRoutes from './routes/facilities.routes.js';
import helpRequestRoutes from './routes/helpRequests.routes.js';
import resourceRoutes from './routes/resources.routes.js';
import teamRoutes from './routes/teams.routes.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

// Public
app.use('/api/auth', authRoutes);

// Everything below requires a logged-in user
app.use('/api', authenticate);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/agencies', agencyRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`ReliefNet API running on http://localhost:${port}`));
