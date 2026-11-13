# ReliefNet

CPSC 471 Group 38 — a web app for coordinating emergencies, response teams, resources and shelters.
Luis Hernandez · Kayden Le · Nathan Chung · Roman Terzi

**Stack:** React (Vite) · Node.js + Express REST API · MySQL 8

**Quick start:** [Running it locally](#running-it-locally)

## Project layout

```
ReliefNet/
├── db/                 # everything SQL
│   ├── schema.sql      # all tables (from our RM, with the fixes listed at the top)
│   ├── triggers.sql    # disjoint / union-category enforcement
│   ├── seed.sql        # demo data (Calgary scenario)
│   └── queries.sql     # showcase queries for the report
├── server/             # Express API
│   ├── scripts/resetDb.js        # npm run db:reset
│   └── src/
│       ├── index.js              # app setup, mounts routes
│       ├── db.js                 # MySQL pool + withTransaction()
│       ├── middleware/           # authenticate, requireRole, errorHandler
│       ├── routes/               # URL -> controller (+ who's allowed)
│       ├── controllers/          # validate input, call queries, send JSON
│       └── queries/              # ALL SQL lives here
├── client/             # React app
│   └── src/
│       ├── api/client.js         # fetch wrapper (adds JWT)
│       ├── context/AuthContext   # login state
│       ├── hooks/useApi.js       # load data from a GET endpoint
│       ├── components/           # Sidebar, Page, DataTable, StatusBadge, ProtectedRoute
│       └── pages/{client,dispatcher,admin}/
└── docs/api.md         # endpoint contract — update it when you add a route
```

**Rule of thumb:** SQL only goes in `server/src/queries/` (and a copy of the important ones in `db/queries.sql`). Controllers never contain SQL.

## Running it locally

### 1. Install the prerequisites (once per computer)

You need **Node.js 20+** and **MySQL 8**. Check with `node -v` and `mysql --version`.

**macOS (Homebrew):**
```bash
brew install node mysql
brew services start mysql      # starts MySQL now and on every login
mysql_secure_installation
```
In `mysql_secure_installation`:
- At **"Enter password for user root"**, just press **Enter**. A fresh install has no password yet.
- Choose a new root password and **remember it**. You'll put it in `server/.env`.
- Answering **Y** to the remaining questions is fine.

**Windows:** install Node from nodejs.org and MySQL from the MySQL Installer (choose "Server only"). Set the root password during setup. MySQL runs as a Windows service automatically.

Check that you can log in (enter the password you chose):
```bash
mysql -u root -p -e "SELECT 'mysql ok';"
```

### 2. Set up the project (once, after cloning)

From the repo root:
```bash
npm run install:all                 # installs server + client packages
cp server/.env.example server/.env  # Windows: copy server\.env.example server\.env
```

Open `server/.env` and set your MySQL login. Leave everything else as is:
```
DB_USER=root
DB_PASSWORD=the-root-password-you-chose
```
`server/.env` is git-ignored, so everyone keeps their own password and it never gets pushed.

### 3. Build the database
```bash
npm run db:reset
```
It should end with **`Database reset complete.`** This drops and recreates the `reliefnet` database from `db/schema.sql`, `db/triggers.sql` and `db/seed.sql`.
Re-run it whenever someone changes those files, or when you want fresh demo data.

### 4. Start the app (two terminals, both from the repo root)
```bash
npm run server   # API → http://localhost:3000
```
```bash
npm run client   # web app → http://localhost:5173
```
Open **http://localhost:5173** and log in with a demo account:

| Username     | Password      | Lands on |
|--------------|---------------|----------|
| `admin`      | `password123` | Admin overview: agencies, teams, resources, facilities |
| `dispatcher` | `password123` | Emergencies, help requests, dispatching teams |
| `client`     | `password123` | Submit a help request, see shelters |

The server restarts by itself when you save a file in `server/`, and the page reloads when you save a file in `client/`.
**If you edit `server/.env`, stop the server (Ctrl+C) and start it again.** It only reads `.env` at startup.

### Troubleshooting

| You see | Fix |
|---|---|
| `ECONNREFUSED ... 3306` / "Is MySQL installed and running?" | MySQL isn't running. On macOS run `brew services start mysql`; on Windows start the MySQL service in Services (named like **MySQL80** or **MySQL84**). |
| `Access denied for user 'root'` | The password in `server/.env` doesn't match your MySQL root password. Test it with `mysql -u root -p`. |
| `Access denied` in `mysql_secure_installation` on a fresh install | Press **Enter** at the first password prompt. There's no password yet. |
| "Database 'reliefnet' does not exist" / "Tables are missing" | Run `npm run db:reset`. |
| Login page says "Cannot reach the API" | The server isn't running. Start `npm run server` in a second terminal. |
| Login fails right after changing `.env` | Restart `npm run server`. |
| Not sure what's broken | Open http://localhost:3000/api/health. `{"ok":true}` means the API and database are both fine. Otherwise it shows the error. |

## Adding a feature (example: "create team")
1. SQL function in `server/src/queries/teams.queries.js`
2. Controller in `server/src/controllers/teams.controller.js`
3. Route + role in `server/src/routes/teams.routes.js`
4. Document it in `docs/api.md`
5. Call it from a page with `api.post('/teams', {...})`

Anything that inserts into more than one table (specializations, union category, weak entities) goes inside `withTransaction(...)` — see `createResource` and `createAgency` for examples.
