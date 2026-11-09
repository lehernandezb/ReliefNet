import * as q from '../queries/teams.queries.js';

export async function list(_req, res) {
  res.json(await q.listTeams());
}

// TODO: create, update, addMember, removeMember
