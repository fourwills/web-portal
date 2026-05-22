# Client Portal — Configuration Guide

This guide explains **how to change the API base URL** and **how IP addresses work** in the portal — both for **operators** (build/deploy settings) and for **end clients** (self-service in the UI).

No application code changes are needed for normal configuration.

---

## Summary: what changes where

| What you want to change | Who changes it | Where | Redeploy portal? |
|-------------------------|----------------|-------|------------------|
| **API server URL** | Operator / developer | `.env`, `.env.production`, `.env.hostverge`, or Vercel env vars | **Yes** |
| **Our platform IPs** (switch/provider side) | Operator | `VITE_PLATFORM_IPS` at build time | **Yes** |
| **Client trunk IPs** (ingress or egress) | Client (or admin in DNL) | Portal → **Trunks** → **Edit IPs** | **No** (live API) |
| **Client default IPs** | Admin in DNL | Back office / API | **No** |

---

## 1. Change API base URL

The portal calls the DNL **Client Portal API** for login, billing, trunks, rates, and DIDs.

**Default API:** `https://portal.incorpus.in/api_dnl/v1`

### Rules

- Use only the base path **`/api_dnl/v1`** — do **not** add `/auth/login`.
- Login is `POST {base}/auth` with `{ "email_or_name", "password" }`.
- Vite **bakes** `VITE_API_BASE_URL` into the build. After any change you must **rebuild and redeploy**.

---

### 1a. Local development

1. Copy `.env.example` to `.env` if you do not have one.
2. Edit **`client-portal/.env`**:

```env
# Option 1 — relative URL (uses Vite dev proxy in vite.config.js)
VITE_API_BASE_URL=/api_dnl/v1

# Option 2 — full URL (calls API directly; API must allow CORS from http://localhost:5174)
VITE_API_BASE_URL=https://portal.incorpus.in/api_dnl/v1
```

3. If you use `/api_dnl/v1` locally, the proxy target is in **`vite.config.js`** (`server.proxy['/api_dnl/v1'].target`). Change that when the real API host moves.

4. Run:

```powershell
cd client-portal
npm run dev
```

---

### 1b. Production on Vercel

| Step | Action |
|------|--------|
| 1 | Vercel → your project → **Settings** → **Environment Variables** |
| 2 | Set **`VITE_API_BASE_URL`** (Production, and Preview if needed) |
| 3 | **Redeploy** the project |

**Relative URL (recommended on Vercel):**

```env
VITE_API_BASE_URL=/api_dnl/v1
```

The browser calls your Vercel app; **`vercel.json`** proxies to the real API:

```json
"destination": "https://portal.incorpus.in/api_dnl/v1/:path*"
```

If the **API hostname** changes, update **both**:

1. `VITE_API_BASE_URL` (usually keep `/api_dnl/v1`)
2. `vercel.json` → `rewrites` → `destination`

**Full URL (no proxy):**

```env
VITE_API_BASE_URL=https://your-api.example.com/api_dnl/v1
```

The API must allow **CORS** from your Vercel URL (e.g. `https://web-portal-azure.vercel.app`).

**Fallback file (if Vercel env vars are empty):** `client-portal/.env.production`

```powershell
npm run build
```

---

### 1c. Production on Hostverge / cPanel (`portal.thevoiptalk.com`)

Shared hosting **cannot** use `vercel.json`. Use a **full API URL** in **`client-portal/.env.hostverge`**:

```env
VITE_API_BASE_URL=https://portal.incorpus.in/api_dnl/v1
```

Build and upload:

```powershell
cd client-portal
npm run build:hostverge
```

Upload everything inside **`dist/`** to the subdomain document root. See **[DEPLOYMENT_HOSTVERGE.md](./DEPLOYMENT_HOSTVERGE.md)**.

**CORS:** The API must allow origin **`https://portal.thevoiptalk.com`**.

---

### 1d. Verify the URL was applied

After `npm run build` or `npm run build:hostverge`, the console should show:

```text
OK  VITE_API_BASE_URL=https://portal.incorpus.in/api_dnl/v1 (.env.hostverge)
```

Hostverge builds also check that the bundle uses an absolute API URL (not `/api_dnl/v1` only).

---

## 2. Change IP addresses

There are **four** IP-related concepts. Use the right one.

---

### 2a. Our platform IPs (provider / switch — all clients)

**Purpose:** Show clients which **your** platform/switch IPs they should use (not loaded from the API).

**Where clients see it:** **Account** → **Our platform IPs**

**Who changes it:** Operator / provider before deploy

| Hosting | File / setting |
|---------|----------------|
| Local dev | `client-portal/.env` → `VITE_PLATFORM_IPS` |
| Vercel | Environment variable **`VITE_PLATFORM_IPS`** |
| Default production file | `client-portal/.env.production` |
| Hostverge | `client-portal/.env.hostverge` → `VITE_PLATFORM_IPS` |

