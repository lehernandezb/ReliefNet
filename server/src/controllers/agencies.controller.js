import { withTransaction } from '../db.js';
import { HttpError } from '../middleware/errorHandler.js';
import * as q from '../queries/agencies.queries.js';

export async function list(_req, res) {
  res.json(await q.listAgencies());
}

export async function create(req, res) {
  if (!req.body.name) throw new HttpError(400, 'name is required');
  const id = await withTransaction((conn) => q.createAgency(conn, req.body));
  res.status(201).json({ Agency_ID: id });
}

// TODO: update, remove
