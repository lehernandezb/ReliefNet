import { withTransaction } from '../db.js';
import { HttpError } from '../middleware/errorHandler.js';
import * as q from '../queries/resources.queries.js';

export async function list(req, res) {
  res.json(await q.listResources({ availableOnly: req.query.available === 'true' }));
}

/**
 * Body: { name, location, ownerId, kind: 'Vehicle' | 'Equipment',
 *         vehicle: { plateNumber, vehicleType, seats, fuelLevel },
 *         equipment: { equipmentType, quantity, isMedical } }
 */
export async function create(req, res) {
  const { name, ownerId, kind } = req.body;
  if (!name || !ownerId) throw new HttpError(400, 'name and ownerId are required');
  if (!['Vehicle', 'Equipment'].includes(kind)) throw new HttpError(400, "kind must be 'Vehicle' or 'Equipment'");

  const id = await withTransaction((conn) => q.createResource(conn, req.body));
  res.status(201).json({ Resource_ID: id });
}
