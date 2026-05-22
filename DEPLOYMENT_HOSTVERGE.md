# Deploy client portal on Hostverge (`portal.thevoiptalk.com`)

This portal is a **static React site** (Vite `dist/` folder). Hostverge (cPanel) serves HTML/JS/CSS only — there is no Node.js server in production.

**Live URL target:** `https://portal.thevoiptalk.com`  
**Control panel:** `https://cp.hostverge.com/`

---

## Before you start

1. **Unlock FTP** in Hostverge (required for automated deploy): [cp.hostverge.com](https://cp.hostverge.com/) → **Manage Hosting** → your package → **Unlock FTP** (15–60 minutes). Use the password from **FTP Details** in that package (may differ from your client-area login).
2. **Do not upload** `.env`, source code, or `node_modules` to the web root — only the **`dist/`** output after `npm run build`.
3. **Change your cPanel password** if it was shared in email or chat.
4. Ask your **DNL/API provider** to allow **CORS** from `https://portal.thevoiptalk.com` if the API is on another host (see step 4).

---

## Step 1 — Create the subdomain in cPanel

1. Log in to [https://cp.hostverge.com/](https://cp.hostverge.com/).
2. Open **Domains** → **Subdomains** (or **Create a New Domain** / **Addon Domain** depending on skin).
3. Create subdomain: **`portal`**
   - Full name: `portal.thevoiptalk.com`
   - Document root: note the path shown (often something like  
     `public_html/portal.thevoiptalk.com` or `public_html/portal`).
4. Open **SSL/TLS Status** (or **AutoSSL**) and ensure a certificate is issued for `portal.thevoiptalk.com`.
5. Enable **Force HTTPS** if available (Redirects or “Always use HTTPS”).

### DNS (if the subdomain is new)

If `thevoiptalk.com` DNS is managed at Hostverge, cPanel usually adds records automatically.

If DNS is elsewhere (Cloudflare, registrar, etc.), add:

| Type | Name | Value |
|------|------|--------|
| **A** | `portal` | Your Hostverge server IP (from cPanel → **Server Information**) |
| or **CNAME** | `portal` | Hostname Hostverge gives you |

Wait until DNS propagates (minutes to a few hours). Test: `https://portal.thevoiptalk.com` should show a default page or empty folder.

---

## Step 2 — Build the project on your PC

Open PowerShell in the project folder:

```powershell
cd e:\Development\Projects\Cursor\WebPortal\client-portal
npm install
npm run build:hostverge
```

This uses **`.env.hostverge`** (full API URL, platform IPs, Apache `.htaccess` in `dist/`).

You should see:

```text
OK  VITE_API_BASE_URL=https://portal.incorpus.in/api_dnl/v1 (environment)
...
OK  .htaccess for Apache SPA
OK  API URL is absolute (Hostverge)
```

Output folder: **`client-portal/dist/`** — upload everything inside it. See **`dist/UPLOAD-README.txt`** after each build.

Edit **`.env.hostverge`** if the API host or platform IPs change, then run `npm run build:hostverge` again.

Optional check locally:

```powershell
npm run preview
```

---

## Step 3 — Upload `dist/` to the subdomain folder

### Option A — cPanel File Manager

1. **File Manager** → open the subdomain **document root** from step 1.
2. Delete default `index.html` / placeholder files if present.
3. Upload **everything inside** `dist/` (not the `dist` folder itself):
   - `index.html`
   - `assets/` (entire folder)
   - `.htaccess` (enable “Show Hidden Files” in File Manager settings)
   - any other files from `dist/`

### Option B — FTP (Hostverge: `ftp.hostverge.com`)

1. Unlock FTP in **Manage Hosting** (see above).
2. Host: **`ftp.hostverge.com`**, port **21**, user/password from **FTP Details**.
3. Upload `dist/*` into the subdomain document root.

**Automated (after FTP unlock):**

```powershell
$env:FTP_USER = "your_ftp_username"   # from FTP Details, not always your email
$env:FTP_PASS = "your_ftp_password"   # from FTP Details
npm run deploy:hostverge
```

### Option C — ZIP upload (no FTP)

```powershell
npm run build:hostverge
npm run package:hostverge
```

Upload **`hostverge-upload.zip`** in cPanel **File Manager** → subdomain folder → **Extract** (show hidden files so `.htaccess` is included).

---

## Step 4 — CORS on the API server

The browser will call `https://portal.incorpus.in/api_dnl/v1` from `https://portal.thevoiptalk.com`. That is a **cross-origin** request.

Your API admin must allow:

- **Origin:** `https://portal.thevoiptalk.com`
- **Headers:** `X-Auth-Token`, `Content-Type`, etc. (as required by your API)

If login fails with a CORS error in the browser console (F12 → Network), fix CORS on the API — not in the React app.

---

## Step 5 — Test the live site

1. Open `https://portal.thevoiptalk.com`
2. Hard refresh: `Ctrl+F5`
3. Log in with a real client account.
4. Check **Account**, **Billing**, **Trunks**, **DIDs**.

### Common issues

| Symptom | Fix |
|---------|-----|
| 404 on `/dashboard` or refresh | `.htaccess` missing or `mod_rewrite` off — re-upload `public/.htaccess` via rebuild |
| Blank page | Wrong folder (uploaded `dist` as subfolder) — files must be in document **root** |
| Login/network error, CORS in console | API must whitelist `https://portal.thevoiptalk.com` |
| Old UI after deploy | Clear browser cache; confirm you uploaded new `assets/*.js` |
| SSL warning | Run AutoSSL / Let’s Encrypt for `portal.thevoiptalk.com` |

---

## Step 6 — Updates later

Whenever you change code or env (API URL, platform IPs):

1. Edit `.env.hostverge` if needed, then `npm run build:hostverge`
2. Upload **all** new files from `dist/` (overwrite old `assets/`).
3. Do **not** need to reinstall npm on the server.

---

## Configuration reference

| What | Where |
|------|--------|
| API base URL at build | `.env.hostverge` → `VITE_API_BASE_URL` → `npm run build:hostverge` |
| Platform IPs at build | `.env.hostverge` → `VITE_PLATFORM_IPS` |
| Client trunk IPs (ingress/egress) | Portal → **Trunks** → **Edit IPs** (live API; no redeploy) |
| Full guide (API URL, all IP types, Vercel vs Hostverge) | [CONFIGURATION.md](./CONFIGURATION.md) |

---

## What not to do on Hostverge

- Do not run `npm run dev` on shared hosting for production.
- Do not commit passwords or upload `.env` to `public_html`.
- Do not expect `vercel.json` to work — it is **Vercel-only**; use full API URL + CORS on Hostverge.

---

## Quick checklist

- [ ] Subdomain `portal.thevoiptalk.com` created in cPanel  
- [ ] SSL active, HTTPS forced  
- [ ] Built with `npm run build:hostverge`  
- [ ] Uploaded contents of `dist/` to subdomain document root  
- [ ] `.htaccess` present for SPA routing  
- [ ] API CORS allows `https://portal.thevoiptalk.com`  
- [ ] Login and main sections tested live  
