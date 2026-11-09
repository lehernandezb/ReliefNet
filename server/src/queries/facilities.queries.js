import { pool } from '../db.js';

/** Facilities with subtype (Shelter | Hospital) and spaces left */
export async function listFacilities() {
  const [rows] = await pool.query(
    `SELECT f.*,
            CASE WHEN s.Facility_ID IS NOT NULL THEN 'Shelter' ELSE 'Hospital' END AS Kind,
            f.Max_Capacity - f.Current_Occupancy AS Spaces_Left,
            s.Is_Accessible, s.Has_Food, s.Pet_Friendly,
            h.ER_Wait_Time, h.Beds_Available
     FROM   Facility f
     LEFT JOIN Shelter s  ON s.Facility_ID = f.Facility_ID
     LEFT JOIN Hospital h ON h.Facility_ID = f.Facility_ID
     ORDER BY Kind, f.Name`
  );
  return rows;
}

/** Change occupancy by +/- n. The CHECK constraint rejects going over Max_Capacity. */
export async function adjustOccupancy(facilityId, delta) {
  const [result] = await pool.query(
    'UPDATE Facility SET Current_Occupancy = Current_Occupancy + ? WHERE Facility_ID = ?',
    [delta, facilityId]
  );
  return result.affectedRows > 0;
}

// TODO: createFacility (Facility + Shelter|Hospital in a transaction, like createResource)
