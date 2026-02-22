# Problem Solving Platform Server

Backend API for an online judge platform (Node.js + Express + MongoDB + Redis + BullMQ + Docker sandbox).

## Stack
- Node.js (Express)
- MongoDB (Mongoose)
- Redis (BullMQ)
- Docker (sandboxed code execution)

## Prerequisites
- Node.js 18+
- npm
- MongoDB running
- Redis running
- Docker Engine running

## Environment Setup
1. Go to server folder:
```bash
cd /media/akram/code/problem\ solve/server
```
2. Create `.env` from `env.txt`:
```bash
cp env.txt .env
```
3. Update secrets and service values in `.env`:
- `JWT_SECRET`
- `ENCRYPTION_SECRET`
- `ADMIN_SECRET_KEY`
- `MONGODB_URI`
- `REDIS_HOST`, `REDIS_PORT`
- `CLIENT_URL`

## Docker Setup (Judge Sandbox)
Run once on Linux:
```bash
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```
Verify Docker access:
```bash
docker info
```
Build sandbox image:
```bash
cd CodeWizard/server/docker
chmod +x build.sh
./build.sh
```
Expected image:
- `code-judge:latest`

### Important Security Behavior
- Judge runs only when Docker is available.
- If Docker is unavailable, `/api/submissions/submit` and `/api/submissions/run` return `503`.
- Unsafe local execution is disabled by default.
- For local debugging only (not production):
```bash
ALLOW_UNSAFE_LOCAL_EXECUTION=true
```

## Install & Run
Install dependencies:
```bash
cd /media/akram/code/problem\ solve/server
npm install
```

Start API server:
```bash
npm run dev
# or
npm start
```

Start judge worker (separate terminal):
```bash
cd /media/akram/code/problem\ solve/server
node workers/submissionWorker.js
```

If Docker permission/group changed after server started, restart both server and worker.

## API Base URL
- Local: `http://localhost:8000`

## Authentication Notes
- Auth token required for protected routes:
  - Header: `Authorization: Bearer <encrypted_token>`
- All `/api/submissions/*` routes require auth.
- All `/api/problems/*` routes require auth.
- All `/api/contests/*` routes require auth.

## Rate Limit Notes
- `/api/submissions/submit`: 20 requests/minute per user/IP
- `/api/submissions/run`: 30 requests/minute per user/IP
- Exceeded limit returns `429` + `Retry-After` header.

## API Endpoints

### Auth (`/api/auth`)

| Endpoint | Method | Description | Input (JSON/Params) | Success Output Example | Error Output Example |
|---|---|---|---|---|---|
| `/signup` | POST | User signup | `{ name, email, password, username, gender, dateOfBirth, location?, bio? }` | `{ "success": true, "message": "User registered", "user": {...} }` | `{ "success": false, "message": "Validation error" }` |
| `/signin` | POST | User signin | `{ email, password }` | `{ "success": true, "token": "...", "user": {...} }` | `{ "success": false, "message": "Invalid credentials" }` |
| `/verify-email` | POST | Verify email token | `{ token, userId }` | `{ "success": true, "message": "Email verified" }` | `{ "success": false, "message": "Invalid/expired token" }` |
| `/resend-verification` | POST | Resend email verification | `{ email }` | `{ "success": true, "message": "Verification sent" }` | `{ "success": false, "message": "User not found" }` |
| `/forgot-password` | POST | Create password reset token | `{ email }` | `{ "success": true, "message": "Reset email sent" }` | `{ "success": false, "message": "User not found" }` |
| `/reset-password` | POST | Reset password | `{ token, userId, newPassword }` | `{ "success": true, "message": "Password reset successful" }` | `{ "success": false, "message": "Invalid/expired token" }` |
| `/user/:username` | GET | Public profile by username | Params: `username` | `{ "success": true, "user": {...} }` | `{ "success": false, "message": "User not found" }` |
| `/me` | GET | Current logged-in user | Header token | `{ "success": true, "user": {...} }` | `{ "success": false, "message": "Access denied" }` |
| `/profile` | PUT | Update user profile | `{ name?, location?, bio?, skills?, interests?, socialLinks?, work?, education? }` | `{ "success": true, "message": "Profile updated", "user": {...} }` | `{ "success": false, "message": "Update failed" }` |
| `/profile-picture` | PUT | Upload profile image | `multipart/form-data`: `profilePicture` | `{ "success": true, "profilePicture": "url" }` | `{ "success": false, "message": "Upload failed" }` |
| `/change-password` | PUT | Change password | `{ currentPassword, newPassword }` | `{ "success": true, "message": "Password changed" }` | `{ "success": false, "message": "Current password incorrect" }` |

