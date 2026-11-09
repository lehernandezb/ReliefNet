/** Throw this from any controller to send a specific status + message */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Translate common MySQL errors into friendly API responses
const MYSQL_ERRORS = {
  ER_DUP_ENTRY: [409, 'That record already exists'],
  ER_NO_REFERENCED_ROW_2: [400, 'Referenced record does not exist'],
  ER_ROW_IS_REFERENCED_2: [409, 'Record is in use and cannot be deleted'],
  ER_CHECK_CONSTRAINT_VIOLATED: [400, 'Value breaks a database constraint'],
  ER_SIGNAL_EXCEPTION: [400, null], // custom trigger messages
  // Setup problems — usually server/.env or MySQL not running
  ER_ACCESS_DENIED_ERROR: [500, 'Server cannot log in to MySQL — check DB_USER / DB_PASSWORD in server/.env'],
  ER_BAD_DB_ERROR: [500, "Database 'reliefnet' does not exist — run: npm run db:reset"],
  ER_NO_SUCH_TABLE: [500, 'Tables are missing — run: npm run db:reset'],
  ECONNREFUSED: [500, 'Server cannot reach MySQL — is MySQL running?'],
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (MYSQL_ERRORS[err.code]) {
    const [status, message] = MYSQL_ERRORS[err.code];
    return res.status(status).json({ error: message || err.sqlMessage });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
}
