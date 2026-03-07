# Backend

This folder contains a standalone Node.js backend for the app.

## Run

1. Open terminal in `backend`
2. Install dependencies:

```bash
npm install
```

3. (Optional) create `.env` from `.env.example` and set values.
4. Start server:

```bash
npm run dev
```

Default URL: `http://localhost:5175`

## Smoke test

Run an end-to-end API smoke check (memory mode) across hospital/public/pharmacy/admin/blockchain flows:

```bash
npm run smoke
```

## Main APIs

- `GET /health`
- `GET /api/hospitals`
- `POST /api/auth/hospital-login`
- `POST /api/auth/fingerprint-enroll`
- `POST /api/auth/fingerprint-verify`
- `GET /api/alerts?hospitalId=1`
- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- `POST /api/report-analysis`
- `GET /api/report-referrals?hospitalId=1`
- `POST /api/report-referrals`
- `GET /api/blockchain/records?limit=50`
- `GET /api/blockchain/verify`
- `POST /api/blockchain/records`

## Persistence modes

- Default mode is in-memory (`MYSQL_ENABLED=false`) so backend works without MySQL.
- Set `MYSQL_ENABLED=true` to persist:
  - fingerprint enrollments
  - emergency alerts and timer state
  - report referrals
  - blockchain audit chain blocks
- Health endpoint includes current backend mode: `memory` or `mysql`.
- Backend now validates env config on startup and exits with clear errors for invalid values.
- Backend supports graceful shutdown (closes timers and DB pool cleanly).

## MySQL setup

1. Create database and tables:

```bash
mysql -u root -p < sql/schema.sql
```

2. Configure `.env`:

```env
MYSQL_ENABLED=true
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=medirescue
```

3. Restart backend and verify:

```bash
curl http://localhost:5175/health
```

Response contains `"mode":"mysql"` when DB is active.
