# ⚙️ CodeWizard Setup and Deployment Guide

Follow these steps to set up and run CodeWizard on your local machine or deploy it to a production server.

---

## 📋 Prerequisites
Ensure you have the following installed:
- **Node.js** v20+ & **npm** v10+
- **MongoDB** v6.0+ (or a MongoDB Atlas Cluster)
- **Redis Server** v7.0+
- **Docker Engine** v24+

---

## 🛠️ Step 1: Environment Configuration

Copy the example environment files and update them with your secrets.

### 1. Server Environment (`/server/.env`)
Create `/server/.env`:
```env
PORT=8000
NODE_ENV=development  # Change to "production" to enforce security checks
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/codewizard

# Secrets (Production requires 128+ characters of random hex values)
JWT_SECRET=change_this_to_a_secure_128_character_long_secret_in_production_mode
JWT_EXPIRES_IN=7d
ENCRYPTION_SECRET=change_this_to_a_secure_128_character_long_secret_in_production_mode
ADMIN_SECRET_KEY=change_this_to_a_secure_128_character_long_secret_in_production_mode
CRYPTO_PEPPER=change_this_to_a_secure_128_character_long_secret_in_production_mode

# Redis Queue
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
WORKER_CONCURRENCY=5

# Cloudinary (Media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI Models (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.5-flash
```

### 2. Client Environment (`/client/.env`)
Create `/client/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth Client Keys
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

---

## 📦 Step 2: Sandbox Container Setup
The worker depends on a sandboxed Docker image to compile and run code safely. You must compile this image locally before accepting submissions:

```bash
cd server/docker
chmod +x build.sh
./build.sh
```
This builds an immutable image tagged `codewizard-judge:latest` containing runtime configurations for C, C++, Python, Java, and JavaScript.

---

## 🚀 Step 3: Run Locally (Development Mode)

1. **Install Dependencies:**
   ```bash
   # Server dependencies
   cd server && npm install
   
   # Client dependencies
   cd ../client && npm install
   ```

2. **Start the Services (3 separate terminals):**
   - **Terminal 1 (API Server):**
     ```bash
     cd server
     npm run dev
     ```
   - **Terminal 2 (Submission Queue Worker):**
     ```bash
     cd server
     node workers/submissionWorker.js
     ```
   - **Terminal 3 (Next.js Frontend):**
     ```bash
     cd client
     npm run dev
     ```

3. **Access URLs:**
   - Frontend Dashboard: `http://localhost:3000`
   - Control Panel (Admin/Employee): `http://localhost:3000/cp`
   - Backend API: `http://localhost:8000`

---

## 🐳 Step 4: Docker Compose Deployment (Production)

To run the entire system (including MongoDB, Redis, API, and frontend) inside Docker containers:

1. Build production bundles and startup containers:
   ```bash
   docker compose up --build -d
   ```

2. Verify that all services are healthy:
   ```bash
   docker compose ps
   ```

3. View structured JSON logs:
   ```bash
   docker compose logs -f api
   docker compose logs -f worker
   ```

---

## 🛡️ Credential Safety Checks (Startup Guard)
If `NODE_ENV=production` is set:
- The backend will **crash immediately on startup** if the values in `.env` contain default placeholders (like `change_this` or `your_secret`).
- It will also crash if any key's entropy check fails (must be 128+ characters long) to prevent weak cryptographic signatures.
- Make sure to update `CLIENT_URL` to your production domain (e.g. `https://codewizard.com`) — starting the backend in production mode with a `localhost` CLIENT_URL will trigger a startup block.
