# Travel Logger

A full-stack travel journal for logging past trips, organizing memories, tracking destinations, and planning future travel. Add completed trips, upcoming plans, and wishlist locations with notes, highlights, ratings, tags, and photo links.

This project was redesigned from a basic travel/weather app into a more practical TypeScript travel journal. Instead of showing current weather for old trips, it focuses on memories, planning, trip details, and searchable travel history. Weather is now context-aware: completed trips use a written weather memory, while planned trips within the next 10 days can display a live weather snapshot.

---

## Features
Recent additions are in **bold**
- Add, edit, view, and delete travel entries
- Track trips by **completed**, **planned**, or **wishlist** status
- Store trip title, location, country, start/end dates, travel type, rating, notes, highlights, favorite memory, weather memory, photo URL, and tags
- **Dashboard showing total trips, completed trips, planned trips, wishlist destinations, most recent trip, and favorite/highest-rated trip**
- **Search trips by title, location, notes, highlights, and memories**
- **Filter trips by status and tags**
- **Detailed trip modal for viewing memories, highlights, notes, ratings, and photos**
- **SQLite database with Prisma migrations for local SQL storage**
- **React + TypeScript frontend with a responsive travel-themed UI**
- **Express + TypeScript backend with REST API routes**
- **Current weather snapshots for planned trips within the next 10 days using Open-Meteo**
- Collapsible add/edit form to reduce page crowding
- Input validation for required fields, dates, statuses, and ratings

---

## Tech Stack
- React
- TypeScript
- Vite
- Node.js
- Express
- Prisma
- SQLite
- CSS

---

## Project Structure
```txt
travel-logger/
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   └── weather.ts
│   │   ├── routes/
│   │   │   └── trips.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── package.json
├── .gitignore
└── README.md
```

---

## How to Run
1. **Prerequisites**: Ensure you have Node.js installed.
2. **Download**: Clone or download this repository to your local machine.
3. **Install dependencies** from the root folder:
   ```bash
   npm install
   ```
4. **Create your server environment file**:
   ```bash
   cp server/.env.example server/.env
   ```
5. **Initialize the SQLite database**:
   ```bash
   npm run db:migrate
   ```
6. **Run the full app**:
   ```bash
   npm run dev
   ```

The frontend runs at:
```txt
http://localhost:5173
```

The backend API runs at:
```txt
http://localhost:5001/api
```

---

## Example Trip Entry
```txt
Title: Spring Break in Miami
Location: Miami, Florida
Country: United States
Status: Completed
Travel Type: Vacation
Rating: 5 stars
Tags: beach, food, friends
Highlights: South Beach, Cuban food, boat tour, and late-night walks
Favorite Memory: Watching the sunset from the pier
Weather Memory: Warm, sunny, and perfect beach weather
```

---

## API Routes
```txt
GET    /api/health
GET    /api/trips
GET    /api/trips/stats
GET    /api/trips/weather?location=City
GET    /api/trips/:id
POST   /api/trips
PUT    /api/trips/:id
DELETE /api/trips/:id
```

Query filters supported by `GET /api/trips`:
```txt
status=completed | planned | wishlist | all
search=keyword
tag=keyword
sort=newest | oldest
```

---

## Database
This project uses SQLite through Prisma, so no external database account is required.

The Prisma model stores:
- Trip details
- Dates and status
- Rating
- Notes and memories
- Photo URL
- Tags
- Created/updated timestamps

To open Prisma Studio:
```bash
npm run db:studio
```

---

## Deployment Notes
The easiest deployment path is:
- Frontend: Vercel
- Backend: Render
- Database: SQLite locally for development, then upgrade to PostgreSQL/Neon or Render PostgreSQL for production

For the GitHub portfolio version, this project works best as a local/full-stack demo with screenshots or a short demo video unless the backend is deployed.

---

## Future Improvements
- Deploy frontend publicly using Vercel
- Deploy backend API using Render
- Add production environment configuration for deployed frontend/backend
- Upgrade production database from SQLite to PostgreSQL
- Add user authentication
- Add map-based trip visualization
- Upload local photos instead of using photo URLs
- Add budget and expense tracking
- Add packing lists for planned trips
- Add forecast details for upcoming trips
- Add itinerary planning by day
- Add export to CSV or PDF
- Upgrade production database from SQLite to PostgreSQL

---

Built with ❤️ by Jacob


---

## Latest Polish Pass
Recent UI and product improvements include:
- Edit trip workflow now opens in its own modal instead of reusing the add-trip form
- Filters now use clear segmented controls for All, Completed, Planned, and Wishlist
- Planned trips within the next 10 days request a forecast for the trip start date
- Completed trips keep a written weather memory instead of pulling current weather
- Geocoding was made more reliable by using the primary city/place name for weather lookups
- Layout spacing, trip cards, dashboard sections, and modals were polished for a cleaner app feel
