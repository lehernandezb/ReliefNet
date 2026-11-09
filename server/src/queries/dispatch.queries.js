import { pool } from '../db.js';
import { HttpError } from '../middleware/errorHandler.js';

const AVG_SPEED_KMH = 50;

/**
 * System recommendation: closest AVAILABLE teams to an emergency.
 * ST_Distance_Sphere returns metres between two (lng, lat) points.
 */
export async function recommendTeams(emergencyId, limit = 3) {
  const [rows] = await pool.query(
    `SELECT t.Team_ID, t.Team_Name, t.Specialty, t.Size, a.Name AS Agency,
            ROUND(ST_Distance_Sphere(POINT(t.Longitude, t.Latitude),
                                     POINT(e.Longitude, e.Latitude)) / 1000, 2) AS Distance_Km,
            CEIL(ST_Distance_Sphere(POINT(t.Longitude, t.Latitude),
                                    POINT(e.Longitude, e.Latitude)) / 1000 / ? * 60) AS ETA_Min
     FROM   Response_Team t
     JOIN   Agency a    ON a.Agency_ID = t.Agency_ID
     JOIN   Emergency e ON e.Emergency_ID = ?
     WHERE  t.Status = 'Available'
       AND  t.Latitude IS NOT NULL AND e.Latitude IS NOT NULL
     ORDER BY Distance_Km
     LIMIT ?`,
    [AVG_SPEED_KMH, emergencyId, limit]
  );
  return rows;
}

export async function listAssignments({ emergencyId } = {}) {
  const [rows] = await pool.query(
    `SELECT da.*, t.Team_Name, e.Name AS Emergency_Name,
            GROUP_CONCAT(r.Name ORDER BY r.Name SEPARATOR ', ') AS Resources
     FROM   Dispatch_Assignment da
     JOIN   Response_Team t ON t.Team_ID = da.Team_ID
     JOIN   Emergency e     ON e.Emergency_ID = da.Emergency_ID
     LEFT JOIN Assignment_Resource ar ON ar.Assignment_ID = da.Assignment_ID
     LEFT JOIN Resource r             ON r.Resource_ID = ar.Resource_ID
     WHERE  (? IS NULL OR da.Emergency_ID = ?)
     GROUP BY da.Assignment_ID
     ORDER BY da.Assigned_Date DESC`,
    [emergencyId ?? null, emergencyId ?? null]
  );
  return rows;
}

/** Create assignment + attach resources + mark team Deployed (call inside a transaction) */
export async function createAssignment(conn, a) {
  const [team] = await conn.query(
    'SELECT Status FROM Response_Team WHERE Team_ID = ? FOR UPDATE',
    [a.teamId]
  );
  if (!team.length) throw new HttpError(404, 'Team not found');
  if (team[0].Status !== 'Available') {
    throw new HttpError(409, 'Team is not available');
  }

  const [result] = await conn.query(
    `INSERT INTO Dispatch_Assignment
       (Priority, ETA, Is_Sys_Recommended, Team_ID, Dispatcher_ID, Emergency_ID)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [a.priority || 'Medium', a.eta ?? null, !!a.isSysRecommended, a.teamId, a.dispatcherId, a.emergencyId]
  );
  const assignmentId = result.insertId;

  if (a.resourceIds?.length) {
    await conn.query(
      'INSERT INTO Assignment_Resource (Assignment_ID, Resource_ID) VALUES ?',
      [a.resourceIds.map((rid) => [assignmentId, rid])]
    );
  }

  await conn.query("UPDATE Response_Team SET Status = 'Deployed' WHERE Team_ID = ?", [a.teamId]);
  return assignmentId;
}

/** Update status; when an assignment ends, free the team again (call inside a transaction) */
export async function updateAssignmentStatus(conn, assignmentId, status) {
  const [rows] = await conn.query(
    'SELECT Team_ID FROM Dispatch_Assignment WHERE Assignment_ID = ?',
    [assignmentId]
  );
  if (!rows.length) return false;

  await conn.query('UPDATE Dispatch_Assignment SET Status = ? WHERE Assignment_ID = ?', [status, assignmentId]);
  if (status === 'Completed' || status === 'Cancelled') {
    await conn.query("UPDATE Response_Team SET Status = 'Available' WHERE Team_ID = ?", [rows[0].Team_ID]);
  }
  return true;
}
