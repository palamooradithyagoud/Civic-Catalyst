/**
 * OpenWeather API Client Service — Secured via Backend Proxy
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/inventory$/, "/weather")
  : "http://127.0.0.1:8000/api/weather";

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  wind_direction: string;
  wind_deg: number;
  rain_probability: number;
  rain_1h: number;
  cloudiness: number;
  pressure: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  updated_at: string;
}

export interface HourlyForecastItem {
  time: string;
  timestamp: number;
  temp: number;
  feels_like: number;
  condition: string;
  description: string;
  icon: string;
  rain_probability: number;
  wind_speed: number;
  humidity: number;
}

export interface DailyForecastItem {
  date: string;
  day_name: string;
  temp_min: number;
  temp_max: number;
  condition: string;
  description: string;
  icon: string;
  rain_probability: number;
  humidity: number;
  wind_speed: number;
  farming_advisory: string;
}

export interface WeatherResponse {
  success: boolean;
  location_name: string;
  state?: string;
  country?: string;
  coordinates: Coordinates;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  source: string;
  is_demo: boolean;
}

export interface LocationSearchResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

/**
 * Fetch live weather from backend OpenWeather proxy for specified lat/lon coordinates
 */
export async function fetchWeather(
  lat: number,
  lon: number,
  units = "metric"
): Promise<WeatherResponse> {
  const url = `${API_BASE_URL}/current?lat=${lat}&lon=${lon}&units=${units}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Weather service returned HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Search village or city locations by query text via backend Geocoding proxy
 */
export async function searchLocations(
  query: string
): Promise<LocationSearchResult[]> {
  if (!query || !query.trim()) return [];
  const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query.trim())}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Location search returned HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Reverse geocode latitude/longitude to location name via backend
 */
export async function reverseGeocodeWeather(
  lat: number,
  lon: number
): Promise<{ success: boolean; name: string; state?: string; country?: string }> {
  const url = `${API_BASE_URL}/reverse-geocode?lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Reverse geocode returned HTTP ${res.status}`);
  }
  return await res.json();
}
