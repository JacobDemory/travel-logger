# Deployment Notes

This file tracks where Travel Logger is deployed and what each platform is responsible for.

---

## Production Services

| Service | Platform | Purpose | Notes |
|---|---|---|---|
| Frontend | [Vercel](https://travel-logger-client.vercel.app/) | Hosts the React/Vite client | Uses `VITE_API_URL` |
| Backend API | [Render](https://travel-logger-api.onrender.com/) | Hosts the Express/TypeScript API | Uses Neon env vars |
| Health Check | [API health](https://travel-logger-api.onrender.com/api/health) | Confirms backend and database connectivity | A free service may need time to wake |
| Trips API | [Trips JSON](https://travel-logger-api.onrender.com/api/trips) | Confirms API/database reads | Public demo data only |
| Database | Neon | Hosts PostgreSQL database | Uses pooled + direct connection strings |

## Environment Variables

### Render Backend
```env
DATABASE_URL="Neon pooled connection string"
DIRECT_URL="Neon direct connection string"
CLIENT_URL="Vercel frontend URL"
NODE_ENV="production"
```

### Vercel Frontend
```env
VITE_API_URL="Render backend API URL ending in /api"
```

Real credentials and connection strings belong only in the Neon, Render, and
Vercel dashboards. They must never be committed to this repository.

## Deployment Checklist

- [x] Neon database created
- [x] Prisma schema uses PostgreSQL
- [x] Render backend has `DATABASE_URL`
- [x] Render backend has `DIRECT_URL`
- [x] Render backend has `CLIENT_URL`
- [x] Vercel frontend has `VITE_API_URL`
- [x] Render backend deploy succeeds
- [x] Vercel frontend deploy succeeds
- [x] `/api/health` works
- [x] `/api/trips` returns JSON
- [x] Frontend can add/edit/delete trips
- [x] Data persists after refresh
- [x] GitHub repo sidebar includes the public frontend URL

## Verification

The deployment was rechecked on July 22, 2026:

- Vercel frontend returned HTTP 200
- Render health endpoint returned HTTP 200 with a connected database
- Trips and dashboard statistics returned PostgreSQL-backed JSON
- Planned-trip weather returned an Open-Meteo forecast successfully
- The locked production build completed successfully
- `npm audit` reported zero known vulnerabilities after dependency updates

## Free-Tier Behavior

Render may spin down the API after inactivity. The first request can therefore
take longer than later requests. A brief wake-up delay is expected; a persistent
HTTP 500 response is not and should be investigated in the Render logs and Neon
dashboard.
