# Client Portal

Responsive client portal for the DNL API (`ClientPortal` + `Auth` endpoints).

**Operations guide (API URL, platform IPs, client egress IPs):** see **[CONFIGURATION.md](./CONFIGURATION.md)**.

## Prerequisites

- **Node.js 22+** and **npm** on your PATH

## First-time environment setup (Windows)

If PowerShell says **running scripts is disabled** when you run `npm`, use **`npm.cmd`** instead (same commands, e.g. `npm.cmd run dev`).

If `npm` is not recognized or `nvm use` shows **Access is denied**, run once in PowerShell:

```powershell
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

## Self-hosting (not only Vercel)

This is a **static React app** (`npm run build` → `dist/`). It runs the same on:

| Host | How |
|------|-----|
| **Vercel / Netlify / Cloudflare Pages** | Connect repo, set env vars, deploy `dist` |
| **Your IIS / Apache / nginx server** | Copy `dist/` to the web root; enable SPA fallback to `index.html` (same as `vercel.json` rewrites) |
| **Internal LAN** | Host `dist` on any internal HTTP server; set `VITE_API_BASE_URL` to your API IP/hostname |

Requirements for any host:

1. HTTPS recommended (browsers + payment gateways)
2. API server must allow **CORS** from your portal origin (or serve portal and API on the same domain via reverse proxy)
3. `VITE_API_BASE_URL` points at your DNL API (e.g. `https://portal.incorpus.in/api_dnl/v1`)

Vercel is only hosting the **frontend**; all data still comes from your DNL API backend.

## Portal sections

| Section | API |
|---------|-----|
| Account | Profile, API keys, **platform IPs** (`VITE_PLATFORM_IPS`), default IPs |
| Billing | Invoices; Stripe (card number + expiry → `POST /home/client/payment`, same as [classic portal](https://portal.incorpus.in/#/clients/billing/online_payment)); PayPal SDK |
| Trunks | Registered host IPs from trunk `ip[]`; routing via `/home/client/trunk/{id}/prefix/list`; ingress/egress lists |
| Rates | Primary: trunk routing (`rate_table_name`, `tech_prefix`); fallback global `rate_table/list`, `rate/list`; CSV export (API or client-side) |
| DIDs | `did/list`, release, `did_api/search_local`, `did_api/order_local` (see [CONFIGURATION.md](./CONFIGURATION.md)) |

## Configuration

See **[CONFIGURATION.md](./CONFIGURATION.md)** for:

- Changing **API base URL** (`.env`, Vercel env vars, `vercel.json`)
- Changing **platform IPs** (`VITE_PLATFORM_IPS`)
- **Client egress IPs** (Trunks → Edit IP in the portal)

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
