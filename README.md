# CodeWizard

Full-stack coding practice and contest platform with:
- `client/` - Next.js frontend (user app + control panel)
- `server/` - Node.js/Express API + judge worker

## Features
- User authentication (signup/signin, email verification, password reset)
- Problem solving with code submission and verdicts
- Contest participation and leaderboard
- User dashboard (profile, submissions, progress)
- Admin/employee control panel for problems, contests, users, and submissions
- Sandboxed code execution with Docker + queue worker

## Tech Stack
- Frontend: Next.js 16, React 19, Tailwind CSS v4
- Backend: Node.js, Express, MongoDB, Redis, BullMQ
- Judge: Docker-based isolated execution

## Repository Structure

```text
CodeWizard/
  client/   # Frontend app
  server/   # Backend API and worker
```

## Quick Start

### 1. Clone and install dependencies

```bash
git clone https://github.com/akramhossain-dev/CodeWizard.git
cd CodeWizard

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment files

Server:

```bash
cd server
cp env.txt .env
```

Client (`client/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start required services
- MongoDB
- Redis
- Docker Engine

### 4. Build judge image

```bash
cd server/docker
chmod +x build.sh
./build.sh
```

### 5. Run apps (3 terminals)

Terminal 1 (API):
```bash
cd server
npm run dev
```

Terminal 2 (worker):
```bash
cd server
node workers/submissionWorker.js
```

Terminal 3 (frontend):
```bash
cd client
npm run dev
```

## Local URLs
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

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

## API Modules
Backend routes are grouped under:
- `/api/auth`
- `/api/problems`
- `/api/submissions`
- `/api/contests`
- `/api/public`
- `/api/admin`
- `/api/employee`

## Documentation
- Frontend docs: `client/README.md`
- Backend docs: `server/README.md`

## License
This project is licensed under the MIT License.

## Troubleshooting
- `Judge is temporarily unavailable`
  - Ensure Docker is running and worker process is active.
- CORS errors
  - Ensure backend `CLIENT_URL` matches frontend origin.
- `Failed to fetch` on frontend
  - Verify `NEXT_PUBLIC_API_URL` and backend status.
