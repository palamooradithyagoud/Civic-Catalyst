"use client";

import { useEffect, useState, useRef } from "react";
import {
  CloudSun,
  Thermometer,
  Wind,
  Droplets,
  CloudRain,
  Cloud,
  Compass,
  MapPin,
  Search,
  Navigation,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
  Gauge,
  Eye,
  Sun,
  Sunrise,
  Sunset,
  ChevronRight,
  Info,
  Loader2,
  X,
} from "lucide-react";
import {
  fetchWeather,
  searchLocations,
  WeatherResponse,
  LocationSearchResult,
} from "@/services/weatherApi";
import type { DemoVillager } from "@/types";

interface VillagerWeatherDashboardProps {
  session: DemoVillager;
}

// Preset village locations for instant quick selection
const POPULAR_VILLAGES = [
  { name: "Shyampet", state: "Telangana", lat: 18.2543, lon: 79.7214 },
  { name: "Warangal", state: "Telangana", lat: 17.9689, lon: 79.5941 },
  { name: "Karimnagar", state: "Telangana", lat: 18.4386, lon: 79.1288 },
  { name: "Siddipet", state: "Telangana", lat: 18.1018, lon: 78.8520 },
  { name: "Medak", state: "Telangana", lat: 18.0450, lon: 78.2618 },
  { name: "Nizamabad", state: "Telangana", lat: 18.6725, lon: 78.0941 },
  { name: "Khammam", state: "Telangana", lat: 17.2473, lon: 80.1514 },
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lon: 78.4867 },
];

