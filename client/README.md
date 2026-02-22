# CodeWizard Frontend (Next.js)

Frontend app for CodeWizard (problem solving platform) built with Next.js App Router.

## Tech Stack
- Next.js `16.1.6` (App Router)
- React `19`
- Tailwind CSS `v4` (via `@tailwindcss/postcss`)
- ESLint `9`

## Prerequisites
- Node.js `20+` (recommended for Next.js 16)
- npm
- Running backend server (default: `http://localhost:8000`)

## Environment Variables
Create `client/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:
- `NEXT_PUBLIC_API_URL` is used for all backend API calls.
- `NEXT_PUBLIC_APP_URL` is used for SEO metadata/canonical URLs.

## Install & Run
From `client` directory:

```bash
npm install
npm run dev
```

Frontend runs at:
- `http://localhost:3000`

## Available Scripts
- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - run ESLint

## Main Route Groups

### Public Pages
- `/` - landing page
- `/problems` - public problem list
- `/contests` - public contest list
- `/leaderboard`
- `/discuss`
- `/about`, `/contact`, `/careers`
- `/privacy`, `/terms`
- `/[username]` - public user profile

### User Auth Pages
- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`

### User Dashboard
- `/dashboard`
- `/dashboard/problems`
- `/dashboard/problems/[slug]`
- `/dashboard/contests`
- `/dashboard/contests/[slug]`
- `/dashboard/submissions`
- `/dashboard/profile`

### Control Panel (Admin/Employee)
- `/cp/login`
- `/cp`
- `/cp/problems`
- `/cp/contests`
- `/cp/submissions`
- `/cp/users`
- `/cp/employees`
- `/cp/settings`

## API Integration
Shared API helpers:
- `client/lib/api.js`
- `client/lib/auth.js`

Important clients:
- `apiClient` -> uses admin/employee token from `localStorage` key `admin_token`
- `userApiClient` -> uses user token from `localStorage` key `token`

API modules inside `client/lib/api.js`:
- `adminAPI`
- `employeeAPI`
- `problemsAPI`
- `dashboardProblemsAPI`
- `contestsAPI`

## Auth Storage Keys
User app keys:
- `token`
- `user`
- `rememberMe`

Control panel keys:
- `admin_token`
- `admin_user`

Theme key:
- `solvesnest-theme`

## Project Structure (High Level)

```text
client/
  app/                 # Next.js App Router pages/layouts
    cp/                # Admin/employee control panel
    dashboard/         # End-user dashboard
  components/          # Shared and feature UI components
  lib/                 # API/auth/rating utilities
  app/globals.css      # Global styles
```

## Backend Dependency
This frontend depends on the server API routes:
- `/api/auth`
- `/api/problems`
- `/api/submissions`
- `/api/public`
- `/api/contests`
- `/api/admin`
- `/api/employee`

If backend is down or `NEXT_PUBLIC_API_URL` is incorrect, pages that fetch data will fail.

## Troubleshooting
- CORS error:
  - ensure backend `CLIENT_URL` matches frontend origin (example: `http://localhost:3000`)
- `Failed to fetch` in browser:
  - verify backend is running at `NEXT_PUBLIC_API_URL`
- Auth-protected dashboard/cp redirects:
  - check localStorage token values and login flow
