# 🧙‍♂️ CodeWizard

CodeWizard is a production-hardened, full-stack programming practice and contest platform featuring real-time sandboxed code execution, programming tournaments, and automated AI assistance.

---

## 🚀 Quick Links
Explore the detailed platform documentation:
- 📐 **[System Architecture](docs/architecture.md):** Client-server flow, judge worker architecture, and container sandbox design.
- ⚙️ **[Setup & Deployment](docs/setup_guide.md):** Local installation guides, environment configurations, and Docker Compose scripts.
- 🔌 **[API Endpoints](docs/api_endpoints.md):** Complete route references, request payloads, and rate limits.
- 🛡️ **[Security & Hardening](docs/security_audit.md):** Protections against malicious code, rate-limiting, and credentials guard details.

---

## ✨ Features
- **Interactive Practice:** Solve algorithmic problems using C, C++, Python, Java, or JavaScript with instant compiler and test case feedback.
- **Tournaments & Contests:** Create, schedule, and join live contests. Dynamic rankings calculate user score and leaderboards.
- **AI-Powered Code Companion:** Instantly query AI assistants for debugging, line-by-line code reviews, hints, or complete logic explanations.
- **Control Panel:** Admin and Employee portals for managing problems, submissions, test cases, and user accounts.
- **Sandboxed Judging:** Submissions compile and run inside secure, network-disabled Alpine-based Docker containers.
- **Production-Ready Architecture:** Includes a full Docker Compose suite with automatic health checking, offline Redis queue handling, Express 5 compatibility, and persistent container socket access.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons.
- **Backend:** Node.js, Express.js (v5 compatible), MongoDB (Mongoose), Redis (BullMQ).
- **Execution Judge:** Docker Engine.
- **Logging:** Pino (Structured JSON logging).

---

## 🚀 Local Development (Fast Track)

1. **Build the Sandbox Judge:**
   ```bash
   cd server/docker
   chmod +x build.sh
   ./build.sh
   ```

2. **Configure Envs:**
   Setup `server/.env` and `client/.env` following the [Setup Guide](docs/setup_guide.md).

3. **Install and Boot:**
   ```bash
   # Terminal 1: Run Backend
   cd server && npm install && npm run dev

   # Terminal 2: Run Judge Worker
   cd server && node workers/submissionWorker.js

   # Terminal 3: Run Frontend
   cd client && npm install && npm run dev
   ```

4. **Access:**
   - **Frontend:** `http://localhost:3000`
   - **Backend API:** `http://localhost:8000`
   - **Control Panel:** `http://localhost:3000/cp`

---

## 🐳 Production Deployment (Docker Compose)

Spin up the entire stack using Docker Compose:
```bash
docker compose up --build -d
```

### Checking Deployment Status
Verify that all services are healthy and running:
```bash
docker compose ps
```

Monitor service logs:
```bash
docker compose logs -f server
docker compose logs -f worker
```

---

## 📄 License
Licensed under the [MIT License](LICENSE).
