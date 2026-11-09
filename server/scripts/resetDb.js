// Rebuilds the database from scratch: schema.sql -> triggers.sql -> seed.sql
// Usage (from /server):  npm run db:reset
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const dbDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db');
const read = (name) => readFile(path.join(dbDir, name), 'utf8');

let conn;
try {
  conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });
} catch (err) {
  const hints = {
    ECONNREFUSED: `Nothing is listening on ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}. Is MySQL installed and running?`,
    ER_ACCESS_DENIED_ERROR: 'MySQL rejected the login. Check DB_USER / DB_PASSWORD in server/.env.',
  };
  console.error('Could not connect to MySQL:', hints[err.code] || err.message);
  process.exit(1);
}

try {
  console.log('-> schema.sql');
  await conn.query(await read('schema.sql'));

  console.log('-> triggers.sql');
  await conn.query(`USE ${process.env.DB_NAME || 'reliefnet'}`);
  // Triggers have BEGIN...END bodies, so send them one at a time
  const triggers = (await read('triggers.sql'))
    .split('-- ;;')
    .map((s) => s.trim())
    .filter((s) => /CREATE\s+TRIGGER/i.test(s));
  for (const t of triggers) await conn.query(t);

  console.log('-> seed.sql');
  await conn.query(await read('seed.sql'));

  console.log('Database reset complete.');
} catch (err) {
  console.error('Reset failed:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
