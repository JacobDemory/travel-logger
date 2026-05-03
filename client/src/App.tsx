import { FormEvent, useEffect, useMemo, useState } from 'react';

type TripStatus = 'completed' | 'planned' | 'wishlist';

type Trip = {
  id: number;
  title: string;
  location: string;
  country: string | null;
  startDate: string;
  endDate: string | null;
  status: TripStatus;
  travelType: string | null;
  rating: number | null;
  notes: string | null;
  highlights: string | null;
  favoriteMemory: string | null;
  weatherMemory: string | null;
  photoUrl: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
};

type WeatherSnapshot = {
  location: string;
  temperature: number | null;
  high: number | null;
  low: number | null;
  precipitationChance: number | null;
  description: string;
  date: string | null;
  source: string;
};

type Stats = {
  totalTrips: number;
  completedTrips: number;
  plannedTrips: number;
  wishlistTrips: number;
  favoriteTrip: Trip | null;
  mostRecentTrip: Trip | null;
};

type TripForm = {
  title: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  travelType: string;
  rating: string;
  notes: string;
  highlights: string;
  favoriteMemory: string;
  weatherMemory: string;
  photoUrl: string;
  tags: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

const emptyForm: TripForm = {
  title: '',
  location: '',
  country: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  status: 'completed',
  travelType: '',
  rating: '',
  notes: '',
  highlights: '',
  favoriteMemory: '',
  weatherMemory: '',
  photoUrl: '',
  tags: '',
};

function parseLocalDate(value: string | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dateKey(value: string): string {
  return value.slice(0, 10);
}

function formatDate(value: string | null): string {
  const date = parseLocalDate(value);
  if (!date) return 'No date';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatRange(trip: Trip): string {
  if (!trip.endDate) return formatDate(trip.startDate);
  return `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;
}

function statusLabel(status: TripStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function tagsToArray(tags: string | null): string[] {
  if (!tags) return [];
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function tripToForm(trip: Trip): TripForm {
  return {
    title: trip.title,
    location: trip.location,
    country: trip.country ?? '',
    startDate: dateKey(trip.startDate),
    endDate: trip.endDate ? dateKey(trip.endDate) : '',
    status: trip.status,
    travelType: trip.travelType ?? '',
    rating: trip.rating?.toString() ?? '',
    notes: trip.notes ?? '',
    highlights: trip.highlights ?? '',
    favoriteMemory: trip.favoriteMemory ?? '',
    weatherMemory: trip.weatherMemory ?? '',
    photoUrl: trip.photoUrl ?? '',
    tags: trip.tags ?? '',
  };
}

function isWeatherEligible(trip: Trip): boolean {
  if (trip.status !== 'planned') return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseLocalDate(trip.startDate);
  if (!start) return false;
  start.setHours(0, 0, 0, 0);

  const diffDays = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 10;
}

function weatherLabel(weather?: WeatherSnapshot): string {
  if (!weather) return 'Forecast loading...';
  if (weather.high !== null || weather.low !== null) {
    const hi = weather.high !== null ? `${Math.round(weather.high)}°` : '—';
    const lo = weather.low !== null ? `${Math.round(weather.low)}°` : '—';
    return `${weather.description} • H ${hi} / L ${lo}`;
  }
  if (weather.temperature !== null) return `${weather.description} • ${Math.round(weather.temperature)}°F`;
  return weather.description;
}

function TripFormFields({ form, updateForm }: { form: TripForm; updateForm: <K extends keyof TripForm>(key: K, value: TripForm[K]) => void }) {
  return (
    <>
      <div className="form-grid three">
        <label>Trip Title<input required value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="Spring Break in Miami" /></label>
        <label>Location<input required value={form.location} onChange={(e) => updateForm('location', e.target.value)} placeholder="Miami, Florida" /></label>
        <label>Country<input value={form.country} onChange={(e) => updateForm('country', e.target.value)} placeholder="United States" /></label>
      </div>

      <div className="form-grid four">
        <label>Start Date<input type="date" required value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} /></label>
        <label>End Date<input type="date" value={form.endDate} onChange={(e) => updateForm('endDate', e.target.value)} /></label>
        <label>Status<select value={form.status} onChange={(e) => updateForm('status', e.target.value as TripStatus)}><option value="completed">Completed</option><option value="planned">Planned</option><option value="wishlist">Wishlist</option></select></label>
        <label>Rating<select value={form.rating} onChange={(e) => updateForm('rating', e.target.value)}><option value="">No rating</option><option value="1">1 star</option><option value="2">2 stars</option><option value="3">3 stars</option><option value="4">4 stars</option><option value="5">5 stars</option></select></label>
      </div>

      <div className="form-grid three">
        <label>Travel Type<input value={form.travelType} onChange={(e) => updateForm('travelType', e.target.value)} placeholder="Vacation, school, work, family, solo..." /></label>
        <label>Tags<input value={form.tags} onChange={(e) => updateForm('tags', e.target.value)} placeholder="beach, food, hiking" /></label>
        <label>Photo URL<input value={form.photoUrl} onChange={(e) => updateForm('photoUrl', e.target.value)} placeholder="https://example.com/photo.jpg" /></label>
      </div>

      <label>Weather Memory<input value={form.weatherMemory} onChange={(e) => updateForm('weatherMemory', e.target.value)} placeholder="For completed trips: sunny, rainy, cold, perfect beach weather..." /></label>

      <div className="form-grid three text-grid">
        <label>Highlights<textarea value={form.highlights} onChange={(e) => updateForm('highlights', e.target.value)} placeholder="Best places, activities, food, or moments..." /></label>
        <label>Favorite Memory<textarea value={form.favoriteMemory} onChange={(e) => updateForm('favoriteMemory', e.target.value)} placeholder="One moment you want to remember..." /></label>
        <label>Notes<textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Anything else about the trip..." /></label>
      </div>
    </>
  );
}

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [newTripForm, setNewTripForm] = useState<TripForm>(emptyForm);
  const [editForm, setEditForm] = useState<TripForm>(emptyForm);
  const [statusFilter, setStatusFilter] = useState<'all' | TripStatus>('all');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [weatherByTrip, setWeatherByTrip] = useState<Record<number, WeatherSnapshot>>({});
  const [weatherLoading, setWeatherLoading] = useState<Record<number, boolean>>({});

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    params.set('sort', sort);
    if (search.trim()) params.set('search', search.trim());
    if (tagFilter.trim()) params.set('tag', tagFilter.trim());
    return params.toString();
  }, [statusFilter, search, tagFilter, sort]);

  const upcomingTrip = useMemo(() => {
    return trips.filter(isWeatherEligible).sort((a, b) => parseLocalDate(a.startDate)!.getTime() - parseLocalDate(b.startDate)!.getTime())[0] ?? null;
  }, [trips]);

  async function loadTrips() {
    setLoading(true);
    try {
      const [tripsResponse, statsResponse] = await Promise.all([
        fetch(`${API_URL}/trips?${queryString}`),
        fetch(`${API_URL}/trips/stats`),
      ]);

      if (!tripsResponse.ok || !statsResponse.ok) throw new Error('Unable to load trips.');
      setTrips(await tripsResponse.json());
      setStats(await statsResponse.json());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTrips();
  }, [queryString]);

  useEffect(() => {
    const eligibleTrips = trips.filter(isWeatherEligible).slice(0, 6);
    eligibleTrips.forEach((trip) => {
      if (!weatherByTrip[trip.id] && !weatherLoading[trip.id]) void loadWeather(trip);
    });
  }, [trips, weatherByTrip, weatherLoading]);

  async function loadWeather(trip: Trip) {
    setWeatherLoading((current) => ({ ...current, [trip.id]: true }));
    try {
      const location = [trip.location, trip.country].filter(Boolean).join(', ');
      const params = new URLSearchParams({ location, date: dateKey(trip.startDate) });
      const response = await fetch(`${API_URL}/trips/weather?${params.toString()}`);
      if (!response.ok) throw new Error('Weather unavailable.');
      const weather = await response.json();
      setWeatherByTrip((current) => ({ ...current, [trip.id]: weather }));
    } catch {
      setWeatherByTrip((current) => ({
        ...current,
        [trip.id]: { location: trip.location, temperature: null, high: null, low: null, precipitationChance: null, description: 'Forecast unavailable', date: dateKey(trip.startDate), source: 'Open-Meteo' },
      }));
    } finally {
      setWeatherLoading((current) => ({ ...current, [trip.id]: false }));
    }
  }

  function updateNewForm<K extends keyof TripForm>(key: K, value: TripForm[K]) {
    setNewTripForm((current) => ({ ...current, [key]: value }));
  }

  function updateEditForm<K extends keyof TripForm>(key: K, value: TripForm[K]) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function openNewTripForm(status: TripStatus = 'completed') {
    setNewTripForm({ ...emptyForm, status });
    setShowNewForm(true);
  }

  function closeNewTripForm() {
    setShowNewForm(false);
    setNewTripForm(emptyForm);
  }

  function startEditing(trip: Trip) {
    setSelectedTrip(null);
    setEditingTrip(trip);
    setEditForm(tripToForm(trip));
  }

  function closeEditModal() {
    setEditingTrip(null);
    setEditForm(emptyForm);
  }

  function buildPayload(form: TripForm) {
    return {
      ...form,
      rating: form.rating ? Number(form.rating) : null,
      endDate: form.endDate || null,
    };
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(newTripForm)),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.errors?.join(' ') || data.error || 'Failed to add trip.');
      }
      closeNewTripForm();
      setMessage('Trip added successfully.');
      await loadTrips();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add trip.');
    }
  }

  async function handleEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingTrip) return;
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/trips/${editingTrip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(editForm)),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.errors?.join(' ') || data.error || 'Failed to update trip.');
      }
      closeEditModal();
      setWeatherByTrip((current) => {
        const copy = { ...current };
        delete copy[editingTrip.id];
        return copy;
      });
      setMessage('Trip updated successfully.');
      await loadTrips();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update trip.');
    }
  }

  async function deleteTrip(id: number) {
    if (!window.confirm('Delete this trip?')) return;
    try {
      const response = await fetch(`${API_URL}/trips/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete trip.');
      if (selectedTrip?.id === id) setSelectedTrip(null);
      if (editingTrip?.id === id) closeEditModal();
      setMessage('Trip deleted.');
      await loadTrips();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete trip.');
    }
  }

  function clearFilters() {
    setStatusFilter('all');
    setSearch('');
    setTagFilter('');
    setSort('newest');
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Travel Logger</p>
          <h1>Plan the next trip. Preserve the last one.</h1>
          <p className="hero-text">A full-stack travel journal for organizing completed trips, upcoming plans, wishlist destinations, memories, ratings, tags, and trip notes.</p>
          <div className="hero-actions">
            <button type="button" onClick={() => openNewTripForm('completed')}>Log completed trip</button>
            <button type="button" className="secondary" onClick={() => openNewTripForm('planned')}>Plan upcoming trip</button>
            <button type="button" className="ghost" onClick={() => openNewTripForm('wishlist')}>Add wishlist</button>
          </div>
        </div>

        <aside className="feature-card">
          <span className="feature-label">Upcoming Forecast</span>
          <strong>{upcomingTrip?.title ?? 'No forecast yet'}</strong>
          <p>{upcomingTrip ? `${upcomingTrip.location} • ${formatRange(upcomingTrip)}` : 'Add a planned trip dated within the next 10 days.'}</p>
          {upcomingTrip && (
            <div className="weather-card mini-weather">
              <span>{weatherLoading[upcomingTrip.id] ? 'Loading forecast...' : weatherLabel(weatherByTrip[upcomingTrip.id])}</span>
              {weatherByTrip[upcomingTrip.id]?.precipitationChance !== null && weatherByTrip[upcomingTrip.id]?.precipitationChance !== undefined && (
                <small>{weatherByTrip[upcomingTrip.id].precipitationChance}% rain chance</small>
              )}
            </div>
          )}
        </aside>
      </section>

      <section className="dashboard-grid" aria-label="Dashboard statistics">
        <article><span>Total Trips</span><strong>{stats?.totalTrips ?? 0}</strong></article>
        <article><span>Completed</span><strong>{stats?.completedTrips ?? 0}</strong></article>
        <article><span>Planned</span><strong>{stats?.plannedTrips ?? 0}</strong></article>
        <article><span>Wishlist</span><strong>{stats?.wishlistTrips ?? 0}</strong></article>
      </section>

      {message && <p className="message">{message}</p>}

      {showNewForm && (
        <section className="form-shell card">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">New Entry</p><h2>Add a trip</h2></div>
            <button type="button" className="secondary" onClick={closeNewTripForm}>Close</button>
          </div>
          <form className="trip-form" onSubmit={handleCreate}>
            <TripFormFields form={newTripForm} updateForm={updateNewForm} />
            <div className="button-row"><button type="submit">Add Trip</button></div>
          </form>
        </section>
      )}

      <section className="workspace">
        <aside className="side-panel card">
          <div className="section-heading">
            <p className="eyebrow">Explore</p>
            <h2>Trip Filters</h2>
          </div>

          <label className="filter-label">Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search titles, places, notes..." /></label>

          <div className="segmented-filter" role="group" aria-label="Filter by status">
            {(['all', 'completed', 'planned', 'wishlist'] as const).map((status) => (
              <button key={status} type="button" className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>
                {status === 'all' ? 'All' : statusLabel(status)}
              </button>
            ))}
          </div>

          <label className="filter-label">Sort<select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
          <label className="filter-label">Tag<input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="beach" /></label>

          <button type="button" className="ghost full" onClick={clearFilters}>Clear filters</button>

          <div className="mini-card">
            <span>Favorite Trip</span>
            <strong>{stats?.favoriteTrip?.title ?? 'Rate a trip'}</strong>
            <p>{stats?.favoriteTrip ? `${stats.favoriteTrip.location} • ${stats.favoriteTrip.rating}/5 stars` : 'Your highest-rated trip appears here.'}</p>
          </div>
        </aside>

        <section className="trip-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Collection</p><h2>Trip Board</h2></div>
            <button type="button" onClick={() => openNewTripForm()}>Add Trip</button>
          </div>

          {loading ? <p className="loading">Loading trips...</p> : (
            <div className="trip-list">
              {trips.length === 0 && <p className="empty-state">No trips match your filters yet.</p>}
              {trips.map((trip) => {
                const weather = weatherByTrip[trip.id];
                return (
                  <article className="trip-card" key={trip.id}>
                    <div className="trip-image-wrap">
                      {trip.photoUrl ? <img src={trip.photoUrl} alt={trip.title} /> : <div className="image-placeholder">🌎</div>}
                    </div>
                    <div className="trip-card-body">
                      <div className="trip-card-top">
                        <span className={`status-pill ${trip.status}`}>{statusLabel(trip.status)}</span>
                        {trip.rating && <span className="rating">{'★'.repeat(trip.rating)}</span>}
                      </div>
                      <h3>{trip.title}</h3>
                      <p className="location">{trip.location}{trip.country ? `, ${trip.country}` : ''}</p>
                      <p className="date-range">{formatRange(trip)}</p>

                      {isWeatherEligible(trip) && (
                        <div className="weather-card">
                          <span>{weatherLoading[trip.id] ? 'Checking forecast...' : weatherLabel(weather)}</span>
                          {weather?.precipitationChance !== null && weather?.precipitationChance !== undefined && <small>{weather.precipitationChance}% rain chance</small>}
                        </div>
                      )}

                      {trip.weatherMemory && trip.status === 'completed' && <p className="memory-note">Weather memory: {trip.weatherMemory}</p>}
                      {trip.travelType && <p className="travel-type">{trip.travelType}</p>}
                      <div className="tag-list">{tagsToArray(trip.tags).map((tag) => <span key={tag}>{tag}</span>)}</div>
                      <div className="button-row compact">
                        <button type="button" onClick={() => setSelectedTrip(trip)}>Details</button>
                        <button type="button" className="secondary" onClick={() => startEditing(trip)}>Edit</button>
                        <button type="button" className="danger" onClick={() => deleteTrip(trip.id)}>Delete</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {selectedTrip && (
        <div className="modal-backdrop" onClick={() => setSelectedTrip(null)}>
          <article className="trip-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedTrip(null)}>×</button>
            {selectedTrip.photoUrl && <img src={selectedTrip.photoUrl} alt={selectedTrip.title} />}
            <span className={`status-pill ${selectedTrip.status}`}>{statusLabel(selectedTrip.status)}</span>
            <h2>{selectedTrip.title}</h2>
            <p className="location">{selectedTrip.location}{selectedTrip.country ? `, ${selectedTrip.country}` : ''}</p>
            <p>{formatRange(selectedTrip)}</p>
            {isWeatherEligible(selectedTrip) && <div className="weather-card modal-weather"><span>{weatherLabel(weatherByTrip[selectedTrip.id])}</span></div>}
            {selectedTrip.rating && <p className="rating large">{'★'.repeat(selectedTrip.rating)}</p>}
            {selectedTrip.highlights && <section><h3>Highlights</h3><p>{selectedTrip.highlights}</p></section>}
            {selectedTrip.favoriteMemory && <section><h3>Favorite Memory</h3><p>{selectedTrip.favoriteMemory}</p></section>}
            {selectedTrip.weatherMemory && <section><h3>Weather Memory</h3><p>{selectedTrip.weatherMemory}</p></section>}
            {selectedTrip.notes && <section><h3>Notes</h3><p>{selectedTrip.notes}</p></section>}
            <div className="modal-actions"><button type="button" onClick={() => startEditing(selectedTrip)}>Edit Trip</button></div>
            <div className="tag-list">{tagsToArray(selectedTrip.tags).map((tag) => <span key={tag}>{tag}</span>)}</div>
          </article>
        </div>
      )}

      {editingTrip && (
        <div className="modal-backdrop" onClick={closeEditModal}>
          <article className="trip-modal edit-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={closeEditModal}>×</button>
            <p className="eyebrow">Edit Trip</p>
            <h2>{editingTrip.title}</h2>
            <form className="trip-form" onSubmit={handleEdit}>
              <TripFormFields form={editForm} updateForm={updateEditForm} />
              <div className="button-row"><button type="submit">Save Changes</button><button type="button" className="secondary" onClick={closeEditModal}>Cancel</button></div>
            </form>
          </article>
        </div>
      )}
    </main>
  );
}
