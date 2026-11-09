# ReliefNet API

Base URL (dev): `http://localhost:3000/api` — the React dev server proxies `/api` there.

All routes except `/auth/*` need `Authorization: Bearer <token>`.
Errors always look like `{ "error": "message" }`.

## Auth
| Method | Path | Who | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/login` | public | `{ username, password }` | `{ token, user }` |
| POST | `/auth/register` | public | `{ firstName, lastName, email?, phone?, username, password }` | `{ token, user }` (new Client) |
| GET | `/auth/me` | any | — | `{ user }` |

`user` = `{ userId, personId, username, name, role }`, role is `Admin` \| `Dispatcher` \| `Client`.

## Emergencies
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/emergencies` | any | Non-resolved, ordered by priority. `?all=true` includes resolved. Includes `Open_Requests`, `Assignments` counts |
| GET | `/emergencies/:id` | any | Emergency + `zones[]`, `updates[]` (newest first), `assignments[]` |
| POST | `/emergencies` | Admin, Dispatcher | `{ name, type, priority?, location?, latitude?, longitude? }` |
| POST | `/emergencies/:id/updates` | Dispatcher | `{ newStatus, notes? }` — if newStatus is Active/Contained/Resolved, the emergency's status changes too |

## Help requests
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/help-requests` | any | Clients get only their own. `?status=Open` filter |
| POST | `/help-requests` | Client | `{ emergencyId, type, location?, description? }` |
| PATCH | `/help-requests/:id/status` | Dispatcher, Admin | `{ status }` — Open \| In Progress \| Resolved \| Cancelled |

## Dispatch
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/dispatch` | Dispatcher, Admin | `?emergencyId=` filter |
| GET | `/dispatch/recommend/:emergencyId` | Dispatcher, Admin | Top 3 available teams by distance, with `Distance_Km`, `ETA_Min` |
| POST | `/dispatch` | Dispatcher | `{ emergencyId, teamId, priority?, eta?, isSysRecommended?, resourceIds?: [] }` — team becomes Deployed. 409 if team busy |
| PATCH | `/dispatch/:id/status` | Dispatcher | `{ status }` — Completed/Cancelled frees the team |

## Admin data
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/agencies` | Admin, Dispatcher | With responder / team / resource counts |
| POST | `/agencies` | Admin | `{ name, type?, contact? }` — creates Resource_Owner too |
| GET | `/teams` | Admin, Dispatcher | With agency, leader name, member count |
| GET | `/resources` | Admin, Dispatcher | Vehicle/Equipment details, owner, `In_Use`. `?available=true` |
| POST | `/resources` | Admin | `{ name, ownerId, location?, kind: 'Vehicle'|'Equipment', vehicle?: {...}, equipment?: {...} }` |
| GET | `/facilities` | any | Shelter/Hospital details, `Spaces_Left` |
| PATCH | `/facilities/:id/occupancy` | Admin, Dispatcher | `{ delta }` — rejected if it would exceed capacity |

## Still to build (TODO)
- Teams: create / update / add & remove members
- Facilities: create (Facility + Shelter|Hospital)
- Agencies: update / delete
- Victims, volunteers, evacuation zones: CRUD + pages
