# Deployment Notes

This file tracks where Travel Logger is deployed and what each platform is responsible for.

## Production Services

| Service | Platform | Purpose | Notes |
|---|---|---|---|
| Frontend | Vercel | Hosts the React/Vite client | Uses `VITE_API_URL` |
| Backend API | Render | Hosts the Express/TypeScript API | Uses Neon env vars |
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

- [ ] Neon database created
- [ ] Prisma schema uses PostgreSQL
- [ ] Render backend has `DATABASE_URL`
- [ ] Render backend has `DIRECT_URL`
- [ ] Render backend has `CLIENT_URL`
- [ ] Vercel frontend has `VITE_API_URL`
- [ ] Render backend deploy succeeds
- [ ] Vercel frontend deploy succeeds
- [ ] `/api/health` works
- [ ] `/api/trips` returns JSON
- [ ] Frontend can add/edit/delete trips
- [ ] Data persists after refresh
