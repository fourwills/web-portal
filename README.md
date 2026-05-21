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

**Dev login** (mock mode, see `.env`): `demo` / `demo`

## Configuration

Copy `.env.example` to `.env`:

```
VITE_API_BASE_URL=https://portal.incorpus.in/api_dnl/v1
VITE_DEV_MOCK_AUTH=true
```

Change `VITE_API_BASE_URL` to point at any server — no code changes needed.

See `TEST_CREDENTIALS.md` for API login field names and real test accounts.

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
