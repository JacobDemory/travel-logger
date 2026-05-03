import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getWeatherSnapshot } from '../lib/weather.js';

const router = Router();

const VALID_STATUSES = new Set(['completed', 'planned', 'wishlist']);

type TripInput = {
  title?: string;
  location?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  travelType?: string;
  rating?: number | string | null;
  notes?: string;
  highlights?: string;
  favoriteMemory?: string;
  weatherMemory?: string;
  photoUrl?: string;
  tags?: string;
};

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateTripInput(body: TripInput, isUpdate = false) {
  const errors: string[] = [];

  const title = cleanOptionalString(body.title);
  const location = cleanOptionalString(body.location);
  const startDateValue = cleanOptionalString(body.startDate);
  const endDateValue = cleanOptionalString(body.endDate);
  const status = cleanOptionalString(body.status) ?? 'completed';

  if (!isUpdate || body.title !== undefined) {
    if (!title) errors.push('Title is required.');
  }

  if (!isUpdate || body.location !== undefined) {
    if (!location) errors.push('Location is required.');
  }

  if (!isUpdate || body.startDate !== undefined) {
    if (!startDateValue || Number.isNaN(Date.parse(startDateValue))) {
      errors.push('A valid start date is required.');
    }
  }

  if (endDateValue && Number.isNaN(Date.parse(endDateValue))) {
    errors.push('End date must be valid when provided.');
  }

  if (startDateValue && endDateValue && !Number.isNaN(Date.parse(startDateValue)) && !Number.isNaN(Date.parse(endDateValue))) {
    if (new Date(endDateValue) < new Date(startDateValue)) {
      errors.push('End date cannot be before start date.');
    }
  }

  if (!VALID_STATUSES.has(status)) {
    errors.push('Status must be completed, planned, or wishlist.');
  }

  let rating: number | null = null;
  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push('Rating must be an integer from 1 to 5.');
    }
  }

  return {
    errors,
    data: {
      title,
      location,
      country: cleanOptionalString(body.country),
      startDate: startDateValue ? new Date(startDateValue) : undefined,
      endDate: endDateValue ? new Date(endDateValue) : null,
      status,
      travelType: cleanOptionalString(body.travelType),
      rating,
      notes: cleanOptionalString(body.notes),
      highlights: cleanOptionalString(body.highlights),
      favoriteMemory: cleanOptionalString(body.favoriteMemory),
      weatherMemory: cleanOptionalString(body.weatherMemory),
      photoUrl: cleanOptionalString(body.photoUrl),
      tags: cleanOptionalString(body.tags),
    },
  };
}

router.get('/', async (req, res) => {
  try {
    const { status, search, tag, sort = 'newest' } = req.query;

    const where: Record<string, unknown> = {};

    if (typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    if (typeof search === 'string' && search.trim()) {
      const query = search.trim();
      where.OR = [
        { title: { contains: query } },
        { location: { contains: query } },
        { country: { contains: query } },
        { notes: { contains: query } },
        { highlights: { contains: query } },
        { favoriteMemory: { contains: query } },
      ];
    }

    if (typeof tag === 'string' && tag.trim()) {
      where.tags = { contains: tag.trim() };
    }

    const orderBy = sort === 'oldest' ? { startDate: 'asc' as const } : { startDate: 'desc' as const };

    const trips = await prisma.trip.findMany({ where, orderBy });
    res.json(trips);
  } catch (error) {
    console.error('Failed to load trips:', error);
    res.status(500).json({ error: 'Failed to load trips.' });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const trips = await prisma.trip.findMany({ orderBy: { startDate: 'desc' } });
    const completed = trips.filter((trip) => trip.status === 'completed');
    const planned = trips.filter((trip) => trip.status === 'planned');
    const wishlist = trips.filter((trip) => trip.status === 'wishlist');
    const ratedTrips = trips.filter((trip) => typeof trip.rating === 'number');
    const favoriteTrip = ratedTrips.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;

    res.json({
      totalTrips: trips.length,
      completedTrips: completed.length,
      plannedTrips: planned.length,
      wishlistTrips: wishlist.length,
      favoriteTrip,
      mostRecentTrip: trips[0] ?? null,
    });
  } catch (error) {
    console.error('Failed to load stats:', error);
    res.status(500).json({ error: 'Failed to load dashboard stats.' });
  }
});


router.get('/weather', async (req, res) => {
  const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
  const date = typeof req.query.date === 'string' ? req.query.date.trim() : undefined;

  if (!location) {
    return res.status(400).json({ error: 'Location is required.' });
  }

  try {
    const weather = await getWeatherSnapshot(location, date);
    return res.json(weather);
  } catch (error) {
    console.error('Failed to load weather:', error);
    return res.status(500).json({ error: 'Failed to load weather.' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid trip id.' });
  }

  const trip = await prisma.trip.findUnique({ where: { id } });

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  return res.json(trip);
});

router.post('/', async (req, res) => {
  const { errors, data } = validateTripInput(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const trip = await prisma.trip.create({
      data: {
        title: data.title!,
        location: data.location!,
        country: data.country,
        startDate: data.startDate!,
        endDate: data.endDate,
        status: data.status,
        travelType: data.travelType,
        rating: data.rating,
        notes: data.notes,
        highlights: data.highlights,
        favoriteMemory: data.favoriteMemory,
        weatherMemory: data.weatherMemory,
        photoUrl: data.photoUrl,
        tags: data.tags,
      },
    });

    return res.status(201).json(trip);
  } catch (error) {
    console.error('Failed to create trip:', error);
    return res.status(500).json({ error: 'Failed to create trip.' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid trip id.' });
  }

  const { errors, data } = validateTripInput(req.body, true);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const trip = await prisma.trip.update({
      where: { id },
      data: Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
    });

    return res.json(trip);
  } catch (error) {
    console.error('Failed to update trip:', error);
    return res.status(500).json({ error: 'Failed to update trip.' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid trip id.' });
  }

  try {
    await prisma.trip.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('Failed to delete trip:', error);
    return res.status(500).json({ error: 'Failed to delete trip.' });
  }
});

export default router;
