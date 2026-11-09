import { withTransaction } from '../db.js';
import { HttpError } from '../middleware/errorHandler.js';
import * as q from '../queries/dispatch.queries.js';

export async function recommend(req, res) {
  res.json(await q.recommendTeams(Number(req.params.emergencyId)));
}

export async function list(req, res) {
  const emergencyId = req.query.emergencyId ? Number(req.query.emergencyId) : undefined;
  res.json(await q.listAssignments({ emergencyId }));
}

/**
 * Body: { emergencyId, teamId, priority, eta, isSysRecommended, resourceIds: [] }
 */
export async function create(req, res) {
  const { emergencyId, teamId } = req.body;
  if (!emergencyId || !teamId) throw new HttpError(400, 'emergencyId and teamId are required');

  const id = await withTransaction((conn) =>
    q.createAssignment(conn, { ...req.body, dispatcherId: req.user.userId })
  );
  res.status(201).json({ Assignment_ID: id });
}

export async function updateStatus(req, res) {
  const { status } = req.body;
  if (!status) throw new HttpError(400, 'status is required');
  const ok = await withTransaction((conn) =>
    q.updateAssignmentStatus(conn, Number(req.params.id), status)
  );
  if (!ok) throw new HttpError(404, 'Assignment not found');
  res.json({ ok: true });
}
