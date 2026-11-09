import { HttpError } from '../middleware/errorHandler.js';
import * as q from '../queries/facilities.queries.js';

export async function list(_req, res) {
  res.json(await q.listFacilities());
}

/** Body: { delta: number } — e.g. +3 when people check in, -1 when someone leaves */
export async function adjustOccupancy(req, res) {
  const delta = Number(req.body.delta);
  if (!Number.isInteger(delta)) throw new HttpError(400, 'delta must be a whole number');
  const ok = await q.adjustOccupancy(Number(req.params.id), delta);
  if (!ok) throw new HttpError(404, 'Facility not found');
  res.json({ ok: true });
}

// TODO: create (Facility + Shelter|Hospital)
