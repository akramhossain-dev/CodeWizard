# 🔌 CodeWizard API Endpoints & Reference

All endpoints expect JSON request payloads and return standard JSON responses. Protected endpoints require the client to supply a JWT bearer token via the `Authorization` header, or present a secure Cookie.

---

## 🛡️ Authentication & Authorization Rules

- **User Authentication:** Send header `Authorization: Bearer <token>` OR rely on `httpOnly` cookie.
- **Admin/Employee Authorization:** Restricts access based on the `role` payload inside the signed JWT.
- **Standard Error Payload:**
  If an API call fails or encounters an error, it returns a normalized response payload without exposing backend stack traces in production:
  ```json
  {
    "success": false,
    "message": "Error details or validation warnings..."
  }
  ```

---

## 🧭 Endpoint Reference

### 1. User Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register a new user. Checks for unique email and username. |
| `POST` | `/api/auth/signin` | Public | Authenticates credentials. Sets `httpOnly` cookie and returns token. |
| `POST` | `/api/auth/google-signin` | Public | Authenticates using Google ID credentials. |
| `POST` | `/api/auth/github-signin` | Public | Authenticates via GitHub OAuth redirect. |
| `POST` | `/api/auth/logout` | Public | Clears auth cookies. |
| `POST` | `/api/auth/forgot-password` | Public | Sends a password reset token via Gmail SMTP. |
| `POST` | `/api/auth/reset-password` | Public | Resets password using token + userId. |
| `POST` | `/api/auth/verify-email` | Public | Verifies email activation token. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current logged-in user profile. |

---

### 2. Problems & Solves (`/api/problems`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/problems` | Public | Lists all active coding problems (paginated). |
| `GET` | `/api/problems/:slug` | Public | Details of a specific problem including test cases. |
| `POST` | `/api/problems` | Admin/Employee | Creates a new problem (includes test cases). |
| `PUT` | `/api/problems/:id` | Admin/Employee | Modifies problem details, memory, and runtime limits. |
| `DELETE` | `/api/problems/:id` | Admin | Deletes problem from catalog. |

---

### 3. Submission Engine (`/api/submissions`)

*All execution endpoints are rate limited to prevent resource starvation.*

| Method | Endpoint | Access | Description | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/submissions/run` | Authenticated | Compiles and executes code against test cases (no verdict). | 30 req / min |
| `POST` | `/api/submissions/submit` | Authenticated | Enqueues code for a full judging run. Schedules rank recomputing. | 20 req / min |
| `GET` | `/api/submissions/status/:id` | Authenticated | Polls queue status or gets final execution verdict. | - |
| `GET` | `/api/submissions/my-submissions` | Authenticated | Retrieves submission history for the logged-in user. | - |

---

### 4. Contests & Leaderboards (`/api/contests`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/contests` | Public | Lists active, upcoming, and past programming contests. |
| `POST` | `/api/contests` | Admin/Employee | Creates a new contest. |
| `POST` | `/api/contests/:id/join` | Authenticated | Enrolls the logged-in user in a contest. |
| `GET` | `/api/contests/:slug/leaderboard` | Public | Live leaderboard statistics for a contest. |

---

### 5. AI Assistant Services (`/api/ai`)

*Endpoints consume user tokens (daily tokens can be claimed via `/tokens/claim-daily`).*

| Method | Endpoint | Access | Description | Rate Limit |
|---|---|---|---|---|
| `POST` | `/api/ai/hint` | Authenticated | Generates algorithmic hints based on current code. | 10 req / 10 min |
| `POST` | `/api/ai/review` | Authenticated | Performs dynamic code review and suggestions. | 5 req / 10 min |
| `POST` | `/api/ai/explain` | Authenticated | Explains error output or complex logic block. | 5 req / 10 min |
| `POST` | `/api/ai/debug` | Authenticated | Points out compiler/runtime error causes in code. | 10 req / 10 min |
| `POST` | `/api/ai/chat` | Authenticated | Interactive chatbot conversing about a selected problem. | - |
| `POST` | `/api/ai/tokens/claim-daily` | Authenticated | Claims daily quota of AI interaction credits. | 1 claim / day |

---

### 6. Control Panel Management (`/api/admin` & `/api/employee`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/admin/signin` | Public | Admin panel authentication. |
| `POST` | `/api/admin/signup` | Public | Initial admin creation (requires `ADMIN_SECRET_KEY` env check). |
| `GET` | `/api/admin/users` | Admin | Get complete database user lists. |
| `PUT` | `/api/admin/users/:id/role` | Admin | Adjust account permissions (User ↔ Employee ↔ Admin). |
