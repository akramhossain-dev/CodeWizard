# CodeWizard Server

Express backend for CodeWizard. Includes auth, problems, contests, submissions, admin/employee APIs, AI endpoints, queue, and judge worker.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- Redis + BullMQ
- Docker sandbox for code execution

## Prerequisites
- Node.js 20+
- npm
- MongoDB running
- Redis running
- Docker Engine running

## Environment
Create `server/.env` and set:

```env
PORT=8000
CLIENT_URL=http://localhost:3000

MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
ENCRYPTION_SECRET=
ADMIN_SECRET_KEY=

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
WORKER_CONCURRENCY=5

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_SERVICE=gmail

GOOGLE_CLIENT_ID=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

OPENROUTER_API_KEY=
# or comma-separated pool
OPENROUTER_API_KEYS=
OPENROUTER_MODEL=

# local debug only, never for production
ALLOW_UNSAFE_LOCAL_EXECUTION=false
```

## Install
From `server/`:

```bash
npm install
```

## Build Judge Image

```bash
cd docker
chmod +x build.sh
./build.sh
```

## Run
API server:

```bash
npm run dev
# or npm start
```

Worker (separate terminal):

```bash
node workers/submissionWorker.js
```

Base URL: `http://localhost:8000`

## Scripts
- `npm run dev`
- `npm start`
- `npm run migrate:rating-rank`

## Route Groups
- `/api/auth` - user auth + profile + social auth
- `/api/admin` - admin auth and management
- `/api/employee` - employee auth and profile
- `/api/problems` - problem listing/details and admin problem management
- `/api/submissions` - run/submit/status/history/stats
- `/api/contests` - contests, join, leaderboard, admin contest management
- `/api/public` - homepage/public aggregates
- `/api/ai` - `hint`, `review`, `explain`, `debug`, `chat`, `tokens`, `tokens/claim-daily`

## Auth and Access Notes
- This server expects encrypted bearer tokens (`Authorization: Bearer <token>`).
- Current route behavior in code:
  - `problems`, `submissions`, and `contests` routes are authenticated.
  - `admin/*` and `employee/*` management routes require role checks.

## Rate Limits
- `/api/submissions/submit`: 20 req/min
- `/api/submissions/run`: 30 req/min
- `/api/ai/hint`: 10 req/10 min
- `/api/ai/review`: 5 req/10 min
- `/api/ai/explain`: 5 req/10 min
- `/api/ai/debug`: 10 req/10 min

## Health Check
```bash
curl http://localhost:8000/
```
Expected response: `API is running...`

## Troubleshooting
- `Judge unavailable`:
  - Ensure Docker is running.
  - Ensure worker is running.
- Redis queue issues:
  - Verify `REDIS_*` values and Redis service status.
- Auth errors:
  - Check `JWT_SECRET` and `ENCRYPTION_SECRET` consistency.
- AI endpoint failures:
  - Check `OPENROUTER_API_KEY(S)` and `OPENROUTER_MODEL`.
