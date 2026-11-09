import { pool } from '../db.js';

export async function listTeams() {
  const [rows] = await pool.query(
    `SELECT t.*, a.Name AS Agency_Name,
            CONCAT(p.First_Name, ' ', p.Last_Name) AS Leader_Name,
            (SELECT COUNT(*) FROM Team_Member m WHERE m.Team_ID = t.Team_ID) AS Member_Count
     FROM   Response_Team t
     JOIN   Agency a       ON a.Agency_ID = t.Agency_ID
     LEFT JOIN Person p    ON p.Person_ID = t.Leader_ID
     ORDER BY t.Team_Name`
  );
  return rows;
}

// TODO: createTeam, updateTeam, addMember(personId, teamId), removeMember
