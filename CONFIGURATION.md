# Client Portal — Configuration Guide

This document explains **where to change settings** when you move the API, update server IPs, or redeploy the portal. No application code changes are required for normal configuration.

---

## 1. API base URL

The portal talks to the DNL **Client Portal API**. All login, billing, trunks, rates, and DIDs data use this base URL.

**Default (production):** `https://portal.incorpus.in/api_dnl/v1`

### Where to change it

| Environment | What to edit | Notes |
|-------------|--------------|--------|
| **Local development** | `client-portal/.env` | Copy from `.env.example` if missing. Key: `VITE_API_BASE_URL` |
| **Production build (Vercel)** | Vercel → Project → **Settings** → **Environment Variables** | Variable name: `VITE_API_BASE_URL` |
| **Production build (fallback)** | `client-portal/.env.production` | Used when Vercel env vars are not set |
| **Local dev proxy target** | `client-portal/vite.config.js` | Only if you use a **relative** URL like `/api_dnl/v1` (see below) |

### Two ways to set the URL

**Option A — Relative path (recommended on Vercel)**

```env
VITE_API_BASE_URL=/api_dnl/v1
```

The browser calls your portal host (e.g. `https://web-portal-azure.vercel.app/api_dnl/v1/...`).  
Vercel forwards those requests using **`vercel.json`**:

```json
"destination": "https://portal.incorpus.in/api_dnl/v1/:path*"
```

If you change the **real API server**, update **both**:

1. `VITE_API_BASE_URL` (usually keep `/api_dnl/v1`)
2. `vercel.json` → `rewrites` → `destination` → your new API host

**Option B — Full URL (direct to API)**

```env
VITE_API_BASE_URL=https://your-api.example.com/api_dnl/v1
```

The portal calls the API host directly. The API must allow **CORS** from your portal domain (e.g. `https://web-portal-azure.vercel.app`).

For **local dev** with a full URL, you can skip the Vite proxy or point `vite.config.js` `proxy.target` at your API host.

### Rules

- Use the path **`/api_dnl/v1`** only — do **not** include `/auth/login` in the base URL.
- Login is `POST {base}/auth` with body `{ "email_or_name", "password" }`.
- After any change: **rebuild and redeploy** (Vite bakes env vars in at build time).

```powershell
cd client-portal
npm run build
```

On Vercel: push to git or trigger **Redeploy** after changing environment variables.

### Verify at build time

The build script prints the resolved URL:

```text
OK  VITE_API_BASE_URL=/api_dnl/v1 (.env.production)
```

---

## 2. IP addresses

There are **three different “IP” concepts** in the portal. Change the right one depending on what you mean.

### A. Our platform IPs (provider / switch side)

**What clients see:** Account → **Our platform IPs**  
**Source:** Configuration only — **not** loaded from the API  
**Who changes it:** You (provider), when your switch/server IP is known

| Where to change | How |
|-----------------|-----|
| **Build / deploy** | Environment variable `VITE_PLATFORM_IPS` |
| **Local** | `client-portal/.env` or `.env.production` |
| **Vercel** | Settings → Environment Variables → `VITE_PLATFORM_IPS` |

**Format (comma-separated, optional port):**

```env
# Single IP
VITE_PLATFORM_IPS=163.172.118.64

# IP with SIP port
VITE_PLATFORM_IPS=163.172.118.64:5060

# Multiple
VITE_PLATFORM_IPS=163.172.118.64:5060,203.0.113.1:5060
```

Default port is **5060** if omitted.

After changing: **rebuild and redeploy** (same as API URL).

**Code reference:** `src/utils/platformIps.js` reads `import.meta.env.VITE_PLATFORM_IPS`.

---

### B. Client egress IP (customer side — DID / trunk auth)

**What clients see:** Trunks → **Egress trunk** or **Registered IPs** → **Edit IP**  
**Source:** DNL API (`PATCH /home/client/egress_trunk/{id}`)  
**Who changes it:** The **client** in the portal, or **you** in DNL admin

Clients update their own authorized host IP from the portal. You do **not** set this in `.env`.

If a client cannot edit IPs, configure the trunk in **DNL admin** (Add Host on egress trunk).

**Code reference:** `src/pages/Trunks.jsx`, `src/services/trunkService.js`

---

### C. Client default IPs (account defaults from API)

**What clients see:** Account → **Your default IPs**  
**Source:** API `GET /home/client/default_ip/list`  
**Who changes it:** DNL admin / back office — not portal env files

---

## 3. Quick reference

| Setting | Variable / file | Portal location | Redeploy after change? |
|---------|-----------------|-----------------|------------------------|
| API base URL | `VITE_API_BASE_URL` | All sections | **Yes** |
| API proxy (relative URL) | `vercel.json` rewrites | Behind the scenes | **Yes** (redeploy) |
| Platform IPs | `VITE_PLATFORM_IPS` | Account → Our platform IPs | **Yes** |
| Client egress IP | API / admin | Trunks → Edit IP | No (live API) |
| Mock login (dev only) | `VITE_DEV_MOCK_AUTH` | Login page | **Yes** |

---

## 4. File checklist

```
client-portal/
├── .env                 # Local overrides (not committed — use .env.example as template)
├── .env.example         # Template for developers
├── .env.production      # Default production values (committed)
├── vercel.json          # Proxy /api_dnl/v1 → real API when using relative base URL
├── vite.config.js       # Local dev proxy target (portal.incorpus.in)
└── src/utils/platformIps.js   # Reads VITE_PLATFORM_IPS
```

---

## 5. Vercel deployment reminder

1. Repository root may be `WebPortal`; set Vercel **Root Directory** to **`client-portal`**.
2. Set or confirm environment variables, then **Redeploy**.
3. Production URL example: `https://web-portal-azure.vercel.app`

For API documentation (paths, auth header), see Swagger:  
`https://portal.incorpus.in/api_dnl/v1/swagger.json`

---

## 6. Support contacts (typical workflow)

| Task | Action |
|------|--------|
| New API server hostname | Update `VITE_API_BASE_URL` and/or `vercel.json`, redeploy |
| New platform / switch IP for all clients | Update `VITE_PLATFORM_IPS`, redeploy |
| One client’s SIP source IP | Client uses **Trunks → Edit IP**, or you set host in DNL admin |
| New DID / trunk / billing behavior | Usually DNL admin + API permissions — not portal env |
