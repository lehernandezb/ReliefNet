import { pool } from '../db.js';

export async function listAgencies() {
  const [rows] = await pool.query(
    `SELECT a.*,
            (SELECT COUNT(*) FROM Responder r     WHERE r.Agency_ID = a.Agency_ID) AS Responders,
            (SELECT COUNT(*) FROM Response_Team t WHERE t.Agency_ID = a.Agency_ID) AS Teams,
            (SELECT COUNT(*) FROM Resource res    WHERE res.Owner_ID = a.Owner_ID) AS Resources
     FROM   Agency a
     ORDER BY a.Name`
  );
  return rows;
}

/** Union category insert: new Resource_Owner first, then Agency pointing at it (transaction) */
export async function createAgency(conn, { name, type, contact }) {
  const [owner] = await conn.query('INSERT INTO Resource_Owner () VALUES ()');
  const [result] = await conn.query(
    'INSERT INTO Agency (Name, Type, Contact, Owner_ID) VALUES (?, ?, ?, ?)',
    [name, type || null, contact || null, owner.insertId]
  );
  return result.insertId;
}

// TODO: updateAgency, deleteAgency