### Problems (`/api/problems`)

| Endpoint | Method | Description | Input (JSON/Params) | Success Output Example | Error Output Example |
|---|---|---|---|---|---|
| `/all` | GET | List published problems | Query: `difficulty?, tags?, search?, page?, limit?, sortBy?, order?` | `{ "success": true, "problems": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching problems" }` |
| `/stats` | GET | Problem statistics | None | `{ "success": true, "stats": { "total": 100, "easy": 40, "medium": 35, "hard": 25 } }` | `{ "success": false, "message": "Error fetching statistics" }` |
| `/random` | GET | Get one random published problem | Query: `difficulty?` | `{ "success": true, "problem": {...} }` | `{ "success": false, "message": "No problems available" }` |
| `/tags` | GET | Get all tags | None | `{ "success": true, "tags": ["array", "dp"] }` | `{ "success": false, "message": "Error fetching tags" }` |
| `/tag/:tag` | GET | Get problems by tag | Params: `tag`, Query: `page?, limit?, difficulty?, search?` | `{ "success": true, "problems": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching problems" }` |
| `/:slug` | GET | Problem details by slug | Params: `slug` | `{ "success": true, "problem": {...} }` | `{ "success": false, "message": "Problem not found" }` |
| `/create` | POST | Create problem (employee/admin) | Problem JSON payload | `{ "success": true, "message": "Problem created successfully", "problem": {...} }` | `{ "success": false, "message": "Validation error" }` |
| `/update/:id` | PUT | Update problem (employee/admin) | Params: `id`, body with editable fields | `{ "success": true, "message": "Problem updated successfully", "problem": {...} }` | `{ "success": false, "message": "Problem not found" }` |
| `/status/:id` | PATCH | Toggle publish/active status (employee/admin) | Params: `id`, `{ isPublished?, isActive? }` | `{ "success": true, "message": "Problem status updated", "problem": {...} }` | `{ "success": false, "message": "Problem not found" }` |
| `/delete/:id` | DELETE | Delete problem (employee/admin) | Params: `id` | `{ "success": true, "message": "Problem deleted" }` | `{ "success": false, "message": "Problem not found" }` |
| `/admin/all` | GET | All problems including unpublished (employee/admin) | Query: `difficulty?, tags?, search?, page?, limit?, sortBy?, order?` | `{ "success": true, "problems": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching problems" }` |

### Submissions (`/api/submissions`) [Auth Required]

| Endpoint | Method | Description | Input (JSON/Params) | Success Output Example | Error Output Example |
|---|---|---|---|---|---|
| `/submit` | POST | Submit code for judging | `{ problemId, code, language }` | `{ "success": true, "submissionId": "...", "verdict": "Pending" }` | `{ "success": false, "message": "Judge is temporarily unavailable" }` |
| `/run` | POST | Run code on sample/public tests | `{ problemId, code, language, testCaseIndex? }` | `{ "success": true, "result": { "verdict": "Accepted", ... } }` | `{ "success": false, "message": "Error running code" }` |
| `/status/:id` | GET | Get submission status | Params: `id` | `{ "success": true, "submission": {...} }` | `{ "success": false, "message": "Submission not found" }` |
| `/my-submissions` | GET | Current user submissions | Query: `problemId?, verdict?, language?, page?, limit?` | `{ "success": true, "submissions": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching submissions" }` |
| `/:id` | GET | Submission details with code | Params: `id` | `{ "success": true, "submission": {...} }` | `{ "success": false, "message": "Access denied" }` |
| `/problem/:problemId` | GET | Leaderboard-style submissions per problem | Params: `problemId`, Query: `page?, limit?, verdict?` | `{ "success": true, "submissions": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching submissions" }` |
| `/stats` | GET | Submission stats summary | Query: `problemId?` | `{ "success": true, "stats": { "accepted": 10, "wrongAnswer": 5, ... } }` | `{ "success": false, "message": "Error fetching statistics" }` |
| `/admin/all` | GET | All submissions (admin/employee) | Query: `userId?, problemId?, verdict?, language?, page?, limit?` | `{ "success": true, "submissions": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching submissions" }` |
| `/admin/stats` | GET | All submissions stats (admin/employee) | None | `{ "success": true, "stats": {...} }` | `{ "success": false, "message": "Error fetching statistics" }` |

