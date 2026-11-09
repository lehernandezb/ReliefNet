import { HttpError } from '../middleware/errorHandler.js';
import * as q from '../queries/helpRequests.queries.js';

/** Clients only see their own requests; dispatchers/admins see everything */
export async function list(req, res) {
  const clientId = req.user.role === 'Client' ? req.user.userId : undefined;
  res.json(await q.listHelpRequests({ clientId, status: req.query.status }));
}

export async function create(req, res) {
  const { type, emergencyId } = req.body;
  if (!type || !emergencyId) throw new HttpError(400, 'type and emergencyId are required');
  const id = await q.createHelpRequest({ ...req.body, clientId: req.user.userId });
  res.status(201).json({ Request_ID: id });
}

export async function updateStatus(req, res) {
  const ok = await q.updateHelpRequestStatus(Number(req.params.id), req.body.status);
  if (!ok) throw new HttpError(404, 'Help request not found');
  res.json({ ok: true });
}
