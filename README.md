# Yalla — Backend (server)

This repository contains the backend API for the Yalla platform (server). The codebase is an Express-based Node.js API that powers admin panels, driver/customer APIs, scheduling, assignment/dispatch components and a small health / public status page.

Note: the project previously used a local OSRM server. The backend has been cleaned up to remove server-side OSRM tooling and fallbacks — routing from the backend is now performed by OpenRouteService (ORS) when an ORS API key is configured. If no ORS key is configured the routing endpoints return no route and ETA estimation falls back to the local heuristic model.

Contents
 - Overview
 - Requirements
 - Getting started (dev)
 - Environment variables
 - Key endpoints & health checks
 - Routing details and change summary
 - Development notes, tips and how to re-enable server-side routing

---

## Overview

Server is an Express + Socket.IO based Node project that exposes the REST API used by the Yalla services. It contains features for:

- User (customer/driver/admin) auth and admin APIs
- Trip lifecycle API + assignment engine
- ETA & routing services
- Scheduling (scheduled trip activation)
- Realtime communication via Socket.IO
- Lightweight public health page for quick status check

This README focuses on how to install and run the server, configuration points you will need, and the impact of the OSRM removal decision.

## Requirements

- Node.js (recommended 18.x or newer)
- npm (or yarn)
- MongoDB (connection string set via MONGO_URI)

## Getting started (development)

1. Clone the repository and change to the server directory:

```bash
git clone <repo-url>
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a .env locally for development. At minimum set the required env vars listed below.

4. Start the dev server (nodemon)

```bash
npm start
```

Default server port is 5000 (unless `PORT` env var is set).

## Environment variables

Essential environment variables (loaded by `src/bootstrap/loadEnv.js`):

- MONGO_URI — MongoDB connection string (required)
- JWT_SECRET — JSON web token secret (required)

Optional / useful environment variables:
- PORT — port to run the server (default: 5000)
- ORS_API_KEY — OpenRouteService API key. If provided, the backend will use ORS for routing.
- (Legacy) OSRM_URL — server-side OSRM support is removed in the current branch. If you re-enable server-side OSRM you may use this var to point at a routing server.

## Key endpoints

- GET /health — Health endpoint used by the public health page and monitoring systems. Returns JSON with `mongo` and `routing` statuses.
- GET /routing/route?fromLat=&fromLng=&toLat=&toLng= — Routing API used by the backend (returns formatted route when ORS_API_KEY present)
- The project includes many admin and trip endpoints, mounted under `/admin/*`, `/trip`, `/customer/*`, `/driver/*` and others.

Example routing request (replace coordinates):

```bash
curl "http://localhost:5000/routing/route?fromLat=30.0444&fromLng=31.2357&toLat=30.0500&toLng=31.2400"
```

Example health request:

```bash
curl http://localhost:5000/health
```

Health JSON contains a `routing` object that looks like:

```json
{ "service": "OpenRouteService", "reachable": true }
```

## Routing change summary (what I changed)

- Server-side OSRM tooling, scripts and sample data were removed from `server/osrm/`.
- The `src/bootstrap/initOSRM.js` preflight/initialization helper was deleted and is no longer invoked at startup.
- The previous routing client `src/services/routing/osrmClient.js` was renamed and simplified to `src/services/routing/routingClient.js` and it now only uses OpenRouteService (ORS) when `ORS_API_KEY` is present.
- The server no longer attempts to fall back to a local OSRM server — routing calls return `null` without ORS credentials and ETA logic falls back to heuristic estimates.
- The public health UI (`public/index.html`) was updated to surface `routing` reachability instead of OSRM.

Why this change: removing unused, heavy server-side OSRM tooling reduces disk usage and simplifies deployment. Backend routing still works when configured with `ORS_API_KEY`.

## Re-enable a local routing server (if you need server-side OSRM again)

If you prefer to run your own local OSRM instance and have the backend use it, you can:

1. Re-add a local OSRM server (container / binary) and expose it.
2. Update `src/services/routing/routingClient.js` to prefer `OSRM_URL` when present and to perform requests against the local OSRM (typical path: `/route/v1/driving/{coords}`), similar to the old implementation.
3. Optionally update `server.js` to restore a preflight health check against `OSRM_URL`.

If you want me to re-enable OSRM fallback in the backend, I can implement that change safely and document it.

## Tests and lints

There are no automated test commands in package.json by default. If you use a tests framework locally, add them and I'll help wire them into `npm test`.

## Troubleshooting & tips

- If the server can't connect to MongoDB, the process will exit because `MONGO_URI` is required.
- If routing returns `null` and you expect a route, verify `ORS_API_KEY` is set and your key is valid. The backend checks ORS reachability on-demand and surfaces it in the `/health` endpoint.

## Next steps — suggestions

- Remove any OSRM references from docs/CI and the repo root if you don't want to keep them in history.
- Add automated tests for the routing endpoint and ETA engine to prevent regressions.
- If you depend on routing for offline / private networks, consider reintroducing a server-side routing step but keep it optional and configurable.

---

If you'd like, I can now:

- Add automated tests for the routing controller and ETA engine; or
- Remove the routing endpoint entirely from the backend (switch to heuristic-only ETA), or
- Reintroduce server-side OSRM fallback and document deployment steps.

Tell me which option you prefer and I’ll continue. ✅

