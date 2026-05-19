# UC METC SILMS — Deployment Guide

Follow these steps in order. Repo: **Vinzz290034/UC-METC-Coop-Alpha**

---

## Step 1 — Push code to GitHub

```bash
git status   # no FINAL COOP.mp4, no .env
git add .
git commit -m "Production-ready: Cloudinary video, deploy config"
git push origin main
```

---

## Step 2 — PostgreSQL database

### Option A: Railway Postgres (easiest)

1. [railway.app](https://railway.app) → **New Project** → **Provision PostgreSQL**
2. Open the Postgres service → **Connect** → copy `DATABASE_URL`

### Option B: Neon

1. [neon.tech](https://neon.tech) → create project → copy connection string

### Run schema

```bash
psql "YOUR_DATABASE_URL" -f backend/src/database/schema.sql
```

Optional migrations (if not already applied):

```bash
psql "YOUR_DATABASE_URL" -f backend/src/database/add_reference_number_migration.sql
psql "YOUR_DATABASE_URL" -f backend/src/database/add_unique_id_number_constraint.sql
psql "YOUR_DATABASE_URL" -f backend/src/database/create_stock_intake_table.sql
psql "YOUR_DATABASE_URL" -f backend/src/database/migrations/add-notifications-table.sql
```

---

## Step 3 — Deploy backend (Railway)

1. **New Project** → **Deploy from GitHub repo** → select your repo
2. Click the new service → **Settings**:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. **Networking** → **Generate Domain** → note URL, e.g. `https://uc-metc-api-production.up.railway.app`
4. **Variables** (paste and edit):

```env
NODE_ENV=production
PORT=5000

DATABASE_URL=<from Step 2>

JWT_SECRET=<run: openssl rand -base64 48>
JWT_EXPIRES_IN=30d

CORS_ORIGIN=https://YOUR-FRONTEND.vercel.app
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app

EMAIL_SERVICE=gmail
EMAIL_USER=ucmetc.ecc@gmail.com
EMAIL_PASSWORD=<gmail-app-password>
EMAIL_FROM=ucmetc.ecc@gmail.com
```

5. Deploy → open `https://YOUR-API-DOMAIN/health` → should return `{"status":"ok",...}`

> Update `CORS_ORIGIN` and `FRONTEND_URL` after Step 4 if you used a placeholder.

---

## Step 4 — Deploy frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New Project** → import GitHub repo
2. **Root Directory:** `.` (repository root)
3. **Framework:** Vite
4. **Environment Variables:**

```env
VITE_API_URL=https://YOUR-API-DOMAIN/api
```

5. Deploy → note URL, e.g. `https://uc-metc-silms.vercel.app`
6. Go back to Railway → set `CORS_ORIGIN` and `FRONTEND_URL` to your Vercel URL → **Redeploy** backend

---

## Step 5 — Smoke test

| Test | Pass? |
|------|-------|
| `GET /health` on API | |
| Landing page loads | |
| Login / signup | |
| Forgot password email | |
| Notification bell (WebSocket) | |
| Merchandise / cart | |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | `CORS_ORIGIN` must match Vercel URL exactly (no trailing `/`) |
| API 404 | `VITE_API_URL` must end with `/api` |
| WebSocket fails | `FRONTEND_URL` set; redeploy backend |
| DB error | Check `DATABASE_URL`; run schema |
| Email fails | Vars in **Railway backend** service, not root `.env` |

---

## Costs (approx.)

| Service | ~6000 users |
|---------|-------------|
| Vercel (frontend) | Free tier usually enough |
| Railway (API + DB) | ~$5–20/mo after free credit |
| Cloudinary | Video + images already hosted |
| Gmail / SendGrid | Free tier for moderate email volume |
