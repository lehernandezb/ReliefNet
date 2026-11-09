# ReliefNet

CPSC 471 Group 38 — a web app for coordinating emergencies, response teams, resources and shelters.
Luis Hernandez · Kayden Le · Nathan Chung · Roman Terzi

**Stack:** React (Vite) · Node.js + Express REST API · MySQL 8

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
│       ├── components/           # Navbar, DataTable, StatusBadge, ProtectedRoute
│       └── pages/{client,dispatcher,admin}/
└── docs/api.md         # endpoint contract — update it when you add a route
```

**Rule of thumb:** SQL only goes in `server/src/queries/` (and a copy of the important ones in `db/queries.sql`). Controllers never contain SQL.

## First-time setup

You need **Node 20+** and **MySQL 8** running locally.

```bash
npm run install:all                 # installs server + client packages
cp server/.env.example server/.env  # then put your MySQL password in server/.env
npm run db:reset                    # builds the database + demo data
```

## Running it (two terminals)

```bash
npm run server   # API on http://localhost:3000
npm run client   # app on http://localhost:5173
```

Demo logins (password `password123`): `admin`, `dispatcher`, `client`.

Run `npm run db:reset` any time to wipe and rebuild the database — e.g. after someone changes `schema.sql`.

## Adding a feature (example: "create team")
1. SQL function in `server/src/queries/teams.queries.js`
2. Controller in `server/src/controllers/teams.controller.js`
3. Route + role in `server/src/routes/teams.routes.js`
4. Document it in `docs/api.md`
5. Call it from a page with `api.post('/teams', {...})`

Anything that inserts into more than one table (specializations, union category, weak entities) goes inside `withTransaction(...)` — see `createResource` and `createAgency` for examples.
