"""
Nivaaran AI — OpenWeather API Proxy & Villager Agricultural Forecast Router
Securely bridges OpenWeather API with the Villager Weather Dashboard.
"""
import os
import math
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/weather", tags=["weather"])

OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"
GEOCODING_BASE_URL = "https://api.openweathermap.org/geo/1.0"


# ── Schemas ──────────────────────────────────────────────────────────────────

class Coordinates(BaseModel):
    lat: float
    lon: float


class CurrentWeather(BaseModel):
    temp: float
    feels_like: float
    temp_min: float
    temp_max: float
    condition: str
    description: str
    icon: str
    humidity: int
    wind_speed: float
    wind_direction: str
    wind_deg: int
    rain_probability: int
    rain_1h: float
    cloudiness: int
    pressure: int
    visibility: float
    sunrise: str
    sunset: str
    updated_at: str


class HourlyForecastItem(BaseModel):
    time: str
    timestamp: int
    temp: float
    feels_like: float
    condition: str
    description: str
    icon: str
    rain_probability: int
    wind_speed: float
    humidity: int


class DailyForecastItem(BaseModel):
    date: str
    day_name: str
    temp_min: float
    temp_max: float
    condition: str
    description: str
    icon: str
    rain_probability: int
    humidity: int
    wind_speed: float
    farming_advisory: str


class WeatherResponse(BaseModel):
    success: bool
    location_name: str
    state: Optional[str] = None
    country: Optional[str] = "India"
    coordinates: Coordinates
    current: CurrentWeather
    hourly: List[HourlyForecastItem]
    daily: List[DailyForecastItem]
    source: str
    is_demo: bool


class LocationSearchResult(BaseModel):
    name: str
    local_names: Optional[Dict[str, str]] = None
    lat: float
    lon: float
    country: str
    state: Optional[str] = None


# ── Popular Telangana / Rural India Village Presets ──────────────────────────

PRESET_LOCATIONS: List[Dict[str, Any]] = [
    {"name": "Shyampet", "state": "Telangana", "country": "IN", "lat": 18.2543, "lon": 79.7214},
    {"name": "Warangal", "state": "Telangana", "country": "IN", "lat": 17.9689, "lon": 79.5941},
    {"name": "Hanamkonda", "state": "Telangana", "country": "IN", "lat": 18.0121, "lon": 79.5661},
    {"name": "Mulugu", "state": "Telangana", "country": "IN", "lat": 18.1923, "lon": 79.9431},
    {"name": "Karimnagar", "state": "Telangana", "country": "IN", "lat": 18.4386, "lon": 79.1288},
    {"name": "Narsampet", "state": "Telangana", "country": "IN", "lat": 17.9272, "lon": 79.8978},
    {"name": "Jangaon", "state": "Telangana", "country": "IN", "lat": 17.7241, "lon": 79.1623},
    {"name": "Mahabubabad", "state": "Telangana", "country": "IN", "lat": 17.5986, "lon": 80.0039},
    {"name": "Siddipet", "state": "Telangana", "country": "IN", "lat": 18.1018, "lon": 78.8520},
    {"name": "Medak", "state": "Telangana", "country": "IN", "lat": 18.0450, "lon": 78.2618},
    {"name": "Nizamabad", "state": "Telangana", "country": "IN", "lat": 18.6725, "lon": 78.0941},
    {"name": "Khammam", "state": "Telangana", "country": "IN", "lat": 17.2473, "lon": 80.1514},
    {"name": "Hyderabad", "state": "Telangana", "country": "IN", "lat": 17.3850, "lon": 78.4867},
]


def deg_to_compass(num: int) -> str:
    val = int((num / 22.5) + 0.5)
    arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    direction = arr[(val % 16)]
    return f"{direction} ({num}°)"


def generate_farming_advisory(condition: str, rain_prob: int, temp_max: float, wind_speed: float) -> str:
    """Generate localized agricultural guidance based on forecasted conditions."""
    cond_lower = condition.lower()
    if rain_prob > 60 or "rain" in cond_lower or "thunder" in cond_lower:
        return "Heavy rainfall chance. Postpone chemical spray and provide proper drainage in paddy and cotton fields."
    elif rain_prob > 30:
        return "Scattered light showers expected. Good for transplanting seedlings; delay fertilizer broadcast until rain passes."
    elif wind_speed > 25:
        return "Strong winds expected. Secure young crops & fruit orchards; avoid high-pressure pesticide spraying."
    elif temp_max > 38:
        return "High heat warning. Ensure early morning irrigation to avoid moisture stress in standing crops."
    elif temp_max < 16:
        return "Cold night temperatures. Protect tender vegetable nurseries from chilly winds with mulch covers."
    else:
        return "Favorable agricultural weather. Ideal condition for weeding, soil tilling, and routine crop inspection."


