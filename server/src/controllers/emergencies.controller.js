import { withTransaction } from '../db.js';
import { HttpError } from '../middleware/errorHandler.js';
import * as q from '../queries/emergencies.queries.js';
import { listAssignments } from '../queries/dispatch.queries.js';

const EMERGENCY_STATUSES = ['Active', 'Contained', 'Resolved'];

export async function list(req, res) {
  res.json(await q.listEmergencies({ includeResolved: req.query.all === 'true' }));
}

/** One emergency with its zones, timeline and assignments */
export async function getOne(req, res) {
  const id = Number(req.params.id);
  const emergency = await q.getEmergency(id);
  if (!emergency) throw new HttpError(404, 'Emergency not found');

  const [zones, updates, assignments] = await Promise.all([
    q.getZones(id),
    q.getStatusUpdates(id),
    listAssignments({ emergencyId: id }),
  ]);
  res.json({ ...emergency, zones, updates, assignments });
}

export async function create(req, res) {
  const { name, type } = req.body;
  if (!name || !type) throw new HttpError(400, 'Name and type are required');
  const id = await q.createEmergency(req.body);
  res.status(201).json({ Emergency_ID: id });
}

/** Dispatcher posts a status update; optionally changes the emergency's status too */
export async function addUpdate(req, res) {
  const emergencyId = Number(req.params.id);
  const { newStatus, notes } = req.body;
  if (!newStatus) throw new HttpError(400, 'newStatus is required');
  if (!(await q.getEmergency(emergencyId))) throw new HttpError(404, 'Emergency not found');

  const seq = await withTransaction(async (conn) => {
    const s = await q.addStatusUpdate(conn, {
      emergencyId, newStatus, notes, dispatcherId: req.user.userId,
    });
    if (EMERGENCY_STATUSES.includes(newStatus)) {
      await q.setEmergencyStatus(conn, emergencyId, newStatus);
    }
    return s;
  });
  res.status(201).json({ Emergency_ID: emergencyId, Update_Seq: seq });
}
