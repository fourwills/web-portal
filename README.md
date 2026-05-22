# Client Portal

Responsive client portal for the DNL API (`ClientPortal` + `Auth` endpoints).

## Prerequisites

- **Node.js 22+** and **npm** on your PATH

## First-time environment setup (Windows)

If PowerShell says **running scripts is disabled** when you run `npm`, use **`npm.cmd`** instead (same commands, e.g. `npm.cmd run dev`).

If `npm` is not recognized or `nvm use` shows **Access is denied**, run once in PowerShell:

```powershell
cd e:\Development\Projects\WebPortal\client-portal
.\scripts\setup-env.ps1
```

Then **close and reopen** your terminal (so PATH reloads).

This script:

1. Ensures Node 22.22.0 is installed via nvm
2. Creates a junction at `%APPDATA%\nvm\nodejs` (no admin required)
3. Adds that folder to your **user** PATH

## Quick start

PowerShell may block `npm` (execution policy). Use **`npm.cmd`** or the helper scripts:

```powershell
cd e:\Development\Projects\WebPortal\client-portal
npm.cmd install
npm.cmd run dev
```

Or use the helper script (sets PATH for this session):

```powershell
.\scripts\dev.ps1
```

Or double-click / run **`dev.bat`** (bypasses PowerShell `npm.ps1` restrictions entirely).

Run automated checks (build + API auth):

```powershell
npm.cmd run test
```

Open **http://localhost:5174** (dev server uses port 5174 by default; if busy, Vite picks the next free port and prints it in the terminal)

**Production login:** use client credentials on the login page (no demo account when `VITE_DEV_MOCK_AUTH=false`).

## Deploy on Vercel

1. Set the project **Root Directory** to `client-portal` (if the repo root is `WebPortal`).
2. **Optional:** In Vercel → **Settings → Environment Variables**, override defaults:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://portal.incorpus.in/api_dnl/v1` |
| `VITE_DEV_MOCK_AUTH` | `false` |

If these are not set, the build uses committed `.env.production` (same values).

3. Redeploy after changing env vars (Vite bakes them in at build time).

CORS on the production API already allows `https://web-portal-azure.vercel.app`.

## Configuration

Copy `.env.example` to `.env`:

```
VITE_API_BASE_URL=https://portal.incorpus.in/api_dnl/v1
VITE_DEV_MOCK_AUTH=false
```

Change `VITE_API_BASE_URL` to point at any server — no code changes needed.

**Swagger (API reference, not a runtime dependency):**

- Production: `https://portal.incorpus.in/api_dnl/v1/swagger.json`
- Dev/staging: `https://v6dev.denovolab.com/api_dnl/v1/swagger.json` (separate server; credentials may differ)

Swagger documents paths, request bodies, and the `X-Auth-Token` header. The portal does not load swagger at runtime.

See `TEST_CREDENTIALS.md` for API login field names.

### Live API smoke test

```powershell
$env:TEST_USER='your_username'
$env:TEST_PASS='your_password'
npm.cmd run test
```

## Build

```powershell
npm run build
```

Output: `dist/`

## Project structure

```
src/
  config/api.js          # Axios + base URL
  services/              # API calls by domain
  context/AuthContext.jsx
  pages/                 # Login, Dashboard, …
  components/Layout/     # Sidebar, protected routes
```
