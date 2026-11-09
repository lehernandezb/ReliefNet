import { pool } from '../db.js';

/** Find a user by username, and work out their role from the disjoint subclass tables */
export async function findUserByUsername(username) {
  const [rows] = await pool.query(
    `SELECT u.User_ID, u.Username, u.Password_Hash, u.Person_ID,
            p.First_Name, p.Last_Name,
            CASE
              WHEN a.User_ID IS NOT NULL THEN 'Admin'
              WHEN d.User_ID IS NOT NULL THEN 'Dispatcher'
              WHEN c.User_ID IS NOT NULL THEN 'Client'
            END AS Role
     FROM   System_User u
     JOIN   Person p          ON p.Person_ID = u.Person_ID
     LEFT JOIN Admin a        ON a.User_ID = u.User_ID
     LEFT JOIN Dispatcher d   ON d.User_ID = u.User_ID
     LEFT JOIN Client c       ON c.User_ID = u.User_ID
     WHERE  u.Username = ?`,
    [username]
  );
  return rows[0];
}

/** Register a new public Client: Person -> System_User -> Client (call inside a transaction) */
export async function createClientUser(conn, { firstName, lastName, email, phone, username, passwordHash }) {
  const [person] = await conn.query(
    'INSERT INTO Person (First_Name, Last_Name, Email, Phone) VALUES (?, ?, ?, ?)',
    [firstName, lastName, email || null, phone || null]
  );
  const [user] = await conn.query(
    'INSERT INTO System_User (Username, Password_Hash, Person_ID) VALUES (?, ?, ?)',
    [username, passwordHash, person.insertId]
  );
  await conn.query('INSERT INTO Client (User_ID) VALUES (?)', [user.insertId]);
  return { userId: user.insertId, personId: person.insertId };
}