### Public Homepage APIs (`/api/public`)

| Endpoint | Method | Description | Input (JSON/Params) | Success Output Example | Error Output Example |
|---|---|---|---|---|---|
| `/top-solvers` | GET | Top users by solved/rating/rank | Query: `limit?` | `{ "success": true, "solvers": [...] }` | `{ "success": false, "message": "Error fetching top solvers" }` |
| `/explore-topics` | GET | Topic/tag overview with counts | Query: `limit?` | `{ "success": true, "topics": [...] }` | `{ "success": false, "message": "Error fetching topics" }` |
| `/featured-problems` | GET | Popular featured problems | Query: `limit?, difficulty?` | `{ "success": true, "featuredProblems": [...] }` | `{ "success": false, "message": "Error fetching featured problems" }` |
| `/by-the-numbers` | GET | Platform aggregate numbers (users, solves, problems, contests) | None | `{ "success": true, "data": {...} }` | `{ "success": false, "message": "Error fetching stats" }` |
| `/discuss-overview` | GET | Discussion preview data for homepage | Query: `limit?` | `{ "success": true, "discussions": [...] }` | `{ "success": false, "message": "Error fetching discuss data" }` |
| `/contests-overview` | GET | Contest highlights for homepage | Query: `limit?` | `{ "success": true, "contests": [...] }` | `{ "success": false, "message": "Error fetching contest overview" }` |
| `/problems-overview` | GET | Problem highlights/trending overview | Query: `limit?` | `{ "success": true, "problems": [...] }` | `{ "success": false, "message": "Error fetching problem overview" }` |

### Contests (`/api/contests`) [Auth Required]

| Endpoint | Method | Description | Input (JSON/Params) | Success Output Example | Error Output Example |
|---|---|---|---|---|---|
| `/all` | GET | List contests | Query: `status?, page?, limit?, search?` | `{ "success": true, "contests": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching contests" }` |
| `/:slug` | GET | Contest details by slug | Params: `slug` | `{ "success": true, "contest": {...} }` | `{ "success": false, "message": "Contest not found" }` |
| `/:slug/leaderboard` | GET | Contest leaderboard | Params: `slug`, Query: `page?, limit?` | `{ "success": true, "leaderboard": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching leaderboard" }` |
| `/my/joined` | GET | Current user's joined contests | Query: `page?, limit?` | `{ "success": true, "contests": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching joined contests" }` |
| `/:id/join` | POST | Join a contest | Params: `id` | `{ "success": true, "message": "Joined contest successfully" }` | `{ "success": false, "message": "Contest unavailable or already joined" }` |
| `/admin/all` | GET | All contests including unpublished (admin/employee) | Query: `status?, page?, limit?, search?` | `{ "success": true, "contests": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching contests" }` |
| `/create` | POST | Create contest (admin/employee) | Contest JSON payload | `{ "success": true, "message": "Contest created", "contest": {...} }` | `{ "success": false, "message": "Validation error" }` |
| `/update/:id` | PUT | Update contest (admin/employee) | Params: `id`, body with editable fields | `{ "success": true, "message": "Contest updated", "contest": {...} }` | `{ "success": false, "message": "Contest not found" }` |
| `/status/:id` | PATCH | Toggle contest status (admin/employee) | Params: `id`, `{ isPublished?, isActive? }` | `{ "success": true, "message": "Contest status updated", "contest": {...} }` | `{ "success": false, "message": "Contest not found" }` |
| `/delete/:id` | DELETE | Delete contest (admin/employee) | Params: `id` | `{ "success": true, "message": "Contest deleted" }` | `{ "success": false, "message": "Contest not found" }` |

### Admin (`/api/admin`)

