# Deployment Notes

This file tracks where Travel Logger is deployed and what each platform is responsible for.

---

## Production Services

| Service | Platform | Purpose | Notes |
|---|---|---|---|
| Frontend | Vercel | Hosts the React/Vite client | Uses `VITE_API_URL` |
| Backend API | Render | Hosts the Express/TypeScript API | Uses Neon env vars |
| Health Check | `https://your-render-api-url.onrender.com/api/health` | Confirms backend is live |
| Trips API | `https://your-render-api-url.onrender.com/api/trips` | Confirms API/database connection |
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
