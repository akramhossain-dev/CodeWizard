# CodeWizard

CodeWizard is a full-stack coding practice and contest platform.

- `client/` - Next.js frontend (public pages, user dashboard, control panel)
- `server/` - Express API, queue, and judge worker

## Highlights
- User auth with email verification, password reset, Google, and GitHub sign-in
- Problem solving with code run/submit and verdict tracking
- Contest participation and leaderboard
- Admin/employee control panel for problems, contests, users, and submissions
- AI tools (`hint`, `review`, `explain`, `debug`, `chat`) with token balance endpoints
- Docker-based sandboxed execution through a queue worker

## Tech Stack
- Frontend: Next.js 16, React 19, Tailwind CSS v4
- Backend: Node.js, Express, MongoDB, Redis, BullMQ
- Judge: Docker containers

## Prerequisites
- Node.js 20+
- npm
- MongoDB
- Redis
- Docker Engine

## Quick Start
1. Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

2. Create env files:

- `server/.env` (see `server/README.md` for full key list)
- `client/.env.local` (see `client/README.md`)

3. Build judge image:

```bash
cd server/docker
chmod +x build.sh
./build.sh
```

4. Run in 3 terminals:

```bash
# Terminal 1
cd server
npm run dev
```

```bash
# Terminal 2
cd server
node workers/submissionWorker.js
```

```bash
# Terminal 3
cd client
npm run dev
```

## Local URLs
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Scripts
Server:
- `npm run dev`
- `npm start`
- `npm run migrate:rating-rank`

Client:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Docs
- Frontend setup: `client/README.md`
- Backend setup and API groups: `server/README.md`

## Troubleshooting
- `Judge unavailable` or `Internal Error` on submissions:
  - Ensure Docker is running.
  - Ensure worker (`node workers/submissionWorker.js`) is running.
- CORS errors:
  - Ensure `server/.env` `CLIENT_URL` matches frontend origin.
- Frontend cannot reach API:
  - Check `NEXT_PUBLIC_API_URL` in `client/.env.local`.

## License
MIT
