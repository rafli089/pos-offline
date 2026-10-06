# Deploy Guide — Option 1: Vercel (Frontend) + Railway (Backend)

Monorepo tanpa root `package.json`; tiap layanan punya konfignya masing-masing.

## 1. Backend → Railway

Railway deploy otomatis dari GitHub via `railway.json` (Dockerfile di `server/Dockerfile`).

### 1.1 Set env vars (Railway → Settings → Variables)

```env
NODE_ENV=production
HOST=0.0.0.0          # Wajib: agar Railway healthcheck / container reachable
PORT=4000             # Railway override jika diperlukan
CORS_ORIGINS=https://<your-app>.vercel.app,http://localhost:5173
```

> Ganti `<your-app>.vercel.app` setelah deploy frontend selesai (lihat 2.3).

### 1.2 Deploy backend

- `railway login` (jika pakai CLI) atau hubungkan repo di dashboard Railway.
- Railway jalankan `Dockerfile` → container listening `0.0.0.0:4000` (atau `$PORT`).
- Health check: `GET https://<backend>.railway.app/health` → `{"status":"ok"}`.

### 1.3 Backend service URL

Setelah up, Railway akan kasih URL, contoh `https://<project>.railway.app`. Catat; dipakai di langkah 2.3.

## 2. Frontend → Vercel

`vercel.json` di repo root mengarahkan build ke `apps/pos`.

### 2.1 Set env vars (Vercel → Project Settings → Environment Variables)

| Name          | Value                                        | Environment  |
|---------------|----------------------------------------------|--------------|
| VITE_API_BASE | `https://<backend>.railway.app`              | Production   |

> Demo lokal pakai default `http://localhost:4000`; hanya set ini agar prod sync ke Railway.

### 2.2 Deploy frontend

- Hubungkan repo ke Vercel via dashboard (root directory = repo root; `vercel.json` handle `apps/pos`).
- Vercel build: `npm install` + `npm run build` di `apps/pos`, output `apps/pos/dist`.
- SPA fallback via `rewrites` sudah ada di `vercel.json`.

### 2.3 Dapatkan URL frontend

Setelah deploy, Vercel kasih URL `https://<your-app>.vercel.app`. Kembali ke 1.1, update `CORS_ORIGINS` dengan URL ini, redeploy backend (trigger otomatis).

## 3. Smoke test post-deploy

```bash
curl https://<backend>.railway.app/health
curl https://<backend>.railway.app/api/menu
```

Frontend: buka `https://<your-app>.vercel.app`, login `kasir1` / `1234`, lakukan order + payment → receipt. Sync engine akan POST `VITE_API_BASE/api/sync/upload` tiap 15s.

## 4. File deploy

| File                          | Purpose                                  |
|-------------------------------|------------------------------------------|
| `vercel.json`                 | Frontend build + SPA fallback            |
| `railway.json`                | Backend Dockerfile builder + healthcheck |
| `server/Dockerfile`           | Node 20 image, port 4000                 |
| `server/.dockerignore`        | Excludes node_modules + secrets          |
| `server/.env.example`         | Template env vars                        |
| `apps/pos/.env.production.example` | Template frontend env                |

## 5. Rollback (jika error build)

- Vercel: revert di "Deploys" tab.
- Railway: revert di "Deploys" tab atau ganti service plan ke sebelum deploy.

ponytail: migrate in-memory → PostgreSQL on Railway add-on (Database plugin) when ready; update `config.js` + schema `database/schema.ts`.
