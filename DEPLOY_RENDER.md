# Deploy UC METC SILMS on Render (+ Vercel frontend)

**Frontend:** Vercel (already deployed)  
**API + Postgres:** Render  
**Email:** SendGrid  

---

## Part 1 — Push latest code to GitHub

```bash
cd "/path/to/UC-METC Coop- Alpha"
git add .
git commit -m "Add Render deployment config"
git push origin main
```

---

## Part 2 — Create PostgreSQL on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in with **GitHub**.
2. Click **New +** → **PostgreSQL**.
3. Settings:
   - **Name:** `uc-metc-silms-db`
   - **Database:** `uc_coop`
   - **User:** `uc_coop`
   - **Region:** choose closest to your users (e.g. Singapore if available, or US)
   - **Plan:** Free (dev) or Starter (production — no sleep)
4. Click **Create Database**.
5. When it’s **Available**, open the database → **Connections** → copy **External Database URL** (starts with `postgresql://`).

### Run the schema (required — fixes landing page `0+` / 500 errors)

On your computer (install `psql` if needed). **Only one file:**

```bash
psql "PASTE_EXTERNAL_DATABASE_URL" -f backend/src/database/schema.sql
```

Do not run the older files in `migrations/` or other `.sql` in this folder — they are historical and are already merged into `schema.sql`.

---

## Part 3 — Create the API (Web Service)

1. **New +** → **Web Service**.
2. Connect repository **UC-METC-Coop-Alpha** (same GitHub repo).
3. Settings:

| Field | Value |
|--------|--------|
| **Name** | `uc-metc-silms-api` |
| **Region** | Same as Postgres |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (sleeps when idle) or Starter (always on) |

4. **Advanced** → **Health Check Path:** `/health`

---

## Part 4 — Environment variables (API service)

In the Web Service → **Environment** → add:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Paste **External Database URL** from Part 2 (or link DB if Render offers “Add from database”) |
| `JWT_SECRET` | Long random string: `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | `30d` |
| `EMAIL_SERVICE` | `SendGrid` |
| `EMAIL_USER` | `apikey` |
| `EMAIL_PASSWORD` | Your SendGrid API key (`SG....`) |
| `EMAIL_FROM` | Verified sender in SendGrid (e.g. `ucmetc.ecc@gmail.com`) |
| `CORS_ORIGIN` | `https://uc-metc-coop-alpha.vercel.app` |
| `FRONTEND_URL` | `https://uc-metc-coop-alpha.vercel.app` |

Use your **exact** Vercel URL (no trailing slash).

Render sets `PORT` automatically — do not hardcode it.

5. Click **Create Web Service** and wait until deploy is **Live**.

6. Copy your API URL, e.g. `https://uc-metc-silms-api.onrender.com`

### Test the API

```bash
curl https://YOUR-SERVICE.onrender.com/health
curl https://YOUR-SERVICE.onrender.com/api/public/stats
```

Both should return JSON (stats may be `0` until you add users/products).

---

## Part 5 — Update Vercel (frontend)

1. [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**.
2. Set or update:

```env
VITE_API_URL=https://YOUR-SERVICE.onrender.com/api
```

3. **Deployments** → **Redeploy** (required — Vite bakes env at build time).

---

## Part 6 — Smoke test

| Test | Expected |
|------|----------|
| `https://YOUR-SERVICE.onrender.com/health` | `{"status":"ok",...}` |
| Vercel landing page stats | Numbers or `0+` (not 500) |
| Login / signup | Works after schema + users |
| Forgot password | Email via SendGrid |
| Notifications | WebSocket connects |

---

## Optional: Blueprint (one-click from repo)

1. **New +** → **Blueprint**.
2. Select repo **UC-METC-Coop-Alpha** (uses root `render.yaml`).
3. After creation, open the **Web Service** and add **Secret** env vars:  
   `JWT_SECRET`, `EMAIL_PASSWORD`, `EMAIL_FROM`, `CORS_ORIGIN`, `FRONTEND_URL`.
4. Run `schema.sql` on the new Postgres (Part 2).

---

## Free tier notes

- **Web Service (free):** spins down after ~15 min idle; first request may take 30–60s (cold start).
- **Postgres (free):** expires after 90 days on Render free DB — use Starter for production.
- For ~6000 users, use **Starter** plan on API (+ paid Postgres).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Root Directory must be `backend` |
| `ECONNREFUSED` / DB error | Set `DATABASE_URL`; run `schema.sql` |
| Landing stats 500 | Run `schema.sql` on the same DB as `DATABASE_URL` |
| CORS error | `CORS_ORIGIN` = exact Vercel URL |
| Cold start slow | Upgrade to Starter or use a uptime ping service |
| WebSocket fails | `FRONTEND_URL` set; redeploy API |

---

## Leave Railway

You can delete or pause the Railway project after Render works. Update nothing else on Railway once Vercel points to Render.
