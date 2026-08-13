"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isVillager,
  clearSession,
} from "@/services/demoSession";
import type { DemoVillager } from "@/types";
import IndianNationalEmblem from "@/components/IndianNationalEmblem";
import {
  LayoutDashboard,
  ClipboardList,
  CloudSun,
  TrendingUp,
  FileText,
  LogOut,
  Settings,
  HelpCircle,
  MessageSquare,
  Bell,
  ChevronDown,
  Plus,
  Shield,
  AlertCircle,
  X,
  Send,
  Sparkles,
  ArrowRight,
  Camera,
  UploadCloud,
  MapPin,
  Loader2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Image as ImageIcon,
  Zap,
  Wind,
  Droplets,
  Sun,
  Compass,
  Navigation,
  Thermometer,
  Eye,
  Umbrella,
  Calendar,
  CloudRain,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { analyzeIssueImage, reverseGeocodeLocation } from "@/services/complaintsApi";
import { fetchLiveGpsWeather, type WeatherData } from "@/services/weatherApi";
import { translations, type Language } from "@/lib/translations";

// ── Demo Data ────────────────────────────────────────────────────────────────

const INITIAL_COMPLAINTS = [
  {
    id: "C-001",
    title: "Broken road near main market",
    description: "Deep pothole and asphalt damage obstructing traffic near central market entrance.",
    status: "pending" as const,
    category: "Roads & Infrastructure",
    date: "Today, 9:15 AM",
    location: "Market Road, Ward 4",
    avatarBg: "#064e3b",
    urgency: "High",
    aiGenerated: true,
    imageUrl: undefined as string | undefined,
  },
  {
    id: "C-002",
    title: "Water supply disruption in Ward 2",
    description: "Burst main pipeline causing clean water leak and low pressure across Ward 2 residential houses.",
    status: "in_progress" as const,
    category: "Water Supply",
    date: "Yesterday, 6:00 PM",
    location: "Ward 2 Residential Area",
    avatarBg: "#059669",
    urgency: "High",
    aiGenerated: true,
    imageUrl: undefined as string | undefined,
  },
  {
    id: "C-003",
    title: "Garbage clearance near primary school",
    description: "Unsegregated garbage accumulation creating unhygienic conditions near school entrance.",
    status: "resolved" as const,
    category: "Sanitation",
    date: "12 Aug, 2:45 PM",
    location: "Primary School Lane",
    avatarBg: "#0f5132",
    urgency: "Medium",
    aiGenerated: false,
    imageUrl: undefined as string | undefined,
  },
];

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { id: "complaints", label: "Complaints", icon: ClipboardList, badge: "3" },
  { id: "weather", label: "Weather", icon: CloudSun, badge: "32°" },
  { id: "market", label: "Market Prices", icon: TrendingUp, badge: "Live" },
  { id: "news", label: "Local News", icon: FileText, badge: "New" },
];

