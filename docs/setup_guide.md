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

1. **Inject Build Arguments:**
   Next.js builds statically at build time. Ensure your `client/.env` file is present in the build context or env variables are defined when building the image. 

2. **Start Services:**
   ```bash
   docker compose up --build -d
   ```

3. **Verify Health:**
   The `docker-compose.yml` mounts the `/var/run/docker.sock` to enable sandboxed code execution, installs `docker-cli` within the backend containers, and runs the containers as `user: "root"` to bypass permission constraints on `/var/run/docker.sock`.
   
   To verify that all services are healthy:
   ```bash
   docker compose ps
   ```

4. **Loopback Health Checks:**
   Docker health checks inside containers request `http://127.0.0.1:3000` and `http://127.0.0.1:8000` to prevent Alpine loopback IPv6 hostname lookup resolution issues.

---

## 🛡️ Credential Safety Checks (Startup Guard)
If `NODE_ENV=production` is set:
- The backend will **crash immediately on startup** if the values in `.env` contain default placeholders (like `change_this` or `your_secret`).
- It will also crash if any key's entropy check fails (must be 128+ characters long) to prevent weak cryptographic signatures.
- **Local Testing Override:** Starting the backend in production mode with a `localhost` CLIENT_URL will trigger a startup block. To test production builds locally, add `ALLOW_LOCALHOST_IN_PRODUCTION=true` to your environment configurations.