export default function VillagerWeatherDashboard({ session }: VillagerWeatherDashboardProps) {
  // Current active coordinates (default to Shyampet village)
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: 18.2543,
    lon: 79.7214,
  });

  // Main Weather State
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Geolocation & Permission State
  const [detectingGps, setDetectingGps] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [gpsSuccess, setGpsSuccess] = useState<boolean>(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [noResultsFound, setNoResultsFound] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load weather when coords change
  useEffect(() => {
    loadWeatherData(coords.lat, coords.lon);
  }, [coords]);

  const loadWeatherData = async (lat: number, lon: number) => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
    } catch (err: any) {
      console.error("Failed to load weather:", err);
      setWeatherError(err?.message || "Unable to fetch live weather data. Please check network connection.");
    } finally {
      setLoadingWeather(false);
    }
  };

  // 1. Auto-detect location using browser geolocation
  const handleAutoDetectLocation = () => {
    setDetectingGps(true);
    setPermissionDenied(false);
    setGpsSuccess(false);

    if (!("geolocation" in navigator)) {
      setPermissionDenied(true);
      setDetectingGps(false);
      // Auto focus manual search input if GPS not supported
      setTimeout(() => searchInputRef.current?.focus(), 300);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        setGpsSuccess(true);
        setDetectingGps(false);
        setPermissionDenied(false);
      },
      (error) => {
        console.warn("Geolocation permission error or timeout:", error);
        setDetectingGps(false);
        setPermissionDenied(true);
        setGpsSuccess(false);
        // Automatically provide and focus manual search option when permission denied
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 300);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // 2. Search locations by name
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setNoResultsFound(false);
    setShowSearchDropdown(true);

    try {
      const results = await searchLocations(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setNoResultsFound(true);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
      setNoResultsFound(true);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (locName: string, lat: number, lon: number) => {
    setCoords({ lat, lon });
    setSearchQuery("");
    setShowSearchDropdown(false);
    setNoResultsFound(false);
    setPermissionDenied(false);
    setGpsSuccess(false);
  };

  // Icon mapping helper
  const getWeatherIcon = (iconCode: string) => {
    const mainIcon = iconCode?.slice(0, 2);
    switch (mainIcon) {
      case "01":
        return <Sun style={{ width: 28, height: 28, color: "#f59e0b" }} />;
      case "02":
        return <CloudSun style={{ width: 28, height: 28, color: "#0284c7" }} />;
      case "03":
      case "04":
        return <Cloud style={{ width: 28, height: 28, color: "#64748b" }} />;
      case "09":
      case "10":
        return <CloudRain style={{ width: 28, height: 28, color: "#0284c7" }} />;
      case "11":
        return <CloudRain style={{ width: 28, height: 28, color: "#7c3aed" }} />;
      default:
        return <CloudSun style={{ width: 28, height: 28, color: "#059669" }} />;
    }
  };

  return (
    <div className="fade-up fade-up-2" style={{ width: "100%", maxWidth: 1040, margin: "0 auto" }}>
      
      {/* ── HEADER TOOLBAR: Title & Location Controls ────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: "1.25rem 1.5rem",
          marginBottom: "1.25rem",
          borderRadius: 18,
          background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
          border: "1px solid #a7f3d0",
          boxShadow: "0 4px 16px rgba(5,150,105,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          
          {/* Header Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(5,150,105,0.25)",
              }}
            >
              <CloudSun style={{ width: 26, height: 26, color: "#ffffff" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#042d20", margin: 0 }}>
                  Villager Weather &amp; Farming Advisory
                </h2>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#059669",
                    background: "#dcfce7",
                    border: "1px solid #a7f3d0",
                    padding: "0.15rem 0.5rem",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                  }}
                >
                  <Sparkles style={{ width: 10, height: 10 }} /> OpenWeather API Live
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.15rem 0 0 0" }}>
                Live micro-climate weather forecasts &amp; customized agricultural advisories for rural India
              </p>
            </div>
          </div>

          {/* Auto-Detect Location Button */}
          <button
            onClick={handleAutoDetectLocation}
            disabled={detectingGps}
            style={{
              background: gpsSuccess
                ? "linear-gradient(135deg, #059669 0%, #064e3b 100%)"
                : "#ffffff",
              color: gpsSuccess ? "#ffffff" : "#047857",
              border: "1.5px solid #059669",
              borderRadius: 12,
              padding: "0.65rem 1.1rem",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 2px 8px rgba(5,150,105,0.12)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            title="Use device GPS geolocation to auto-detect current village location"
          >
            {detectingGps ? (
              <>
                <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />
                <span>Locating GPS...</span>
              </>
            ) : gpsSuccess ? (
              <>
                <CheckCircle2 style={{ width: 15, height: 15 }} />
                <span>GPS Location Detected</span>
              </>
            ) : (
              <>
                <Navigation style={{ width: 15, height: 15, color: "#059669" }} />
                <span>Auto-Detect GPS Location</span>
              </>
            )}
          </button>
        </div>

        {/* ── SEARCH BAR & VILLAGE PRESET CHIPS ──────────────────────── */}
        <div style={{ marginTop: "1.1rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <form onSubmit={handleSearchSubmit} style={{ position: "relative", width: "100%" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 16,
                    height: 16,
                    color: "#059669",
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search village, mandal, or city (e.g. Shyampet, Warangal, Siddipet)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim().length > 1) {
                      handleSearchSubmit();
                    } else {
                      setShowSearchDropdown(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 1 && searchResults.length > 0) {
                      setShowSearchDropdown(true);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem 0.65rem 2.35rem",
                    borderRadius: 12,
                    border: permissionDenied ? "2px solid #ef4444" : "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    outline: "none",
                    background: "#ffffff",
                    boxShadow: permissionDenied ? "0 0 0 3px rgba(239,68,68,0.15)" : "none",
                    transition: "all 0.2s ease",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchDropdown(false);
                    }}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      color: "#94a3b8",
                      cursor: "pointer",
                    }}
                  >
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={searching}
                style={{
                  background: "#059669",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 12,
                  padding: "0.65rem 1.25rem",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                {searching ? <Loader2 style={{ width: 14, height: 14 }} /> : <Search style={{ width: 14, height: 14 }} />}
                Search
              </button>
            </div>

            {/* Dropdown Results */}
            {showSearchDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                  zIndex: 50,
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                {searching ? (
                  <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                    Searching locations via OpenWeather Geocoding...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((res, idx) => (
                    <div
                      key={`${res.name}-${idx}`}
                      onClick={() => selectLocation(res.name, res.lat, res.lon)}
                      style={{
                        padding: "0.7rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: idx < searchResults.length - 1 ? "1px solid #f1f5f9" : "none",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#ecfdf5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <MapPin style={{ width: 15, height: 15, color: "#059669" }} />
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                            {res.name}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            {res.state ? `${res.state}, ` : ""}{res.country || "India"}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontFamily: "monospace" }}>
                        {res.lat.toFixed(4)}°, {res.lon.toFixed(4)}°
                      </span>
                    </div>
                  ))
                ) : noResultsFound ? (
                  <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: "#ef4444" }}>
                    No matching location found. Try selecting one of the popular village presets below.
                  </div>
                ) : null}
              </div>
            )}
          </form>

          {/* Quick Village Presets */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", marginRight: "0.2rem" }}>
              Quick Presets:
            </span>
            {POPULAR_VILLAGES.map((v) => {
              const isSelected = weather?.location_name.toLowerCase().includes(v.name.toLowerCase());
              return (
                <button
                  key={v.name}
                  onClick={() => selectLocation(v.name, v.lat, v.lon)}
                  style={{
                    fontSize: "0.73rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                    borderRadius: 999,
                    border: isSelected ? "1px solid #059669" : "1px solid #cbd5e1",
                    background: isSelected ? "#ecfdf5" : "#ffffff",
                    color: isSelected ? "#059669" : "#475569",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#059669";
                      e.currentTarget.style.color = "#059669";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.color = "#475569";
                    }
                  }}
                >
                  📍 {v.name}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── STATE CONDITION 1: Location Permission Denied State ────────── */}
      {permissionDenied && (
        <div
          style={{
            background: "#fef2f2",
            border: "1.5px solid #fca5a5",
            borderRadius: 16,
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            boxShadow: "0 4px 12px rgba(239,68,68,0.08)",
          }}
        >
          <ShieldAlert style={{ width: 22, height: 22, color: "#dc2626", flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#991b1b" }}>
              Location Permission Denied or Unavailable
            </div>
            <div style={{ fontSize: "0.78rem", color: "#7f1d1d", marginTop: "0.2rem", lineHeight: 1.45 }}>
              Browser GPS location permission was blocked. Manual search input has been automatically activated above. Please search your village name or choose from the preset village chips.
            </div>
          </div>
          <button
            onClick={() => setPermissionDenied(false)}
            style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer" }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}

      {/* ── STATE CONDITION 2: API Error State ───────────────────────── */}
      {weatherError && (
        <div
          style={{
            background: "#fff1f2",
            border: "1.5px solid #fda4af",
            borderRadius: 16,
            padding: "1.25rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <AlertCircle style={{ width: 24, height: 24, color: "#e11d48" }} />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#881337" }}>
                Weather Data Unavailable
              </div>
              <div style={{ fontSize: "0.78rem", color: "#9f1239", marginTop: "0.15rem" }}>
                {weatherError}
              </div>
            </div>
          </div>
          <button
            onClick={() => loadWeatherData(coords.lat, coords.lon)}
            style={{
              background: "#e11d48",
              color: "#ffffff",
              border: "none",
              borderRadius: 10,
              padding: "0.5rem 1rem",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Retry Fetching
          </button>
        </div>
      )}

      {/* ── STATE CONDITION 3: Loading Skeleton State ──────────────────── */}
      {loadingWeather ? (
        <div className="glass-card" style={{ padding: "2.5rem 1.5rem", textAlign: "center", borderRadius: 18 }}>
          <Loader2
            style={{
              width: 36,
              height: 36,
              color: "#059669",
              margin: "0 auto 1rem auto",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#042d20" }}>
            Fetching Live Weather Data...
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.3rem" }}>
            Connecting securely to OpenWeather API for coordinates {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
          </div>
        </div>
      ) : weather ? (
        <>
          {/* ── SELECTED LOCATION & LIVE WEATHER HERO CARD ──────────────── */}
          <div
            style={{
              background: "linear-gradient(135deg, #042d20 0%, #064e3b 60%, #0284c7 100%)",
              color: "#ffffff",
              borderRadius: 22,
              padding: "1.75rem",
              marginBottom: "1.25rem",
              boxShadow: "0 12px 30px -5px rgba(4,45,32,0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background Accent Glow */}
            <div
              style={{
                position: "absolute",
                top: "-40%",
                right: "-10%",
                width: 300,
                height: 300,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(52,211,153,0.2) 0%, rgba(0,0,0,0) 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Location & Update Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <MapPin style={{ width: 20, height: 20, color: "#34d399" }} />
                  <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>
                    {weather.location_name}
                  </h1>
                  {weather.state && (
                    <span style={{ fontSize: "0.85rem", color: "#a7f3d0", fontWeight: 600 }}>
                      , {weather.state}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#a7f3d0", opacity: 0.9, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>GPS: {weather.coordinates.lat.toFixed(4)}°N, {weather.coordinates.lon.toFixed(4)}°E</span>
                  <span>·</span>
                  <span>Country: {weather.country || "India"}</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.72rem", color: "#a7f3d0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Last Updated
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#ffffff", marginTop: "0.1rem" }}>
                  {weather.current.updated_at}
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "#ffffff",
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(4px)",
                    padding: "0.15rem 0.55rem",
                    borderRadius: 999,
                    display: "inline-block",
                    marginTop: "0.3rem",
                  }}
                >
                  {weather.source}
                </span>
              </div>
            </div>

            {/* Current Weather Highlights Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", alignItems: "center" }}>
              
              {/* Main Temp & Condition */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {getWeatherIcon(weather.current.icon)}
                </div>
                <div>
                  <div style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1, color: "#ffffff" }}>
                    {Math.round(weather.current.temp)}°C
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#6ee7b7", marginTop: "0.2rem" }}>
                    {weather.current.condition}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#a7f3d0", opacity: 0.85 }}>
                    {weather.current.description}
                  </div>
                </div>
              </div>

              {/* Range & Feels Like */}
              <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>Feels Like</span>
                  <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff" }}>{weather.current.feels_like}°C</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>Temp High / Low</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>
                    {weather.current.temp_max}°C / {weather.current.temp_min}°C
                  </span>
                </div>
              </div>

              {/* Sunrise & Sunset */}
              <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Sunrise style={{ width: 16, height: 16, color: "#fde047" }} />
                  <span style={{ fontSize: "0.75rem", color: "#a7f3d0" }}>Sunrise: <strong>{weather.current.sunrise}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sunset style={{ width: 16, height: 16, color: "#f97316" }} />
                  <span style={{ fontSize: "0.75rem", color: "#a7f3d0" }}>Sunset: <strong>{weather.current.sunset}</strong></span>
                </div>
              </div>

            </div>

          </div>

          {/* ── KEY METRICS GRID (6 Cards: Humidity, Wind, Rain, Cloudiness, Pressure, Visibility) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.85rem", marginBottom: "1.25rem" }}>
            
            {/* Humidity */}
            <div className="glass-card" style={{ padding: "1rem", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Humidity</span>
                <Droplets style={{ width: 16, height: 16, color: "#0284c7" }} />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a" }}>
                {weather.current.humidity}%
              </div>
              <div style={{ fontSize: "0.7rem", color: weather.current.humidity > 70 ? "#0284c7" : "#059669", fontWeight: 600, marginTop: "0.2rem" }}>
                {weather.current.humidity > 70 ? "High Humidity" : "Normal Moisture"}
              </div>
            </div>

            {/* Wind Speed & Direction */}
            <div className="glass-card" style={{ padding: "1rem", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Wind Speed</span>
                <Wind style={{ width: 16, height: 16, color: "#059669" }} />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a" }}>
                {weather.current.wind_speed} <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>km/h</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 600, marginTop: "0.2rem" }}>
                Direction: {weather.current.wind_direction}
              </div>
            </div>

            {/* Rain Probability / Precipitation */}
            <div className="glass-card" style={{ padding: "1rem", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Rain Chance</span>
                <CloudRain style={{ width: 16, height: 16, color: "#2563eb" }} />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a" }}>
                {weather.current.rain_probability}%
              </div>
              <div style={{ fontSize: "0.7rem", color: weather.current.rain_probability > 40 ? "#2563eb" : "#64748b", fontWeight: 600, marginTop: "0.2rem" }}>
                {weather.current.rain_probability > 50 ? "Heavy Rain Chance" : "Low Precipitation"}
              </div>
            </div>

            {/* Cloudiness */}
            <div className="glass-card" style={{ padding: "1rem", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Cloudiness</span>
                <Cloud style={{ width: 16, height: 16, color: "#64748b" }} />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a" }}>
                {weather.current.cloudiness}%
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginTop: "0.2rem" }}>
                Cover Coverage
              </div>
            </div>

            {/* Pressure */}
            <div className="glass-card" style={{ padding: "1rem", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pressure</span>
                <Gauge style={{ width: 16, height: 16, color: "#7c3aed" }} />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a" }}>
                {weather.current.pressure} <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>hPa</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#7c3aed", fontWeight: 600, marginTop: "0.2rem" }}>
                Atmospheric
              </div>
            </div>

            {/* Visibility */}
            <div className="glass-card" style={{ padding: "1rem", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Visibility</span>
                <Eye style={{ width: 16, height: 16, color: "#059669" }} />
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a" }}>
                {weather.current.visibility} <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>km</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 600, marginTop: "0.2rem" }}>
                Clear Horizon
              </div>
            </div>

          </div>

          {/* ── HOURLY FORECAST (Next 24 Hours) ────────────────────────── */}
          <div className="glass-card" style={{ padding: "1.25rem 1.5rem", borderRadius: 18, marginBottom: "1.25rem", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock style={{ width: 18, height: 18, color: "#0284c7" }} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#042d20", margin: 0 }}>
                  Hourly Forecast (24 Hours)
                </h3>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
                Scroll right →
              </span>
            </div>

            {/* Scrollable Horizontal Cards */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
                scrollbarWidth: "thin",
              }}
            >
              {weather.hourly.map((h, idx) => (
                <div
                  key={`${h.time}-${idx}`}
                  style={{
                    minWidth: 105,
                    background: idx === 0 ? "linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)" : "#ffffff",
                    border: idx === 0 ? "1.5px solid #059669" : "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "0.85rem 0.65rem",
                    textAlign: "center",
                    flexShrink: 0,
                    boxShadow: idx === 0 ? "0 4px 12px rgba(5,150,105,0.12)" : "none",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: idx === 0 ? "#047857" : "#64748b", marginBottom: "0.4rem" }}>
                    {idx === 0 ? "Now" : h.time}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.4rem" }}>
                    {getWeatherIcon(h.icon)}
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                    {Math.round(h.temp)}°C
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#0284c7", fontWeight: 700, marginTop: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.15rem" }}>
                    <Droplets style={{ width: 10, height: 10 }} /> {h.rain_probability}%
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "0.15rem" }}>
                    {h.wind_speed} km/h
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 7-DAY FORECAST & AGRICULTURAL ADVISORY ────────────────── */}
          <div className="glass-card" style={{ padding: "1.5rem", borderRadius: 18, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar style={{ width: 20, height: 20, color: "#059669" }} />
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#042d20", margin: 0 }}>
                    7-Day Forecast &amp; Local Farming Guidance
                  </h3>
                  <p style={{ fontSize: "0.76rem", color: "#64748b", margin: 0 }}>
                    Daily agricultural recommendations for paddy, cotton, and local crops based on weather predictions
                  </p>
                </div>
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, background: "#ecfdf5", color: "#059669", padding: "0.2rem 0.6rem", borderRadius: 999, border: "1px solid #a7f3d0" }}>
                7 Days Complete Outlook
              </span>
            </div>

            {/* Daily Forecast Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {weather.daily.map((d, idx) => (
                <div
                  key={d.date}
                  style={{
                    background: idx === 0 ? "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" : "#ffffff",
                    border: idx === 0 ? "1.5px solid #059669" : "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: "1rem 1.15rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem",
                    transition: "all 0.15s ease",
                    boxShadow: idx === 0 ? "0 4px 14px rgba(5,150,105,0.08)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                    
                    {/* Day & Condition */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 200 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {getWeatherIcon(d.icon)}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
                          {d.day_name} <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>({d.date})</span>
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "#059669", fontWeight: 600 }}>
                          {d.condition}
                        </div>
                      </div>
                    </div>

                    {/* Temp Range & Rain/Wind metrics */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                      
                      {/* Temp Min / Max Bar */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#0f172a" }}>
                          {Math.round(d.temp_max)}° / <span style={{ color: "#64748b", fontWeight: 600 }}>{Math.round(d.temp_min)}°C</span>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                          Max / Min
                        </div>
                      </div>

                      {/* Rain Probability */}
                      <div style={{ textAlign: "center", minWidth: 60 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.15rem" }}>
                          <Droplets style={{ width: 12, height: 12 }} /> {d.rain_probability}%
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                          Rain Prob
                        </div>
                      </div>

                      {/* Wind */}
                      <div style={{ textAlign: "center", minWidth: 60 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>
                          {d.wind_speed} <span style={{ fontSize: "0.65rem" }}>km/h</span>
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                          Wind
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Agricultural Farming Advisory */}
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #a7f3d0",
                      borderRadius: 10,
                      padding: "0.55rem 0.85rem",
                      fontSize: "0.76rem",
                      color: "#042d20",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.4rem",
                      lineHeight: 1.4,
                    }}
                  >
                    <Info style={{ width: 14, height: 14, color: "#059669", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ color: "#064e3b" }}>Farming Advisory:</strong> {d.farming_advisory}
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </>
      ) : null}

    </div>
  );
}
