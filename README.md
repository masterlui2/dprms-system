# DPRMS

DOST Project and Resource Management System monorepo.

## Stack

- Laravel 12 API in `backend/`
- React 19 + TypeScript + Vite UI in `frontend/`
- PostgreSQL
- Laravel Sanctum
- Tailwind CSS
- React Router
- Axios

## Local URLs

- Backend API: `http://127.0.0.1:8000/api`
- Frontend UI: `http://127.0.0.1:5173`
- API test route: `http://127.0.0.1:8000/api/test`

## Backend

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

The backend is configured for PostgreSQL with these local defaults:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=dprms
DB_USERNAME=postgres
DB_PASSWORD=
```

## Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

The frontend API base URL is configured in `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Verification

```bash
cd frontend
npm run build
npm run lint
```

## Demo role accounts

Run the Laravel seeders to create one local account for each DPRMS role:

```bash
cd backend
php artisan db:seed
```

All demo accounts use `Dprms@123`:

- `admin@dost.gov.ph` — System Administrator
- `staff@dost.gov.ph` — Project Staff
- `focal@dost.gov.ph` — Focal (Reviewer)
- `director@dost.gov.ph` — Provincial Director
- `rpmo@dost.gov.ph` — RPMO (Regional Viewer)
- `proponent@dost.gov.ph` — Proponent / Beneficiary