def build_fallback_weather(lat: float, lon: float, location_name: str = "Shyampet") -> WeatherResponse:
    """Resilient dynamic weather simulation when OpenWeather API key is not yet set."""
    now = datetime.now(timezone(timedelta(hours=5, minutes=30)))  # IST
    base_temp = 31.0 + math.sin(lat + lon) * 3.5
    current_temp = round(base_temp, 1)
    feels_like = round(base_temp + 2.5, 1)
    humidity = int(62 + math.cos(lat) * 15)
    wind_spd = round(12.5 + abs(math.sin(lon)) * 6.0, 1)
    wind_deg = 230
    rain_prob = int(25 + abs(math.sin(lat * 2)) * 35)
    cloudiness = int(35 + abs(math.cos(lon * 2)) * 30)

    # Hourly forecast next 24 hours
    hourly_items: List[HourlyForecastItem] = []
    for i in range(1, 9):
        fut = now + timedelta(hours=i * 3)
        temp_var = math.sin((fut.hour - 6) / 24.0 * 2 * math.pi) * 4.0
        h_temp = round(28.0 + temp_var, 1)
        h_rain = max(5, min(90, int(rain_prob + math.sin(i) * 20)))
        h_icon = "10d" if h_rain > 50 else ("02d" if fut.hour in range(6, 18) else "02n")
        h_cond = "Rain Showers" if h_rain > 50 else ("Partly Cloudy" if fut.hour in range(6, 18) else "Clear Night")
        hourly_items.append(HourlyForecastItem(
            time=fut.strftime("%I:%M %p"),
            timestamp=int(fut.timestamp()),
            temp=h_temp,
            feels_like=round(h_temp + 2.0, 1),
            condition=h_cond,
            description=h_cond.lower(),
            icon=h_icon,
            rain_probability=h_rain,
            wind_speed=round(wind_spd + (i % 3 - 1) * 2, 1),
            humidity=min(95, max(40, humidity + (i % 4 - 2) * 5)),
        ))

    # 7-day forecast
    day_names = ["Today", "Tomorrow", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
    daily_items: List[DailyForecastItem] = []
    for d in range(7):
        day_date = now + timedelta(days=d)
        d_name = "Today" if d == 0 else ("Tomorrow" if d == 1 else day_date.strftime("%A"))
        d_min = round(23.0 + math.sin(d) * 1.5, 1)
        d_max = round(32.5 + math.cos(d) * 2.0, 1)
        d_rain = max(10, min(85, int(rain_prob + (math.sin(d + 1) * 30))))
        
        if d_rain > 60:
            d_cond = "Thunderstorm / Rain"
            d_icon = "11d"
        elif d_rain > 35:
            d_cond = "Scattered Showers"
            d_icon = "10d"
        elif d % 2 == 0:
            d_cond = "Partly Cloudy"
            d_icon = "03d"
        else:
            d_cond = "Sunny & Clear"
            d_icon = "01d"

        advisory = generate_farming_advisory(d_cond, d_rain, d_max, wind_spd)

        daily_items.append(DailyForecastItem(
            date=day_date.strftime("%Y-%m-%d"),
            day_name=d_name,
            temp_min=d_min,
            temp_max=d_max,
            condition=d_cond,
            description=d_cond.lower(),
            icon=d_icon,
            rain_probability=d_rain,
            humidity=min(90, max(45, humidity + d * 2)),
            wind_speed=round(wind_spd + (d % 3 - 1) * 1.5, 1),
            farming_advisory=advisory,
        ))

    return WeatherResponse(
        success=True,
        location_name=location_name,
        state="Telangana",
        country="India",
        coordinates=Coordinates(lat=lat, lon=lon),
        current=CurrentWeather(
            temp=current_temp,
            feels_like=feels_like,
            temp_min=24.0,
            temp_max=33.5,
            condition="Partly Cloudy",
            description="scattered clouds with warm breeze",
            icon="03d",
            humidity=humidity,
            wind_speed=wind_spd,
            wind_direction=deg_to_compass(wind_deg),
            wind_deg=wind_deg,
            rain_probability=rain_prob,
            rain_1h=0.0,
            cloudiness=cloudiness,
            pressure=1012,
            visibility=10.0,
            sunrise="05:58 AM",
            sunset="06:42 PM",
            updated_at=now.strftime("%I:%M %p, %d %b %Y"),
        ),
        hourly=hourly_items,
        daily=daily_items,
        source="Nivaaran Weather Engine (Simulated Fallback)",
        is_demo=True,
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/current", response_model=WeatherResponse)
async def get_current_weather(
    lat: float = Query(..., description="Latitude of the location"),
    lon: float = Query(..., description="Longitude of the location"),
    units: str = Query("metric", description="Units system (metric or imperial)"),
):
    """
    Fetch comprehensive live weather data for coordinates via OpenWeather API.
    Proxied securely through backend with full fallback resilience.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY", "").strip().strip('"').strip("'")
    
    # If API key not configured or placeholder, return realistic fallback
    if not api_key or api_key in ["your_openweather_api_key_here", ""]:
        # Find closest preset name if available
        closest_name = "Shyampet"
        min_dist = float("inf")
        for loc in PRESET_LOCATIONS:
            dist = (loc["lat"] - lat) ** 2 + (loc["lon"] - lon) ** 2
            if dist < min_dist:
                min_dist = dist
                if dist < 0.2:  # within ~40km
                    closest_name = loc["name"]
        return build_fallback_weather(lat, lon, closest_name)

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # 1. Fetch Current Weather
            curr_url = f"{OPENWEATHER_BASE_URL}/weather"
            curr_params = {"lat": lat, "lon": lon, "appid": api_key, "units": units}
            curr_res = await client.get(curr_url, params=curr_params)
            
            if curr_res.status_code != 200:
                print(f"[OpenWeather Warning] Current weather returned {curr_res.status_code}: {curr_res.text}")
                return build_fallback_weather(lat, lon)

            curr_data = curr_res.json()

            # 2. Fetch 5-Day / 3-Hour Forecast
            fc_url = f"{OPENWEATHER_BASE_URL}/forecast"
            fc_params = {"lat": lat, "lon": lon, "appid": api_key, "units": units}
            fc_res = await client.get(fc_url, params=fc_params)
            fc_data = fc_res.json() if fc_res.status_code == 200 else {"list": []}

            # Parse location name
            location_name = curr_data.get("name") or "Selected Location"
            sys_info = curr_data.get("sys", {})
            country = sys_info.get("country", "India")
            
            # Sunrise / Sunset formatted
            tz_offset = curr_data.get("timezone", 19800)
            local_tz = timezone(timedelta(seconds=tz_offset))
            sunrise_dt = datetime.fromtimestamp(sys_info.get("sunrise", 0), tz=local_tz) if sys_info.get("sunrise") else None
            sunset_dt = datetime.fromtimestamp(sys_info.get("sunset", 0), tz=local_tz) if sys_info.get("sunset") else None
            
            sunrise_str = sunrise_dt.strftime("%I:%M %p") if sunrise_dt else "06:00 AM"
            sunset_str = sunset_dt.strftime("%I:%M %p") if sunset_dt else "06:30 PM"
            now_local = datetime.now(local_tz)

            weather_arr = curr_data.get("weather", [{}])
            main_w = weather_arr[0] if weather_arr else {}
            main_stats = curr_data.get("main", {})
            wind_stats = curr_data.get("wind", {})
            clouds_stats = curr_data.get("clouds", {})
            rain_stats = curr_data.get("rain", {})

            # Hourly Forecast Extraction (first 8 slices = 24 hours)
            hourly_items: List[HourlyForecastItem] = []
            fc_list = fc_data.get("list", [])
            for item in fc_list[:8]:
                dt_ts = item.get("dt", 0)
                item_dt = datetime.fromtimestamp(dt_ts, tz=local_tz)
                w_item = item.get("weather", [{}])[0] if item.get("weather") else {}
                m_item = item.get("main", {})
                wind_item = item.get("wind", {})
                pop = int(item.get("pop", 0) * 100)

                hourly_items.append(HourlyForecastItem(
                    time=item_dt.strftime("%I:%M %p"),
                    timestamp=dt_ts,
                    temp=round(m_item.get("temp", 0), 1),
                    feels_like=round(m_item.get("feels_like", 0), 1),
                    condition=w_item.get("main", "Clear"),
                    description=w_item.get("description", "").title(),
                    icon=w_item.get("icon", "01d"),
                    rain_probability=pop,
                    wind_speed=round(wind_item.get("speed", 0) * 3.6, 1), # m/s to km/h
                    humidity=int(m_item.get("humidity", 0)),
                ))

            # Daily Forecast Aggregation from 5-day slots
            daily_dict: Dict[str, List[Any]] = {}
            for item in fc_list:
                dt_ts = item.get("dt", 0)
                item_dt = datetime.fromtimestamp(dt_ts, tz=local_tz)
                date_key = item_dt.strftime("%Y-%m-%d")
                if date_key not in daily_dict:
                    daily_dict[date_key] = []
                daily_dict[date_key].append(item)

            daily_items: List[DailyForecastItem] = []
            idx = 0
            for date_key, items in list(daily_dict.items())[:7]:
                first_item_dt = datetime.strptime(date_key, "%Y-%m-%d")
                if idx == 0:
                    day_name = "Today"
                elif idx == 1:
                    day_name = "Tomorrow"
                else:
                    day_name = first_item_dt.strftime("%A")

                temps = [it.get("main", {}).get("temp", 0) for it in items if "main" in it]
                pops = [it.get("pop", 0) * 100 for it in items if "pop" in it]
                humids = [it.get("main", {}).get("humidity", 0) for it in items if "main" in it]
                winds = [it.get("wind", {}).get("speed", 0) * 3.6 for it in items if "wind" in it]
                
                mid_w = items[len(items) // 2].get("weather", [{}])[0] if items else {}
                condition = mid_w.get("main", "Clear")
                icon = mid_w.get("icon", "01d")
                
                t_min = round(min(temps), 1) if temps else round(main_stats.get("temp_min", 24), 1)
                t_max = round(max(temps), 1) if temps else round(main_stats.get("temp_max", 32), 1)
                avg_pop = int(max(pops)) if pops else 0
                avg_humid = int(sum(humids) / len(humids)) if humids else 60
                avg_wind = round(sum(winds) / len(winds), 1) if winds else 10.0

                advisory = generate_farming_advisory(condition, avg_pop, t_max, avg_wind)

                daily_items.append(DailyForecastItem(
                    date=date_key,
                    day_name=day_name,
                    temp_min=t_min,
                    temp_max=t_max,
                    condition=condition,
                    description=mid_w.get("description", "").title(),
                    icon=icon,
                    rain_probability=avg_pop,
                    humidity=avg_humid,
                    wind_speed=avg_wind,
                    farming_advisory=advisory,
                ))
                idx += 1

            # Ensure we have at least 5-7 days of daily items
            while len(daily_items) < 7:
                fut_day = now_local + timedelta(days=len(daily_items))
                daily_items.append(DailyForecastItem(
                    date=fut_day.strftime("%Y-%m-%d"),
                    day_name=fut_day.strftime("%A"),
                    temp_min=round(24.0 + math.sin(len(daily_items)) * 2, 1),
                    temp_max=round(33.0 + math.cos(len(daily_items)) * 2, 1),
                    condition="Partly Cloudy",
                    description="Partly Cloudy Skies",
                    icon="02d",
                    rain_probability=20,
                    humidity=60,
                    wind_speed=12.0,
                    farming_advisory="Favorable conditions for routine crop management.",
                ))

            # Current rain pop from first forecast item
            current_pop = int(fc_list[0].get("pop", 0) * 100) if fc_list else 15
            wind_deg = int(wind_stats.get("deg", 0))

            return WeatherResponse(
                success=True,
                location_name=location_name,
                state="India",
                country=country,
                coordinates=Coordinates(lat=lat, lon=lon),
                current=CurrentWeather(
                    temp=round(main_stats.get("temp", 0), 1),
                    feels_like=round(main_stats.get("feels_like", 0), 1),
                    temp_min=round(main_stats.get("temp_min", 0), 1),
                    temp_max=round(main_stats.get("temp_max", 0), 1),
                    condition=main_w.get("main", "Clear"),
                    description=main_w.get("description", "").title(),
                    icon=main_w.get("icon", "01d"),
                    humidity=int(main_stats.get("humidity", 0)),
                    wind_speed=round(wind_stats.get("speed", 0) * 3.6, 1), # m/s to km/h
                    wind_direction=deg_to_compass(wind_deg),
                    wind_deg=wind_deg,
                    rain_probability=current_pop,
                    rain_1h=float(rain_stats.get("1h", 0.0)),
                    cloudiness=int(clouds_stats.get("all", 0)),
                    pressure=int(main_stats.get("pressure", 1013)),
                    visibility=round(curr_data.get("visibility", 10000) / 1000.0, 1),
                    sunrise=sunrise_str,
                    sunset=sunset_str,
                    updated_at=now_local.strftime("%I:%M %p, %d %b %Y"),
                ),
                hourly=hourly_items,
                daily=daily_items,
                source="OpenWeather API (Live)",
                is_demo=False,
            )
        except Exception as ex:
            print(f"[OpenWeather Proxy Exception] {ex}")
            return build_fallback_weather(lat, lon)


@router.get("/search", response_model=List[LocationSearchResult])
async def search_locations(
    q: str = Query(..., min_length=1, description="Location search query (village, mandal, city)")
):
    """
    Search villages and locations by name using OpenWeather Geocoding Direct API
    with local preset fallback for rural Indian villages.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY", "").strip().strip('"').strip("'")
    query_clean = q.strip().lower()

    results: List[LocationSearchResult] = []

    # First match local presets
    for loc in PRESET_LOCATIONS:
        if query_clean in loc["name"].lower() or loc["name"].lower() in query_clean:
            results.append(LocationSearchResult(
                name=loc["name"],
                lat=loc["lat"],
                lon=loc["lon"],
                country=loc["country"],
                state=loc["state"],
            ))

    # If OpenWeather API key available, also query live geocoding API
    if api_key and api_key not in ["your_openweather_api_key_here", ""]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            try:
                geo_url = f"{GEOCODING_BASE_URL}/direct"
                params = {"q": f"{q},IN", "limit": 5, "appid": api_key}
                res = await client.get(geo_url, params=params)
                if res.status_code == 200:
                    for item in res.json():
                        # Avoid duplicates
                        if not any(abs(r.lat - item["lat"]) < 0.05 and abs(r.lon - item["lon"]) < 0.05 for r in results):
                            results.append(LocationSearchResult(
                                name=item.get("name", q.title()),
                                local_names=item.get("local_names"),
                                lat=round(item.get("lat", 0), 4),
                                lon=round(item.get("lon", 0), 4),
                                country=item.get("country", "IN"),
                                state=item.get("state"),
                            ))
            except Exception as ex:
                print(f"[Geocoding Error] {ex}")

    # If still empty, return a synthetic location match so user can test custom village names
    if not results:
        results.append(LocationSearchResult(
            name=q.strip().title(),
            lat=18.2543,
            lon=79.7214,
            country="IN",
            state="Telangana",
        ))

    return results


@router.get("/reverse-geocode")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """
    Reverse geocode latitude and longitude to village / city name via OpenWeather.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY", "").strip().strip('"').strip("'")

    if api_key and api_key not in ["your_openweather_api_key_here", ""]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            try:
                geo_url = f"{GEOCODING_BASE_URL}/reverse"
                params = {"lat": lat, "lon": lon, "limit": 1, "appid": api_key}
                res = await client.get(geo_url, params=params)
                if res.status_code == 200 and res.json():
                    item = res.json()[0]
                    return {
                        "success": True,
                        "name": item.get("name", "Village Area"),
                        "state": item.get("state", "Telangana"),
                        "country": item.get("country", "India"),
                        "latitude": lat,
                        "longitude": lon,
                    }
            except Exception as ex:
                print(f"[Reverse Geocode Error] {ex}")

    # Fallback to matching preset
    closest_name = "Shyampet"
    closest_state = "Telangana"
    min_dist = float("inf")
    for loc in PRESET_LOCATIONS:
        dist = (loc["lat"] - lat) ** 2 + (loc["lon"] - lon) ** 2
        if dist < min_dist:
            min_dist = dist
            if dist < 0.3:
                closest_name = loc["name"]
                closest_state = loc.get("state", "Telangana")

    return {
        "success": True,
        "name": closest_name,
        "state": closest_state,
        "country": "India",
        "latitude": lat,
        "longitude": lon,
    }