| Endpoint | Method | Description | Input (JSON/Params) | Success Output Example | Error Output Example |
|---|---|---|---|---|---|
| `/signup` | POST | One-time admin signup | `{ name, email, password, username, secretKey }` | `{ "success": true, "token": "...", "admin": {...} }` | `{ "success": false, "message": "Admin already exists / invalid secret" }` |
| `/signin` | POST | Admin signin | `{ email, password }` | `{ "success": true, "token": "...", "admin": {...} }` | `{ "success": false, "message": "Invalid credentials" }` |
| `/dashboard/stats` | GET | Dashboard stats (admin/employee access) | Header token | `{ "success": true, "stats": {...} }` | `{ "success": false, "message": "Access denied" }` |
| `/users` | GET | List users (admin/employee access) | Query: `page?, limit?, search?, isBanned?, isVerified?` | `{ "success": true, "users": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching users" }` |
| `/users/:id/ban` | PATCH | Ban/unban user (admin/employee access) | Params: `id`, `{ isBanned, reason? }` | `{ "success": true, "message": "User status updated", "user": {...} }` | `{ "success": false, "message": "User not found" }` |
| `/employees/create` | POST | Create employee (admin only) | `{ employeeName, employeeEmail, password, role, permissions? }` | `{ "success": true, "message": "Employee created", "employee": {...} }` | `{ "success": false, "message": "Validation error" }` |
| `/employees` | GET | List employees (admin only) | Query: `page?, limit?, role?, isActive?` | `{ "success": true, "employees": [...], "pagination": {...} }` | `{ "success": false, "message": "Error fetching employees" }` |
| `/employees/:id` | GET | Get employee by id (admin only) | Params: `id` | `{ "success": true, "employee": {...} }` | `{ "success": false, "message": "Employee not found" }` |
| `/employees/:id` | PUT | Update employee (admin only) | Params: `id`, body fields | `{ "success": true, "message": "Employee updated", "employee": {...} }` | `{ "success": false, "message": "Employee not found" }` |
| `/employees/:id` | DELETE | Delete employee (admin only) | Params: `id` | `{ "success": true, "message": "Employee deleted" }` | `{ "success": false, "message": "Employee not found" }` |
| `/employees/:id/reset-password` | PUT | Reset employee password (admin only) | Params: `id`, `{ newPassword }` | `{ "success": true, "message": "Password reset" }` | `{ "success": false, "message": "Employee not found" }` |
| `/profile` | GET | Get admin profile | Header token | `{ "success": true, "admin": {...} }` | `{ "success": false, "message": "Access denied" }` |

### Employee (`/api/employee`)

| Endpoint | Method | Description | Input (JSON/Params) | Success Output Example | Error Output Example |
|---|---|---|---|---|---|
| `/signin` | POST | Employee signin | `{ email, password }` | `{ "success": true, "token": "...", "employee": {...} }` | `{ "success": false, "message": "Invalid credentials" }` |
| `/profile` | GET | Employee profile | Header token | `{ "success": true, "employee": {...} }` | `{ "success": false, "message": "Access denied" }` |
| `/profile` | PUT | Update employee profile | `{ employeeName? }` | `{ "success": true, "message": "Profile updated", "employee": {...} }` | `{ "success": false, "message": "Update failed" }` |
| `/change-password` | PUT | Employee password change | `{ currentPassword, newPassword }` | `{ "success": true, "message": "Password changed" }` | `{ "success": false, "message": "Current password incorrect" }` |
| `/stats` | GET | Employee dashboard stats | Header token | `{ "success": true, "stats": {...} }` | `{ "success": false, "message": "Error fetching stats" }` |

## Common Error Format
```json
{
  "success": false,
  "message": "Error message",
  "error": "Optional detailed error"
}
```

## Quick Health Check
```bash
curl http://localhost:8000/
# API is running...
```

## Troubleshooting
- `Judge is temporarily unavailable`
  - Check `docker info`
  - Restart server + worker after Docker/group changes
- Redis queue issues
  - Ensure Redis is running and `.env` values are correct
- MongoDB issues
  - Validate `MONGODB_URI`
- 429 errors on run/submit
  - Wait for rate-limit window reset (check `Retry-After` header)
