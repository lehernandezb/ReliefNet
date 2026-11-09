import { pool } from '../db.js';

/** clientId = only that client's requests; omit for all (dispatcher/admin view) */
export async function listHelpRequests({ clientId, status } = {}) {
  const [rows] = await pool.query(
    `SELECT h.*, e.Name AS Emergency_Name,
            CONCAT(p.First_Name, ' ', p.Last_Name) AS Submitted_By
     FROM   Help_Request h
     JOIN   Emergency e     ON e.Emergency_ID = h.Emergency_ID
     JOIN   System_User u   ON u.User_ID = h.Client_ID
     JOIN   Person p        ON p.Person_ID = u.Person_ID
     WHERE  (? IS NULL OR h.Client_ID = ?)
       AND  (? IS NULL OR h.Status = ?)
     ORDER BY h.Submitted_Date DESC`,
    [clientId ?? null, clientId ?? null, status ?? null, status ?? null]
  );
  return rows;
}

export async function createHelpRequest({ type, description, location, clientId, emergencyId }) {
  const [result] = await pool.query(
    `INSERT INTO Help_Request (Type, Description, Location, Client_ID, Emergency_ID)
     VALUES (?, ?, ?, ?, ?)`,
    [type, description || null, location || null, clientId, emergencyId]
  );
  return result.insertId;
}

export async function updateHelpRequestStatus(id, status) {
  const [result] = await pool.query(
    'UPDATE Help_Request SET Status = ? WHERE Request_ID = ?',
    [status, id]
  );
  return result.affectedRows > 0;
}
