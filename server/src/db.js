import mysql from 'mysql2/promise';

// One shared connection pool for the whole server
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'reliefnet',
  connectionLimit: 10,
  dateStrings: true, // return DATETIME as 'YYYY-MM-DD HH:MM:SS' strings
});

/**
 * Run several queries as one all-or-nothing transaction.
 *
 *   const id = await withTransaction(async (conn) => {
 *     await conn.query('INSERT ...');
 *     await conn.query('INSERT ...');
 *     return something;
 *   });
 *
 * If the callback throws, everything is rolled back.
 */
export async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
