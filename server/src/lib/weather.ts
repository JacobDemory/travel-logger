export interface WeatherSnapshot {
  location: string;
  temperature: number | null;
  high: number | null;
  low: number | null;
  precipitationChance: number | null;
  description: string;
  date: string | null;
  source: string;
}

interface GeoResult {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface GeoResponse {
  results?: GeoResult[];
}

interface WeatherResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
  };
}

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm'
};

function normalizeLocationQuery(location: string): string {
  // Open-Meteo geocoding works much better with the city/place first.
  // Example: "Miami, Florida, United States" -> "Miami"
  return location.split(',')[0]?.trim() || location.trim();
}

function emptyWeather(location: string, date: string | null, description = 'Weather unavailable'): WeatherSnapshot {
  return {
    location,
    temperature: null,
    high: null,
    low: null,
    precipitationChance: null,
    description,
    date,
    source: 'Open-Meteo'
  };
}

export async function getWeatherSnapshot(location: string, date?: string): Promise<WeatherSnapshot> {
  const query = normalizeLocationQuery(location);

  const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geoUrl.searchParams.set('name', query);
  geoUrl.searchParams.set('count', '1');
  geoUrl.searchParams.set('language', 'en');
  geoUrl.searchParams.set('format', 'json');

  const geoResponse = await fetch(geoUrl);
  if (!geoResponse.ok) return emptyWeather(location, date ?? null);

  const geoData = (await geoResponse.json()) as GeoResponse;
  const place = geoData.results?.[0];

  if (!place) return emptyWeather(location, date ?? null, 'Location not found');

  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
  forecastUrl.searchParams.set('latitude', String(place.latitude));
  forecastUrl.searchParams.set('longitude', String(place.longitude));
  forecastUrl.searchParams.set('current', 'temperature_2m,weather_code');
  forecastUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  forecastUrl.searchParams.set('temperature_unit', 'fahrenheit');
  forecastUrl.searchParams.set('forecast_days', '11');

  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) return emptyWeather(location, date ?? null);

  const forecastData = (await forecastResponse.json()) as WeatherResponse;
  const resolvedLocation = [place.name, place.admin1, place.country].filter(Boolean).join(', ');

  if (date && forecastData.daily?.time?.length) {
    const dayIndex = forecastData.daily.time.findIndex((day) => day === date);

    if (dayIndex >= 0) {
      const code = forecastData.daily.weather_code?.[dayIndex] ?? -1;
      return {
        location: resolvedLocation,
        temperature: null,
        high: forecastData.daily.temperature_2m_max?.[dayIndex] ?? null,
        low: forecastData.daily.temperature_2m_min?.[dayIndex] ?? null,
        precipitationChance: forecastData.daily.precipitation_probability_max?.[dayIndex] ?? null,
        description: weatherDescriptions[code] ?? 'Forecast unavailable',
        date,
        source: 'Open-Meteo'
      };
    }
  }

  const code = forecastData.current?.weather_code ?? -1;
  return {
    location: resolvedLocation,
    temperature: forecastData.current?.temperature_2m ?? null,
    high: null,
    low: null,
    precipitationChance: null,
    description: weatherDescriptions[code] ?? 'Current weather unavailable',
    date: null,
    source: 'Open-Meteo'
  };
}
