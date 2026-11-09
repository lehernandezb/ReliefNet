import bcrypt from 'bcryptjs';
import { withTransaction } from '../db.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import * as q from '../queries/auth.queries.js';

function toSessionUser(row) {
  return {
    userId: row.User_ID,
    personId: row.Person_ID,
    username: row.Username,
    name: `${row.First_Name} ${row.Last_Name}`,
    role: row.Role,
  };
}

export async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) throw new HttpError(400, 'Username and password are required');

  const row = await q.findUserByUsername(username);
  if (!row || !(await bcrypt.compare(password, row.Password_Hash))) {
    throw new HttpError(401, 'Invalid username or password');
  }
  if (!row.Role) throw new HttpError(403, 'This account has no role assigned');

  const user = toSessionUser(row);
  res.json({ token: signToken(user), user });
}

/** Public sign-up creates a Client account */
export async function register(req, res) {
  const { firstName, lastName, email, phone, username, password } = req.body;
  if (!firstName || !lastName || !username || !password) {
    throw new HttpError(400, 'First name, last name, username and password are required');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await withTransaction((conn) =>
    q.createClientUser(conn, { firstName, lastName, email, phone, username, passwordHash })
  );
  const user = toSessionUser(await q.findUserByUsername(username));
  res.status(201).json({ token: signToken(user), user });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