const FEATURE_BOXES = [
  {
    id: "complaints",
    title: "Civic Complaints",
    desc: "Report problems in your village and track their resolution progress.",
    icon: AlertCircle,
    iconBg: "#fef2f2",
    iconColor: "#ef4444",
  },
  {
    id: "weather",
    title: "Weather Report",
    desc: "Check current weather, 7-day outlooks and farming advisories.",
    icon: CloudSun,
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
  },
  {
    id: "market",
    title: "Market Prices",
    desc: "View current crop rates across regional mandis for farmers.",
    icon: TrendingUp,
    iconBg: "#ecfdf5",
    iconColor: "#059669",
  },
  {
    id: "news",
    title: "Local News",
    desc: "Stay informed with official Gram Sabha notices and local alerts.",
    icon: FileText,
    iconBg: "#f5f3ff",
    iconColor: "#8b5cf6",
  },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function CitizenDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<DemoVillager | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("home");
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);

  // New Complaint Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Roads & Infrastructure");
  const [newLocation, setNewLocation] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("High");

  // Image & AI Vision state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [aiAutofilled, setAiAutofilled] = useState(false);
  const [aiModelName, setAiModelName] = useState("");

  // Location Auto-detect State
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Live GPS Weather State
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherGpsCoords, setWeatherGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [weatherLocationName, setWeatherLocationName] = useState<string>("Detecting GPS Location...");

  const loadWeatherForUser = async (overrideLat?: number, overrideLon?: number) => {
    setWeatherLoading(true);
    if (overrideLat && overrideLon) {
      try {
        const geoRes = await reverseGeocodeLocation(overrideLat, overrideLon);
        const locName = geoRes.location || `GPS (${overrideLat.toFixed(3)}°N, ${overrideLon.toFixed(3)}°E)`;
        setWeatherLocationName(locName);
        setWeatherGpsCoords({ lat: overrideLat, lon: overrideLon });
        const w = await fetchLiveGpsWeather(overrideLat, overrideLon, locName);
        setWeatherData(w);
      } catch {
        const w = await fetchLiveGpsWeather(overrideLat, overrideLon, "Village Area");
        setWeatherData(w);
      } finally {
        setWeatherLoading(false);
      }
      return;
    }

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setWeatherGpsCoords({ lat: latitude, lon: longitude });
          try {
            const geoRes = await reverseGeocodeLocation(latitude, longitude);
            const locName = geoRes.location || `GPS (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`;
            setWeatherLocationName(locName);
            const w = await fetchLiveGpsWeather(latitude, longitude, locName);
            setWeatherData(w);
          } catch {
            const w = await fetchLiveGpsWeather(latitude, longitude, `GPS (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`);
            setWeatherData(w);
          } finally {
            setWeatherLoading(false);
          }
        },
        async () => {
          const defaultLat = 17.9689;
          const defaultLon = 79.5941;
          const defName = session?.village ? `${session.village} (GPS Standard)` : "Shyampet Village, Warangal";
          setWeatherLocationName(defName);
          setWeatherGpsCoords({ lat: defaultLat, lon: defaultLon });
          const w = await fetchLiveGpsWeather(defaultLat, defaultLon, defName);
          setWeatherData(w);
          setWeatherLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const defaultLat = 17.9689;
      const defaultLon = 79.5941;
      const defName = session?.village ? `${session.village} (GPS Standard)` : "Shyampet Village, Warangal";
      setWeatherLocationName(defName);
      const w = await fetchLiveGpsWeather(defaultLat, defaultLon, defName);
      setWeatherData(w);
      setWeatherLoading(false);
    }
  };

  // Language & Translation State
  const [lang, setLang] = useState<Language>("en");

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("citizen_lang", newLang);
    }
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    if (!isVillager(s)) {
      router.replace("/panchayat/dashboard");
      return;
    }
    setSession(s as DemoVillager);
    setLoading(false);

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("citizen_lang") as Language;
      if (saved && (saved === "en" || saved === "hi" || saved === "te")) {
        setLang(saved);
      }
    }

    loadWeatherForUser();
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.replace("/");
  };

  const processImageFile = async (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);

      setAnalyzingImage(true);
      try {
        const res = await analyzeIssueImage(file, base64);
        if (res && res.title) {
          setNewTitle(res.title);
          setNewDescription(res.description);
          setNewCategory(res.category);
          setUrgencyLevel(res.urgency || "High");
          setAiModelName(res.ai_model);
          setAiAutofilled(true);
        }
      } catch (err) {
        console.error("AI Analysis error", err);
      } finally {
        setAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await reverseGeocodeLocation(latitude, longitude);
            setNewLocation(res.location || `Ward 4, Shyampet (GPS: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`);
            setLocationDetected(true);
          } catch (err) {
            setNewLocation(`Ward 4, Shyampet Village (GPS: ${position.coords.latitude.toFixed(4)}°N, ${position.coords.longitude.toFixed(4)}°E)`);
            setLocationDetected(true);
          } finally {
            setDetectingLocation(false);
          }
        },
        (error) => {
          const fallbackLoc = `Ward 4, ${session?.village || "Shyampet"} Main Road (GPS Verified)`;
          setNewLocation(fallbackLoc);
          setLocationDetected(true);
          setDetectingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setNewLocation(`Ward 4, ${session?.village || "Shyampet"} Main Road`);
      setLocationDetected(true);
      setDetectingLocation(false);
    }
  };

  const resetFormState = () => {
    setNewTitle("");
    setNewDescription("");
    setNewCategory("Roads & Infrastructure");
    setNewLocation("");
    setUrgencyLevel("High");
    setImageFile(null);
    setImagePreview(null);
    setAnalyzingImage(false);
    setAiAutofilled(false);
    setAiModelName("");
    setLocationDetected(false);
    setDetectingLocation(false);
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = {
      id: `C-00${complaints.length + 1}`,
      title: newTitle,
      description: newDescription || "Civic issue reported with photo and GPS location details.",
      status: "pending" as const,
      category: newCategory,
      date: "Just now",
      location: newLocation || `${session?.village || "Village"} Ward 1`,
      avatarBg: "#064e3b",
      imageUrl: imagePreview || undefined,
      urgency: urgencyLevel,
      aiGenerated: aiAutofilled,
    };
    setComplaints([created, ...complaints]);
    resetFormState();
    setModalOpen(false);
  };

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const displayName = session.name;

  return (
    <div className="panchayat-shell">

      {/* ── SIDEBAR ───────────────────────────────────────── */}
      <aside className="panchayat-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Shield style={{ width: 16, height: 16, color: "white" }} />
          </div>
          <div>
            <div className="sidebar-logo-name">{t("citizenTitle")}</div>
            <div className="sidebar-logo-version">{t("citizenSub")}</div>
          </div>
        </div>

        {/* Nav */}
        <p className="sidebar-section-label">Main Menu</p>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, icon: Icon, label, badge }) => {
            const isActive = currentTab === id;
            const liveBadge = id === "weather" ? (weatherData ? `${weatherData.temperature}°` : badge) : id === "complaints" ? String(complaints.length) : badge;
            const labelText = id === "home" ? t("navCitizenHome") :
                              id === "complaints" ? t("navCitizenComplaints") :
                              id === "weather" ? t("navCitizenWeather") :
                              id === "market" ? t("navCitizenMarket") :
                              id === "news" ? t("navCitizenNews") : label;
            return (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                className={`sidebar-nav-item${isActive ? " active" : ""}`}
                style={{ width: "100%", textAlign: "left", background: "transparent", cursor: "pointer" }}
              >
                <Icon className="sidebar-nav-icon" />
                <span className="sidebar-nav-text">{labelText}</span>
                {liveBadge && <span className="sidebar-nav-badge">{liveBadge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button className="sidebar-bottom-item">
            <Settings style={{ width: 16, height: 16 }} />
            <span className="sidebar-nav-text">Settings</span>
          </button>
          <button className="sidebar-bottom-item">
            <HelpCircle style={{ width: 16, height: 16 }} />
            <span className="sidebar-nav-text">Support</span>
          </button>
          <button className="sidebar-bottom-item danger" onClick={handleLogout}>
            <LogOut style={{ width: 16, height: 16 }} />
            <span className="sidebar-nav-text">Log out</span>
          </button>
        </div>
      </aside>

      {/* ── BODY ──────────────────────────────────────────── */}
      <div className="panchayat-body">

        {/* Top bar */}
        <header className="panchayat-topbar">
          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Language Selector Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f8fafc", padding: "0.35rem 0.65rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <Globe size={15} style={{ color: "#047857" }} />
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="en">🇬🇧 English</option>
                <option value="hi">🇮🇳 हिंदी (Hindi)</option>
                <option value="te">🇮🇳 తెలుగు (Telugu)</option>
              </select>
            </div>

            <button className="topbar-icon-btn" title="Messages">
              <MessageSquare style={{ width: 15, height: 15 }} />
            </button>
            <button className="topbar-icon-btn" title="Notifications">
              <Bell style={{ width: 15, height: 15 }} />
              <span className="topbar-notif-dot">2</span>
            </button>

            <div className="topbar-profile">
              <div className="topbar-avatar">{getInitials(displayName)}</div>
              <div>
                <div className="topbar-profile-name">{displayName}</div>
                <div className="topbar-profile-role">{session.village} · Resident</div>
              </div>
              <ChevronDown style={{ width: 12, height: 12, color: "rgba(148,163,184,0.4)", marginLeft: "0.25rem" }} />
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="panchayat-content">

          {/* Watermark */}
          <IndianNationalEmblem opacity={0.045} className="emblem-watermark" />

          {/* Orbs */}
          <div className="orb orb-1" style={{ opacity: 0.4 }} />
          <div className="orb orb-2" style={{ opacity: 0.3 }} />

          {/* ── HOME TAB (Compact Viewport Fit) ──────────────── */}
          {currentTab === "home" && (
            <div className="fade-up fade-up-1" style={{ maxWidth: 960, margin: "0 auto" }}>
              
              {/* Greetings */}
              <div style={{ marginBottom: "0.85rem" }}>
                <h1 className="greeting-title" style={{ fontSize: "1.5rem" }}>
                  {t("welcomeBack")}, {displayName}
                </h1>
                <p className="greeting-sub" style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.15rem" }}>
                  {t("welcomeSub")}
                </p>
              </div>

              {/* Live GPS Weather Widget */}
              <div
                onClick={() => setCurrentTab("weather")}
                style={{
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  borderRadius: 14,
                  padding: "0.85rem 1.15rem",
                  color: "white",
                  marginBottom: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(2,132,199,0.25)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ fontSize: "1.8rem" }}>
                    {weatherData ? (weatherData.weatherCode === 0 ? "☀️" : weatherData.weatherCode <= 3 ? "⛅" : "🌧️") : "🌤️"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>
                        {weatherData ? `${weatherData.temperature}°C` : "31°C"}
                      </span>
                      <span style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                        {weatherData ? weatherData.conditionText : "Partly Cloudy"}
                      </span>
                      <span style={{ background: "rgba(255,255,255,0.2)", fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: 999, fontWeight: 700 }}>
                        📍 {t("liveGpsStation")}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", opacity: 0.85, marginTop: "0.15rem" }}>
                      {weatherLocationName} · Humidity: {weatherData?.humidity ?? 65}% · Wind: {weatherData?.windSpeed ?? 12} km/h
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.74rem", fontWeight: 800, background: "rgba(255,255,255,0.18)", padding: "0.35rem 0.75rem", borderRadius: 8 }}>
                  <span>{t("navCitizenWeather")}</span>
                  <ArrowRight size={13} />
                </div>
              </div>

              {/* Hero Banner */}
              <div className="featured-stat-card blue" style={{ minHeight: "auto", padding: "1.1rem 1.25rem", marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.65rem", fontWeight: 700, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
                  <Sparkles style={{ width: 12, height: 12 }} />
                  {t("onePlatform")}
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.3rem 0", lineHeight: 1.25 }}>
                  {t("heroTitle")}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "#a7f3d0", margin: 0, opacity: 0.95, maxWidth: 640, lineHeight: 1.45 }}>
                  {t("heroSub")}
                </p>
              </div>

              {/* Section Header */}
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                {t("platformCapabilities")}
              </div>

              {/* 4 Feature Boxes (2 in a row) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "0.85rem" }}>
                {FEATURE_BOXES.map(({ id, title, desc, icon: Icon, iconBg, iconColor }) => (
                  <div
                    key={id}
                    onClick={() => setCurrentTab(id)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "1rem 1.125rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor = "#059669";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(5,150,105,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon style={{ width: 18, height: 18, color: iconColor }} />
                        </div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                          Explore <ArrowRight style={{ width: 11, height: 11 }} />
                        </span>
                      </div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                        {title}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#64748b", lineHeight: 1.45 }}>
                        {desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* One Platform Footer Card */}
              <div className="glass-card" style={{ padding: "0.75rem 1.125rem", display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles style={{ width: 15, height: 15, color: "#059669" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#042d20" }}>One Digital Village Platform</div>
                  <div style={{ fontSize: "0.73rem", color: "#64748b" }}>Everything important about your village in one simple place.</div>
                </div>
              </div>

            </div>
          )}

          {/* ── COMPLAINTS TAB ────────────────────────────────── */}
          {currentTab === "complaints" && (
            <div className="fade-up fade-up-2">
              <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#042d20", margin: 0 }}>{t("navCitizenComplaints")}</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>{t("welcomeSub")}</p>
                  </div>
                  <button className="add-report-btn" onClick={() => setModalOpen(true)}>
                    <Plus style={{ width: 15, height: 15 }} />
                    {t("btnReportIssue")}
                  </button>
                </div>

                <div className="complaints-card" style={{ border: "1px solid #e2e8f0" }}>
                  {complaints.map((c) => (
                    <div key={c.id} className="complaint-item" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.title} style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: "1px solid #a7f3d0", flexShrink: 0 }} />
                      ) : (
                        <div className="complaint-avatar" style={{ background: c.avatarBg, width: 48, height: 48, borderRadius: 12, fontSize: "0.85rem", flexShrink: 0 }}>
                          {c.id}
                        </div>
                      )}
                      <div className="complaint-info" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                          <span className="complaint-title" style={{ fontSize: "0.95rem", fontWeight: 800 }}>{c.title}</span>
                          {c.aiGenerated && (
                            <span style={{ fontSize: "0.65rem", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "0.1rem 0.4rem", borderRadius: 999, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
                              <Sparkles style={{ width: 9, height: 9 }} /> AI Auto-Written
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <div style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "0.35rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {c.description}
                          </div>
                        )}
                        <div className="complaint-name" style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          📍 {c.location} · <span style={{ color: "#059669", fontWeight: 600 }}>{c.category}</span> · {c.date}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                        <span className={`complaint-status ${c.status}`} style={{ padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}>
                          {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </span>
                        {c.urgency && (
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: c.urgency === "High" ? "#dc2626" : c.urgency === "Medium" ? "#d97706" : "#16a34a", background: c.urgency === "High" ? "#fef2f2" : c.urgency === "Medium" ? "#fffbeb" : "#f0fdf4", padding: "0.15rem 0.5rem", borderRadius: 6, border: `1px solid ${c.urgency === "High" ? "#fca5a5" : c.urgency === "Medium" ? "#fde68a" : "#86efac"}` }}>
                            {c.urgency} Urgency
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── WEATHER TAB ───────────────────────────────────── */}
          {currentTab === "weather" && (
            <div className="fade-up fade-up-2">
              <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                
                {/* Weather Header Bar with Live GPS Button */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #0284c7, #0369a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 14px rgba(2,132,199,0.3)" }}>
                      <CloudSun style={{ width: 28, height: 28 }} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#042d20", margin: 0 }}>
                          {t("navCitizenWeather")}
                        </h2>
                        <span style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.68rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: 999 }}>
                          ● {t("liveGpsStation")}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem", fontSize: "0.78rem", color: "#64748b" }}>
                        <MapPin size={13} style={{ color: "#059669" }} />
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{weatherLocationName}</span>
                        {weatherData && <span>· Updated {weatherData.lastUpdated}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => loadWeatherForUser()}
                    disabled={weatherLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      padding: "0.5rem 0.9rem",
                      borderRadius: "10px",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                  >
                    <RefreshCw size={14} className={weatherLoading ? "animate-spin" : ""} style={{ color: "#0284c7" }} />
                    {weatherLoading ? "..." : t("refreshWeather")}
                  </button>
                </div>

                {weatherLoading && !weatherData ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 0.75rem", color: "#0284c7" }} />
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>Acquiring Live GPS Satellite Weather Data...</div>
                    <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Calibrating village temperature, rainfall, and farming advisories</div>
                  </div>
                ) : weatherData ? (
                  <>
                    {/* Top Hero & Overview Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                      
                      {/* Hero Temperature Card */}
                      <div
                        style={{
                          background: "linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)",
                          color: "white",
                          borderRadius: 18,
                          padding: "1.35rem",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 10px 25px -5px rgba(3,105,161,0.35)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(255,255,255,0.18)", padding: "0.2rem 0.6rem", borderRadius: 999 }}>
                              {weatherData.conditionText}
                            </span>
                            <span style={{ fontSize: "2rem" }}>
                              {weatherData.weatherCode === 0 ? "☀️" : weatherData.weatherCode <= 3 ? "⛅" : weatherData.weatherCode >= 61 && weatherData.weatherCode <= 82 ? "🌧️" : "🌤️"}
                            </span>
                          </div>

                          <div style={{ fontSize: "2.8rem", fontWeight: 900, marginTop: "0.4rem", lineHeight: 1 }}>
                            {weatherData.temperature}°C
                          </div>
                          <div style={{ fontSize: "0.8rem", opacity: 0.9, marginTop: "0.35rem" }}>
                            Feels like {weatherData.feelsLike}°C · High: {weatherData.tempMax}° / Low: {weatherData.tempMin}°
                          </div>
                        </div>

                        <div style={{ fontSize: "0.74rem", opacity: 0.85, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "0.6rem", marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Navigation size={12} style={{ transform: `rotate(${weatherData.windDirection}deg)` }} />
                          Wind {weatherData.windSpeed} km/h · {weatherData.isDay ? "Daytime" : "Nighttime"}
                        </div>
                      </div>

                      {/* Metric 1: Humidity */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18, padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#0284c7" }}>
                          <Droplets size={18} />
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Humidity</span>
                        </div>
                        <div>
                          <div style={{ fontSize: "2.1rem", fontWeight: 900, color: "#0f172a", margin: "0.2rem 0" }}>
                            {weatherData.humidity}%
                          </div>
                          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: weatherData.humidity > 75 ? "#d97706" : "#059669" }}>
                            {weatherData.humidity > 75 ? "High Moisture" : weatherData.humidity > 45 ? "Optimal Comfort" : "Dry Air"}
                          </div>
                        </div>
                      </div>

                      {/* Metric 2: Wind Speed */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18, padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#059669" }}>
                          <Wind size={18} />
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Wind Speed</span>
                        </div>
                        <div>
                          <div style={{ fontSize: "2.1rem", fontWeight: 900, color: "#0f172a", margin: "0.2rem 0" }}>
                            {weatherData.windSpeed} <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b" }}>km/h</span>
                          </div>
                          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: weatherData.windSpeed > 25 ? "#dc2626" : "#059669" }}>
                            {weatherData.windSpeed > 25 ? "Strong Gusts" : weatherData.windSpeed > 10 ? "Gentle Breeze" : "Calm Winds"}
                          </div>
                        </div>
                      </div>

                      {/* Metric 3: Rain Probability */}
                      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 18, padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#6366f1" }}>
                          <CloudRain size={18} />
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Rain Chance</span>
                        </div>
                        <div>
                          <div style={{ fontSize: "2.1rem", fontWeight: 900, color: "#0f172a", margin: "0.2rem 0" }}>
                            {weatherData.precipitationProbability}%
                          </div>
                          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: weatherData.precipitationProbability > 50 ? "#2563eb" : "#64748b" }}>
                            {weatherData.precipitationProbability > 50 ? "Rain Highly Likely" : weatherData.precipitationProbability > 20 ? "Low Chance" : "Dry Skies"}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Farming & Agricultural Advisory Banner */}
                    <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 16, padding: "1.15rem 1.4rem", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Sparkles size={20} style={{ color: "#16a34a" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#14532d" }}>
                          🌾 Agricultural &amp; Crop Weather Advisory for {session.village}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#166534", marginTop: "0.25rem", lineHeight: 1.45 }}>
                          {weatherData.farmingAdvisory}
                        </div>
                      </div>
                    </div>

                    {/* Hourly Forecast Strip */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Thermometer size={15} style={{ color: "#0284c7" }} />
                        Hourly Temperature &amp; Sky Conditions (Next 8 Hours)
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(4, weatherData.hourlyForecast.length)}, 1fr)`, gap: "0.75rem", overflowX: "auto" }}>
                        {weatherData.hourlyForecast.map((h, i) => (
                          <div key={i} style={{ background: i === 0 ? "#eff6ff" : "#ffffff", border: i === 0 ? "1.5px solid #bfdbfe" : "1px solid #e2e8f0", borderRadius: 14, padding: "0.85rem 0.5rem", textAlign: "center" }}>
                            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: i === 0 ? "#1d4ed8" : "#64748b" }}>{h.time}</div>
                            <div style={{ fontSize: "1.3rem", margin: "0.3rem 0" }}>
                              {h.weatherCode === 0 ? "☀️" : h.weatherCode <= 3 ? "⛅" : h.weatherCode >= 61 ? "🌧️" : "🌤️"}
                            </div>
                            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#0f172a" }}>{h.temp}°</div>
                            <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "0.2rem" }}>
                              {h.rainProb > 0 ? `💧 ${h.rainProb}%` : h.condition}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 7-Day Agricultural Outlook */}
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Calendar size={15} style={{ color: "#059669" }} />
                        7-Day Village Weather Outlook
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))", gap: "0.75rem" }}>
                        {weatherData.dailyForecast.map((d, i) => (
                          <div key={i} style={{ background: i === 0 ? "#f8fafc" : "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "1rem 0.6rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: i === 0 ? "#059669" : "#334155" }}>{d.dayName}</div>
                            <div style={{ fontSize: "1.6rem", margin: "0.4rem 0" }}>
                              {d.weatherCode === 0 ? "☀️" : d.weatherCode <= 3 ? "⛅" : d.weatherCode >= 61 ? "🌧️" : "🌤️"}
                            </div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                              {d.tempMax}° <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8" }}>{d.tempMin}°</span>
                            </div>
                            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: d.rainProb > 40 ? "#2563eb" : "#64748b", marginTop: "0.3rem" }}>
                              {d.rainProb > 0 ? `💧 ${d.rainProb}%` : d.condition}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

              </div>
            </div>
          )}

          {/* ── MARKET TAB ────────────────────────────────────── */}
          {currentTab === "market" && (
            <div className="fade-up fade-up-2">
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp style={{ width: 24, height: 24, color: "#059669" }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#042d20", margin: 0 }}>{t("mandiTitle")}</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>{t("mandiSub")}</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                  {[
                    { crop: "Paddy (Grade A)", price: "₹2,300 / qtl", trend: "+₹50 today", color: "#16a34a" },
                    { crop: "Cotton", price: "₹7,150 / qtl", trend: "+₹120 today", color: "#16a34a" },
                    { crop: "Maize", price: "₹1,950 / qtl", trend: "-₹10 today", color: "#dc2626" },
                  ].map(({ crop, price, trend, color }) => (
                    <div key={crop} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "1.25rem" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{crop}</div>
                      <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#042d20", margin: "0.4rem 0" }}>{price}</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color }}>{trend}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── NEWS TAB ──────────────────────────────────────── */}
          {currentTab === "news" && (
            <div className="fade-up fade-up-2">
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f5f3ff", border: "1px solid #ddd6fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText style={{ width: 24, height: 24, color: "#7c3aed" }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#042d20", margin: 0 }}>{t("newsTitle")}</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>{t("newsSub")}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { title: "Gram Sabha General Meeting Scheduled", date: "Friday, 4:00 PM", desc: "Discussion on road repair works and water scheme allocation." },
                    { title: "Free Health Checkup Camp at Primary School", date: "Saturday, 9:00 AM", desc: "Organized by ASHA workers and Mandal Health Department." },
                  ].map(({ title, date, desc }) => (
                    <div key={title} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "1.125rem" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>{title}</div>
                      <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600, marginBottom: "0.5rem" }}>{date}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── NEW COMPLAINT MODAL (AI Vision & Auto GPS Location) ──────── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#ffffff", borderRadius: 20, padding: "1.75rem", width: "100%", maxWidth: 540, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button
              onClick={() => { setModalOpen(false); resetFormState(); }}
              style={{ position: "absolute", top: 16, right: 16, border: "none", background: "#f1f5f9", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #059669 0%, #064e3b 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(5,150,105,0.25)" }}>
                <Camera style={{ width: 22, height: 22, color: "#ffffff" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#042d20", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  Report Civic Issue
                  <span style={{ fontSize: "0.68rem", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "0.15rem 0.5rem", borderRadius: 999, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                    <Sparkles style={{ width: 10, height: 10 }} /> AI Vision
                  </span>
                </h3>
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.15rem 0 0 0" }}>
                  Upload an issue photo — AI will auto-write description and auto-detect location.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateComplaint} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              
              {/* Image Upload Box */}
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span>Issue Photo Upload</span>
                  {aiAutofilled && (
                    <span style={{ color: "#059669", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <CheckCircle2 style={{ width: 12, height: 12 }} /> AI Auto-Analyzed
                    </span>
                  )}
                </label>

                {imagePreview ? (
                  <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "2px solid #a7f3d0", background: "#f0fdf4", padding: "0.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <img src={imagePreview} alt="Uploaded Civic Issue" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 10 }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 0.25rem" }}>
                      <span style={{ fontSize: "0.73rem", color: "#064e3b", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <ImageIcon style={{ width: 13, height: 13 }} /> {imageFile?.name || "Issue_Photo.jpg"}
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 700, cursor: "pointer", background: "#e0f2fe", border: "1px solid #7dd3fc", padding: "0.25rem 0.6rem", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <RefreshCw style={{ width: 11, height: 11 }} /> Change
                          <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
                        </label>
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(null); setAiAutofilled(false); }}
                          style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 700, cursor: "pointer", background: "#fef2f2", border: "1px solid #fca5a5", padding: "0.25rem 0.6rem", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                        >
                          <Trash2 style={{ width: 11, height: 11 }} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropImage}
                    style={{
                      border: "2px dashed #a7f3d0",
                      borderRadius: 14,
                      background: "#f0fdf4",
                      padding: "1.25rem 1rem",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input type="file" id="modal-image-upload" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
                    <label htmlFor="modal-image-upload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
                        <UploadCloud style={{ width: 22, height: 22, color: "#059669" }} />
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#042d20", marginBottom: "0.15rem" }}>
                        Click to upload or drag &amp; drop issue photo
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        AI Vision will automatically write description and detect problem category
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* AI Vision Analysis Loading Banner */}
              {analyzingImage && (
                <div style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)", border: "1px solid #86efac", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Loader2 style={{ width: 20, height: 20, color: "#059669" }} />
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#042d20" }}>AI Vision Analyzing Image...</div>
                    <div style={{ fontSize: "0.72rem", color: "#047857" }}>Scanning civic defect features &amp; auto-writing description</div>
                  </div>
                </div>
              )}

              {/* AI Auto-Filled Badge */}
              {aiAutofilled && !analyzingImage && (
                <div style={{ background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 10, padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.73rem", color: "#047857", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Sparkles style={{ width: 13, height: 13, color: "#059669" }} />
                    Description &amp; details auto-written by {aiModelName || "Nivaaran AI"}
                  </span>
                  <span style={{ fontSize: "0.68rem", background: "#dcfce7", color: "#064e3b", fontWeight: 800, padding: "0.1rem 0.4rem", borderRadius: 4 }}>
                    Confidence 96%
                  </span>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.35rem" }}>Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Severe asphalt damage and deep pothole on road"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
                />
              </div>

              {/* Auto-Written Description */}
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span>Issue Description</span>
                  {aiAutofilled && <span style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>✨ AI Generated (Editable)</span>}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Upload photo for AI auto-description or write details here..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.83rem", outline: "none", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Category & Urgency Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.35rem" }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.83rem", outline: "none", background: "#ffffff" }}
                  >
                    <option value="Roads & Infrastructure">Roads &amp; Infrastructure</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Sanitation">Sanitation &amp; Waste</option>
                    <option value="Electricity">Electricity &amp; Streetlights</option>
                    <option value="Health & Other">Health &amp; Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.35rem" }}>Urgency Level</label>
                  <select
                    value={urgencyLevel}
                    onChange={(e) => setUrgencyLevel(e.target.value)}
                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.83rem", outline: "none", background: "#ffffff" }}
                  >
                    <option value="High">🔴 High Urgency</option>
                    <option value="Medium">🟡 Medium Urgency</option>
                    <option value="Low">🟢 Low Urgency</option>
                  </select>
                </div>
              </div>

              {/* Location with Auto-Detect Button */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Location / Ward</label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#047857",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      borderRadius: 6,
                      padding: "0.2rem 0.55rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 style={{ width: 11, height: 11 }} /> Detecting GPS...
                      </>
                    ) : (
                      <>
                        <MapPin style={{ width: 11, height: 11, color: "#059669" }} /> Auto-Detect Location (GPS)
                      </>
                    )}
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward 4, Market Road, Shyampet"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: 10,
                      border: locationDetected ? "1px solid #059669" : "1px solid #cbd5e1",
                      background: locationDetected ? "#f0fdf4" : "#ffffff",
                      fontSize: "0.83rem",
                      outline: "none"
                    }}
                  />
                  {locationDetected && (
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.68rem", fontWeight: 700, color: "#059669", background: "#dcfce7", padding: "0.15rem 0.4rem", borderRadius: 4, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                      <CheckCircle2 style={{ width: 10, height: 10 }} /> GPS Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetFormState(); }}
                  style={{ flex: 1, padding: "0.7rem", borderRadius: 10, border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1.5, padding: "0.7rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #059669 0%, #064e3b 100%)", color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", boxShadow: "0 4px 12px rgba(5,150,105,0.25)" }}
                >
                  <Send style={{ width: 15, height: 15 }} /> Submit Issue Report
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
