import { pool } from '../db.js';

/** All resources with their subtype (Vehicle | Equipment) and owner name (Agency | Volunteer) */
export async function listResources({ availableOnly = false } = {}) {
  const [rows] = await pool.query(
    `SELECT r.Resource_ID, r.Name, r.Location, r.Owner_ID,
            CASE WHEN v.Resource_ID IS NOT NULL THEN 'Vehicle' ELSE 'Equipment' END AS Kind,
            v.Plate_Number, v.Vehicle_Type, v.Seats, v.Fuel_Level,
            eq.Equipment_Type, eq.Quantity, eq.Is_Medical,
            COALESCE(ag.Name, CONCAT(p.First_Name, ' ', p.Last_Name)) AS Owner_Name,
            EXISTS (SELECT 1 FROM Assignment_Resource ar
                    JOIN Dispatch_Assignment da ON da.Assignment_ID = ar.Assignment_ID
                    WHERE ar.Resource_ID = r.Resource_ID
                      AND da.Status NOT IN ('Completed', 'Cancelled')) AS In_Use
     FROM   Resource r
     LEFT JOIN Vehicle v    ON v.Resource_ID = r.Resource_ID
     LEFT JOIN Equipment eq ON eq.Resource_ID = r.Resource_ID
     LEFT JOIN Agency ag    ON ag.Owner_ID = r.Owner_ID
     LEFT JOIN Volunteer vo ON vo.Owner_ID = r.Owner_ID
     LEFT JOIN Person p     ON p.Person_ID = vo.Person_ID
     ORDER BY Kind, r.Name`
  );
  return availableOnly ? rows.filter((r) => !r.In_Use) : rows;
}

/**
 * Disjoint specialization insert: Resource + exactly one of Vehicle / Equipment.
 * Call inside a transaction.
 */
export async function createResource(conn, { name, location, ownerId, kind, vehicle, equipment }) {
  const [result] = await conn.query(
    'INSERT INTO Resource (Name, Location, Owner_ID) VALUES (?, ?, ?)',
    [name, location || null, ownerId]
  );
  const id = result.insertId;

  if (kind === 'Vehicle') {
    await conn.query(
      `INSERT INTO Vehicle (Resource_ID, Plate_Number, Vehicle_Type, Seats, Fuel_Level)
       VALUES (?, ?, ?, ?, ?)`,
      [id, vehicle?.plateNumber || null, vehicle?.vehicleType || null, vehicle?.seats ?? null, vehicle?.fuelLevel ?? null]
    );
  } else {
    await conn.query(
      `INSERT INTO Equipment (Resource_ID, Equipment_Type, Quantity, Is_Medical)
       VALUES (?, ?, ?, ?)`,
      [id, equipment?.equipmentType || null, equipment?.quantity ?? 1, !!equipment?.isMedical]
    );
  }
  return id;
}
