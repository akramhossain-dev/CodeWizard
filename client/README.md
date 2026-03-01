# CodeWizard Frontend

Next.js App Router frontend for CodeWizard.

## Stack
- Next.js `16.1.6`
- React `19.2.3`
- Tailwind CSS `v4`
- ESLint `9`

## Prerequisites
- Node.js 20+
- npm
- Running backend API (default `http://localhost:8000`)

## Environment
Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (OAuth)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GITHUB_CLIENT_ID=
```

## Install and Run
From `client/`:

```bash
npm install
npm run dev
```

Dev server: `http://localhost:3000`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Key Areas
- Public pages: landing, about/contact/careers, policies, leaderboard, discuss
- User auth: login/register/verify/reset flows
- User dashboard: problems, contests, submissions, profile
- Control panel: admin/employee login and management pages (`/cp/*`)

## API Layer
Main client helpers:
- `lib/api.js`
- `lib/auth.js`

Clients in `lib/api.js`:
- `apiClient` -> sends `admin_token` for control-panel routes
- `userApiClient` -> sends `token` for user routes

## Local Storage Keys
- User app: `token`, `user`, `rememberMe`
- Control panel: `admin_token`, `admin_user`
- Theme: `solvesnest-theme`

## Project Structure
```text
client/
  app/          # App Router pages/layouts
  components/   # Shared and feature components
  lib/          # API and auth helpers
  public/       # Static assets
```

## Notes
- Many dashboard/problem/contest pages require a valid auth token.
- If backend URL is wrong, pages will fail with network/fetch errors.

## Troubleshooting
- CORS issue: match backend `CLIENT_URL` with frontend origin.
- OAuth issue: verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GITHUB_CLIENT_ID` and server OAuth keys.
