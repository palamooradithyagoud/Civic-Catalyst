"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isVillager, clearSession } from "@/services/demoSession";
import { DemoVillager } from "@/types";
import {
  Home as HomeIcon,
  AlertCircle,
  CloudSun,
  TrendingUp,
  FileText,
  LogOut,
  Menu,
  X,
  Sparkles,
  Leaf,
} from "lucide-react";

export default function CitizenDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<DemoVillager | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.replace("/");
  };

  const handleNav = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #059669",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>Loading portal...</span>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    { id: "home", label: "Home", icon: HomeIcon, emoji: "🏠" },
    { id: "complaints", label: "Complaints", icon: AlertCircle, emoji: "🚨" },
    { id: "weather", label: "Weather", icon: CloudSun, emoji: "🌦️" },
    { id: "market", label: "Market Prices", icon: TrendingUp, emoji: "🌾" },
    { id: "news", label: "Local News", icon: FileText, emoji: "📰" },
  ];

  const CAPABILITIES = [
    {
      id: "complaints",
      emoji: "🚨",
      title: "Civic Complaints",
      desc: "Report problems in your village and track their progress.",
    },
    {
      id: "weather",
      emoji: "🌦️",
      title: "Weather",
      desc: "Check current weather and forecasts for your area.",
    },
    {
      id: "market",
      emoji: "🌾",
      title: "Market Prices",
      desc: "View current market prices for agricultural crops.",
    },
    {
      id: "news",
      emoji: "📰",
      title: "Local News",
      desc: "Stay informed about important news and updates from your village.",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        .vdp-shell {
          display: flex;
          min-height: 100vh;
          background: #f4f9f6;
          font-family: system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        /* ── SIDEBAR ── */
        .vdp-sidebar {
          width: 252px;
          min-width: 252px;
          background: #ffffff;
          border-right: 1px solid #e0ece6;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 30;
          padding: 1.5rem 1.125rem;
          box-shadow: 2px 0 10px rgba(16,185,129,0.05);
          flex-shrink: 0;
        }
        .vdp-sidebar-top { flex: 1; }
        /* Brand */
        .vdp-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 2rem;
          padding-bottom: 1.375rem;
          border-bottom: 1px solid #e8f4ed;
        }
        .vdp-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(5,150,105,0.3);
        }
        .vdp-brand-name {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0c1f15;
          letter-spacing: -0.015em;
          line-height: 1.2;
        }
        .vdp-brand-sub {
          font-size: 0.625rem;
          font-weight: 700;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 2px;
        }
        .vdp-brand-close {
          margin-left: auto;
          padding: 0.25rem;
          border-radius: 7px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #9ca3af;
          display: none;
        }
        /* Nav */
        .vdp-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .vdp-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0.875rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          color: #6b7280;
          transition: background 0.14s ease, color 0.14s ease;
        }
        .vdp-nav-btn:hover { background: #f0fdf4; color: #374151; }
        .vdp-nav-btn.active {
          background: #ecfdf5;
          color: #065f46;
          font-weight: 700;
          box-shadow: inset 0 0 0 1.5px #6ee7b7;
        }
        .vdp-nav-emoji { font-size: 1rem; line-height: 1; width: 20px; text-align: center; flex-shrink: 0; }
        /* Logout */
        .vdp-logout-zone {
          padding-top: 1.125rem;
          border-top: 1px solid #e8f4ed;
          margin-top: 1rem;
        }
        .vdp-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0.875rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          color: #dc2626;
          transition: background 0.14s ease;
        }
        .vdp-logout-btn:hover { background: #fff5f5; }
        /* ── MOBILE HEADER ── */
        .vdp-mobile-header {
          display: none;
          position: sticky;
          top: 0;
          z-index: 40;
          background: #ffffff;
          border-bottom: 1px solid #e0ece6;
          padding: 0.8rem 1rem;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }
        .vdp-mobile-menu-btn {
          padding: 0.35rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #374151;
          display: flex;
          align-items: center;
        }
        /* ── OVERLAY ── */
        .vdp-overlay {
          position: fixed;
          inset: 0;
          z-index: 35;
          background: rgba(0,0,0,0.32);
          backdrop-filter: blur(2px);
        }
        /* ── MAIN ── */
        .vdp-main {
          flex: 1;
          min-width: 0;
          padding: 2.5rem 3rem;
          max-width: 840px;
          animation: fadeSlideUp 0.38s ease both;
        }
        /* ── GREETING ── */
        .vdp-greeting { margin-bottom: 2rem; }
        .vdp-greeting-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0c1f15;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin: 0 0 0.35rem 0;
        }
        .vdp-greeting-sub { font-size: 0.875rem; color: #6b7280; font-weight: 500; margin: 0; }
        /* ── HERO ── */
        .vdp-hero {
          background: linear-gradient(135deg, #047857 0%, #065f46 55%, #064e3b 100%);
          border-radius: 18px;
          padding: 1.875rem 2.125rem;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 6px 28px rgba(5,150,105,0.22);
        }
        .vdp-hero::before {
          content: "";
          position: absolute;
          right: -50px; bottom: -50px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          pointer-events: none;
        }
        .vdp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 0.275rem 0.7rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 999px;
          font-size: 0.625rem;
          font-weight: 700;
          color: #a7f3d0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.875rem;
        }
        .vdp-hero-heading {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1.3;
          margin: 0 0 0.625rem 0;
          position: relative;
          z-index: 1;
        }
        .vdp-hero-body {
          font-size: 0.85rem;
          color: #a7f3d0;
          line-height: 1.7;
          max-width: 480px;
          position: relative;
          z-index: 1;
          margin: 0;
        }
        /* ── CAPABILITIES ── */
        .vdp-caps-label {
          font-size: 0.625rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.75rem;
        }
        .vdp-caps-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.875rem;
          margin-bottom: 0.875rem;
        }
        .vdp-cap-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 1.25rem 1.125rem;
          border: 1px solid #e5ede9;
          cursor: pointer;
          transition: transform 0.17s ease, box-shadow 0.17s ease, border-color 0.17s ease;
          text-align: left;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .vdp-cap-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(5,150,105,0.1);
          border-color: #6ee7b7;
        }
        .vdp-cap-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.875rem;
        }
        .vdp-cap-emoji { font-size: 1.375rem; line-height: 1; }
        .vdp-cap-arrow {
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #d1d5db;
          transition: color 0.15s;
        }
        .vdp-cap-card:hover .vdp-cap-arrow { color: #059669; }
        .vdp-cap-title { font-size: 0.875rem; font-weight: 700; color: #111827; margin-bottom: 0.3rem; }
        .vdp-cap-desc { font-size: 0.775rem; color: #6b7280; line-height: 1.55; }
        /* ── PLATFORM CARD ── */
        .vdp-platform-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 1.125rem 1.25rem;
          border: 1px solid #e5ede9;
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .vdp-platform-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .vdp-platform-title { font-size: 0.875rem; font-weight: 700; color: #111827; margin-bottom: 0.25rem; }
        .vdp-platform-desc { font-size: 0.775rem; color: #6b7280; line-height: 1.55; }
        /* ── COMING SOON ── */
        .vdp-coming-soon {
          background: #ffffff;
          border: 1px solid #e5ede9;
          border-radius: 20px;
          padding: 3.5rem 2rem;
          text-align: center;
          max-width: 400px;
          margin: 3.5rem auto;
          box-shadow: 0 2px 14px rgba(0,0,0,0.04);
        }
        .vdp-cs-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.25rem;
        }
        .vdp-cs-title { font-size: 1.05rem; font-weight: 800; color: #111827; margin-bottom: 0.5rem; }
        .vdp-cs-desc { font-size: 0.8125rem; color: #6b7280; line-height: 1.65; margin-bottom: 1.25rem; }
        .vdp-cs-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.8rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .vdp-shell { flex-direction: column; }
          .vdp-mobile-header { display: flex; }
          .vdp-sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            width: 264px;
            transform: translateX(-100%);
            transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 50;
          }
          .vdp-sidebar.open { transform: translateX(0); }
          .vdp-brand-close { display: flex !important; }
          .vdp-main { padding: 1.5rem 1.125rem; }
        }
        @media (max-width: 540px) {
          .vdp-caps-grid { grid-template-columns: 1fr; }
          .vdp-greeting-title { font-size: 1.4rem; }
          .vdp-hero-heading { font-size: 1.25rem; }
        }
      `}</style>

      <div className="vdp-shell">

        {/* ── MOBILE HEADER ── */}
        <header className="vdp-mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button
              id="vdp-mobile-open"
              className="vdp-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu style={{ width: 20, height: 20 }} />
            </button>
            <div>
              <div style={{ fontWeight: 800, color: "#0c1f15", fontSize: "0.875rem", lineHeight: 1.2 }}>Shyampet</div>
              <div style={{ fontSize: "0.575rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.1em" }}>Civic Portal</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #047857)",
              color: "white", fontWeight: 700, fontSize: "0.7rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {session.name.charAt(0)}
            </div>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>{session.name.split(" ")[0]}</span>
          </div>
        </header>

        {/* ── MOBILE OVERLAY ── */}
        {mobileMenuOpen && (
          <div className="vdp-overlay" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* ── SIDEBAR ── */}
        <aside className={`vdp-sidebar${mobileMenuOpen ? " open" : ""}`}>
          <div className="vdp-sidebar-top">
            {/* Branding */}
            <div className="vdp-brand">
              <div className="vdp-brand-icon">
                <Leaf style={{ width: 17, height: 17, color: "white" }} />
              </div>
              <div>
                <div className="vdp-brand-name">Shyampet</div>
                <div className="vdp-brand-sub">Civic Portal</div>
              </div>
              <button
                className="vdp-brand-close"
                id="vdp-mobile-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X style={{ width: 17, height: 17 }} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="vdp-nav" role="navigation" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`vdp-nav-${item.id}`}
                    onClick={() => handleNav(item.id)}
                    className={`vdp-nav-btn${isActive ? " active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="vdp-nav-emoji">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Logout */}
          <div className="vdp-logout-zone">
            <button
              id="vdp-logout-btn"
              className="vdp-logout-btn"
              onClick={handleLogout}
            >
              <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="vdp-main" id="vdp-main-content">

          {/* ── HOME TAB ── */}
          {currentTab === "home" && (
            <div>
              {/* Greeting */}
              <div className="vdp-greeting">
                <h1 className="vdp-greeting-title">Welcome back, {session.name} 👋</h1>
                <p className="vdp-greeting-sub">Welcome to your village civic portal.</p>
              </div>

              {/* Hero */}
              <div className="vdp-hero">
                <div className="vdp-hero-badge">
                  <Sparkles style={{ width: 10, height: 10 }} />
                  Digital Village Platform
                </div>
                <h2 className="vdp-hero-heading">Your Village,<br />Digitally Connected</h2>
                <p className="vdp-hero-body">
                  Access village services, report civic problems, check weather, view market prices, and stay updated with local news — all in one place.
                </p>
              </div>

              {/* Capabilities */}
              <p className="vdp-caps-label">Platform Capabilities</p>
              <div className="vdp-caps-grid">
                {CAPABILITIES.map((cap) => (
                  <div
                    key={cap.id}
                    id={`vdp-cap-${cap.id}`}
                    className="vdp-cap-card"
                    onClick={() => handleNav(cap.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleNav(cap.id)}
                  >
                    <div className="vdp-cap-top">
                      <span className="vdp-cap-emoji">{cap.emoji}</span>
                      <span className="vdp-cap-arrow">Explore →</span>
                    </div>
                    <div className="vdp-cap-title">{cap.title}</div>
                    <div className="vdp-cap-desc">{cap.desc}</div>
                  </div>
                ))}
              </div>

              {/* One Platform Card */}
              <div className="vdp-platform-card">
                <div className="vdp-platform-icon">
                  <Sparkles style={{ width: 17, height: 17, color: "#059669" }} />
                </div>
                <div>
                  <div className="vdp-platform-title">One Digital Village Platform</div>
                  <div className="vdp-platform-desc">Everything important about your village in one simple place.</div>
                </div>
              </div>
            </div>
          )}

          {/* ── COMPLAINTS PLACEHOLDER ── */}
          {currentTab === "complaints" && (
            <div className="vdp-coming-soon">
              <div className="vdp-cs-icon" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <AlertCircle style={{ width: 26, height: 26, color: "#f59e0b" }} />
              </div>
              <div className="vdp-cs-title">Civic Complaints Module</div>
              <p className="vdp-cs-desc">
                This module will let you report civic problems — potholes, broken streetlights, water supply issues — and track department progress in real time.
              </p>
              <span className="vdp-cs-badge">Coming in Step 2</span>
            </div>
          )}

          {/* ── WEATHER PLACEHOLDER ── */}
          {currentTab === "weather" && (
            <div className="vdp-coming-soon">
              <div className="vdp-cs-icon" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <CloudSun style={{ width: 26, height: 26, color: "#3b82f6" }} />
              </div>
              <div className="vdp-cs-title">Weather Forecasting</div>
              <p className="vdp-cs-desc">
                This module will show current temperatures, hourly wind forecasts, 7-day outlooks, and localized farming weather advisories for your area.
              </p>
              <span className="vdp-cs-badge">Coming in Step 3</span>
            </div>
          )}

          {/* ── MARKET PRICES PLACEHOLDER ── */}
          {currentTab === "market" && (
            <div className="vdp-coming-soon">
              <div className="vdp-cs-icon" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                <TrendingUp style={{ width: 26, height: 26, color: "#059669" }} />
              </div>
              <div className="vdp-cs-title">Crop Market Prices</div>
              <p className="vdp-cs-desc">
                This module will display localized crop prices, mandi rate filters, crop price search, and comparative mandi rate highlights for farmers.
              </p>
              <span className="vdp-cs-badge">Coming in Step 4</span>
            </div>
          )}

          {/* ── LOCAL NEWS PLACEHOLDER ── */}
          {currentTab === "news" && (
            <div className="vdp-coming-soon">
              <div className="vdp-cs-icon" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                <FileText style={{ width: 26, height: 26, color: "#7c3aed" }} />
              </div>
              <div className="vdp-cs-title">Local News &amp; Alerts</div>
              <p className="vdp-cs-desc">
                This module will stream verified community news from Gram Sabha, categorized announcements, and important mandal-level updates.
              </p>
              <span className="vdp-cs-badge">Coming in Step 5</span>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
