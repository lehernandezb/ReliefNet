import { pool } from '../db.js';

export async function listEmergencies({ includeResolved = false } = {}) {
  const [rows] = await pool.query(
    `SELECT e.*,
            (SELECT COUNT(*) FROM Help_Request h
              WHERE h.Emergency_ID = e.Emergency_ID AND h.Status = 'Open') AS Open_Requests,
            (SELECT COUNT(*) FROM Dispatch_Assignment d
              WHERE d.Emergency_ID = e.Emergency_ID) AS Assignments
     FROM   Emergency e
     WHERE  ? OR e.Status <> 'Resolved'
     ORDER BY FIELD(e.Priority, 'Critical', 'High', 'Medium', 'Low'), e.Start_Time DESC`,
    [includeResolved]
  );
  return rows;
}

export async function getEmergency(id) {
  const [rows] = await pool.query('SELECT * FROM Emergency WHERE Emergency_ID = ?', [id]);
  return rows[0];
}

export async function getZones(emergencyId) {
  const [rows] = await pool.query(
    'SELECT * FROM Evacuation_Zone WHERE Emergency_ID = ? ORDER BY Zone_No',
    [emergencyId]
  );
  return rows;
}

export async function getStatusUpdates(emergencyId) {
  const [rows] = await pool.query(
    `SELECT su.Update_Seq, su.New_Status, su.Notes, su.Time_Stamp,
            CONCAT(p.First_Name, ' ', p.Last_Name) AS Posted_By
     FROM   Status_Update su
     LEFT JOIN System_User u ON u.User_ID = su.Dispatcher_ID
     LEFT JOIN Person p      ON p.Person_ID = u.Person_ID
     WHERE  su.Emergency_ID = ?
     ORDER BY su.Update_Seq DESC`,
    [emergencyId]
  );
  return rows;
}

export async function createEmergency({ name, type, priority, location, latitude, longitude }) {
  const [result] = await pool.query(
    `INSERT INTO Emergency (Name, Type, Priority, Location, Latitude, Longitude)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, type, priority || 'Medium', location || null, latitude ?? null, longitude ?? null]
  );
  return result.insertId;
}

/**
 * Weak entity insert: Update_Seq is the next number for THIS emergency.
 * Must run inside a transaction (FOR UPDATE locks the rows so two
 * dispatchers can't grab the same sequence number).
 */
export async function addStatusUpdate(conn, { emergencyId, newStatus, notes, dispatcherId }) {
  const [[{ nextSeq }]] = await conn.query(
    `SELECT COALESCE(MAX(Update_Seq), 0) + 1 AS nextSeq
     FROM   Status_Update WHERE Emergency_ID = ? FOR UPDATE`,
    [emergencyId]
  );
  await conn.query(
    `INSERT INTO Status_Update (Emergency_ID, Update_Seq, New_Status, Notes, Dispatcher_ID)
     VALUES (?, ?, ?, ?, ?)`,
    [emergencyId, nextSeq, newStatus, notes || null, dispatcherId]
  );
  return nextSeq;
}

/** Keep Emergency.Status in sync when an update uses one of its enum values */
export async function setEmergencyStatus(conn, emergencyId, status) {
  await conn.query(
    `UPDATE Emergency
     SET    Status = ?, End_Time = IF(? = 'Resolved', NOW(), NULL)
     WHERE  Emergency_ID = ?`,
    [status, status, emergencyId]
  );
}