**Format (comma-separated; optional `:port`, default port 5060):**

```env
VITE_PLATFORM_IPS=163.172.118.64
VITE_PLATFORM_IPS=163.172.118.64:5060
VITE_PLATFORM_IPS=163.172.118.64:5060,203.0.113.1:5060
```

**After change:** rebuild and redeploy (`npm run build`, `npm run build:hostverge`, or Vercel redeploy).

**Code:** `src/utils/platformIps.js` → Account `NetworkIpsSection.jsx`

---

### 2b. Client trunk IPs — ingress and egress (per client, in the portal)

**Purpose:** Register the **client’s** public IP(s) on their trunks for SIP/DID traffic.

**Where clients see it:**

| Screen | Action |
|--------|--------|
| **Trunks** → **Ingress trunks** | **Edit IPs** on each ingress trunk |
| **Trunks** → **Egress trunks** | **Edit IPs** on each egress trunk |
| **Trunks** → **Registered IPs** | **Edit IPs** (opens editor for that trunk) |

**Who changes it:** The **logged-in client** in the portal (or you in **DNL admin** if the API denies client PATCH).

**Not in `.env`** — changes go live via API; **no portal redeploy** needed.

| Trunk type | API (client self-service) |
|------------|---------------------------|
| Ingress | `GET` / `PATCH` `/home/client/ingress_trunk/{id}` |
| Egress | `GET` / `PATCH` `/home/client/egress_trunk/{id}` |

**Code:** `src/pages/Trunks.jsx`, `src/services/trunkService.js`, `src/components/Trunks/EgressIpEditorModal.jsx`

If **Edit IPs** fails with **403**, enable client trunk host updates in DNL admin or set hosts in admin (**Add Host** on the trunk).

---

### 2c. Client default IPs (account defaults from API)

**Where clients see it:** **Account** → **Your default IPs**

**Source:** `GET /home/client/default_ip/list`

**Who changes it:** DNL admin / back office — **not** portal env files or the Trunks editor.

---

## 3. Quick reference by hosting

| Setting | Vercel | Hostverge (`build:hostverge`) | Local dev |
|---------|--------|-------------------------------|-----------|
| API URL | Vercel env + optional `vercel.json` | `.env.hostverge` | `.env` + optional `vite.config.js` proxy |
| Platform IPs | Vercel env `VITE_PLATFORM_IPS` | `.env.hostverge` | `.env` |
| Client trunk IPs | Portal UI only | Portal UI only | Portal UI only |
| Build command | `npm run build` | `npm run build:hostverge` | `npm run dev` |

---

## 4. File checklist

```
client-portal/
├── .env                 # Local overrides (gitignored; copy from .env.example)
├── .env.example         # Template
├── .env.production      # Vercel / default production (relative API URL)
├── .env.hostverge       # Hostverge build (full API URL + platform IPs)
├── vercel.json          # API proxy when VITE_API_BASE_URL=/api_dnl/v1
├── vite.config.js       # Local dev proxy target
├── public/.htaccess     # SPA routing on Apache (included in dist/)
└── src/utils/platformIps.js
```

---

## 5. Common tasks (step-by-step)

### Move API to a new server

1. Set `VITE_API_BASE_URL` to `https://NEW-HOST/api_dnl/v1` (or keep `/api_dnl/v1` on Vercel and update `vercel.json` destination).
2. Rebuild (`npm run build` or `npm run build:hostverge`).
3. Redeploy / re-upload `dist/`.
4. Ask API admin to allow **CORS** from your portal domain(s).

### Show a new platform / switch IP to all clients

1. Edit `VITE_PLATFORM_IPS` in the correct env file (see §2a).
2. Rebuild and redeploy.

### Let one client update their SIP source IP

1. Client logs in → **Trunks** → **Ingress trunks** or **Egress trunks** → **Edit IPs**.
2. Enter IP and port (default 5060) → **Save IPs**.
3. If forbidden, fix permissions or add host in DNL admin.

---

## 6. Related docs

| Topic | Document |
|-------|----------|
| **PDF (configuration + Hostverge deploy)** | `docs/Client-Portal-Configuration-Guide.pdf` — generate with `npm run docs:pdf` |
| Hostverge deploy (`portal.thevoiptalk.com`) | [DEPLOYMENT_HOSTVERGE.md](./DEPLOYMENT_HOSTVERGE.md) |
| Dev setup & tests | [README.md](./README.md) |
| API auth field names | [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md) |

**Swagger:** `https://portal.incorpus.in/api_dnl/v1/swagger.json`

---

## 7. Vercel reminder

1. Set Vercel **Root Directory** to **`client-portal`** if the repo root is `WebPortal`.
2. Set `VITE_API_BASE_URL` and `VITE_PLATFORM_IPS`, then **Redeploy**.
3. Example URL: `https://web-portal-azure.vercel.app`
