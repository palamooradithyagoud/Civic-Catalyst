"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isVillager,
  isPanchayatOfficial,
  clearSession,
} from "@/services/demoSession";
import type { DemoPanchayat } from "@/types";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  FileText,
  Map,
  AlertTriangle,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  MessageSquare,
  Bell,
  ChevronDown,
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  Activity,
  Droplets,
  Trash2,
  Lightbulb,
  AlertCircle,
  Cpu,
  TrendingUp,
  Calendar,
} from "lucide-react";

// ── Demo complaint data ─────────────────────────────────────────────────────

const TODAY = new Date();
const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getWeekDates() {
  const result = [];
  const day = TODAY.getDay();
  for (let i = 0; i < 7; i++) {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() - day + i);
    result.push({ name: WEEK_DAYS[i], num: d.getDate(), isToday: d.toDateString() === TODAY.toDateString() });
  }
  return result;
}

const DEMO_COMPLAINTS = [
  {
    id: "C-001",
    title: "Broken road near market",
    villagerName: "Ramesh Kumar",
    status: "pending" as const,
    category: "Roads",
    date: "Today, 9:15 AM",
    avatarBg: "#1b4fd8",
  },
  {
    id: "C-002",
    title: "No street lights on Main Street",
    villagerName: "Priya Sharma",
    status: "in_progress" as const,
    category: "Electricity",
    date: "Today, 8:30 AM",
    avatarBg: "#7c3aed",
  },
  {
    id: "C-003",
    title: "Water supply disruption",
    villagerName: "Suresh Reddy",
    status: "pending" as const,
    category: "Water",
    date: "Yesterday, 6:00 PM",
    avatarBg: "#0891b2",
  },
  {
    id: "C-004",
    title: "Garbage not collected",
    villagerName: "Meena Patel",
    status: "resolved" as const,
    category: "Sanitation",
    date: "Yesterday, 2:45 PM",
    avatarBg: "#059669",
  },
];

const ESCALATION_ALERTS = [
  {
    id: 1,
    name: "Water Supply",
    desc: "48h unresolved",
    dotClass: "red" as const,
    action: "Escalate",
    icon: Droplets,
    iconColor: "#60a5fa",
  },
  {
    id: 2,
    name: "Road Damage",
    desc: "High traffic risk",
    dotClass: "yellow" as const,
    action: "Assign",
    icon: AlertCircle,
    iconColor: "#fbbf24",
  },
  {
    id: 3,
    name: "Street Lighting",
    desc: "In progress · 3h",
    dotClass: "blue" as const,
    action: "View",
    icon: Lightbulb,
    iconColor: "#a78bfa",
  },
  {
    id: 4,
    name: "Sanitation",
    desc: "Resolved today",
    dotClass: "blue" as const,
    action: "Details",
    icon: Trash2,
    iconColor: "#34d399",
  },
];

const AI_CAPABILITIES = [
  {
    icon: Cpu,
    label: "Smart Classification",
    desc: "AI tags by type, urgency and dept.",
    badge: "Live",
    badgeColor: "#34d399",
    badgeBg: "rgba(16,185,129,0.1)",
    iconColor: "#93c5fd",
    iconBg: "rgba(27,79,216,0.12)",
  },
  {
    icon: AlertTriangle,
    label: "Priority Routing",
    desc: "Auto-escalation for critical issues.",
    badge: "Live",
    badgeColor: "#34d399",
    badgeBg: "rgba(16,185,129,0.1)",
    iconColor: "#fbbf24",
    iconBg: "rgba(251,191,36,0.1)",
  },
  {
    icon: TrendingUp,
    label: "Analytics",
    desc: "Resolution trends and heatmaps.",
    badge: "Phase 2",
    badgeColor: "#a78bfa",
    badgeBg: "rgba(124,58,237,0.1)",
    iconColor: "#a78bfa",
    iconBg: "rgba(124,58,237,0.1)",
  },
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, badge: null },
  { icon: ClipboardList, label: "Complaints", active: false, badge: "4" },
  { icon: BarChart3, label: "Analytics", active: false, badge: null },
  { icon: FileText, label: "Reports", active: false, badge: null },
  { icon: Map, label: "Village Map", active: false, badge: null },
  { icon: AlertTriangle, label: "Escalations", active: false, badge: "2" },
];

const BAR_DATA = [
  { day: "Su", h: 20, today: false },
  { day: "Mo", h: 45, today: false },
  { day: "Tu", h: 30, today: false },
  { day: "We", h: 65, today: true },
  { day: "Th", h: 0, today: false },
  { day: "Fr", h: 0, today: false },
  { day: "Sa", h: 0, today: false },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getHour() {
  const h = TODAY.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function PanchayatDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<DemoPanchayat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/"); return; }
    if (isVillager(s)) { router.replace("/citizen/dashboard"); return; }
    if (isPanchayatOfficial(s)) setSession(s);
    setLoading(false);
  }, [router]);

  const handleLogout = () => { clearSession(); router.push("/"); };

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#05111f" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const weekDates = getWeekDates();
  const displayName = session.name.replace("Demo Gram Panchayat", "").trim() || session.name;

  return (
    <div className="panchayat-shell">

      {/* ── SIDEBAR ───────────────────────────────────────── */}
      <aside className="panchayat-sidebar">
        <div className="india-bar-sidebar" />

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Shield style={{ width: 16, height: 16, color: "white" }} />
          </div>
          <div>
            <div className="sidebar-logo-name">Nivaaran AI</div>
            <div className="sidebar-logo-version">Panchayat Portal · v1.0</div>
          </div>
        </div>

        {/* Nav */}
        <p className="sidebar-section-label">Main Menu</p>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ icon: Icon, label, active, badge }) => (
            <div key={label} className={`sidebar-nav-item${active ? " active" : ""}`}>
              <Icon className="sidebar-nav-icon" />
              {label}
              {badge && <span className="sidebar-nav-badge">{badge}</span>}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button className="sidebar-bottom-item">
            <Settings style={{ width: 15, height: 15 }} />
            Settings
          </button>
          <button className="sidebar-bottom-item">
            <HelpCircle style={{ width: 15, height: 15 }} />
            Support
          </button>
          <button className="sidebar-bottom-item danger" onClick={handleLogout}>
            <LogOut style={{ width: 15, height: 15 }} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── BODY ──────────────────────────────────────────── */}
      <div className="panchayat-body">

        {/* Top bar */}
        <header className="panchayat-topbar">
          <div className="topbar-search">
            <Search style={{ width: 14, height: 14, color: "rgba(148,163,184,0.4)", flexShrink: 0 }} />
            <input className="topbar-search-input" placeholder="Search complaints, villagers..." readOnly />
            <span className="topbar-search-kbd">⌘ K</span>
          </div>

          <div className="topbar-right">
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
                <div className="topbar-profile-role">{session.village}</div>
              </div>
              <ChevronDown style={{ width: 12, height: 12, color: "rgba(148,163,184,0.4)", marginLeft: "0.25rem" }} />
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="panchayat-content">

          {/* Background orbs (subtle) */}
          <div className="orb orb-1" style={{ opacity: 0.5 }} />
          <div className="orb orb-2" style={{ opacity: 0.4 }} />

          {/* Greeting row */}
          <div className="greeting-row fade-up fade-up-1">
            <div>
              <h1 className="greeting-title">{getHour()}, {displayName.split(" ")[0]} 👋</h1>
              <div className="greeting-sub">
                <MapPin style={{ width: 13, height: 13 }} />
                {session.village} · Gram Panchayat Dashboard
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginLeft: "0.5rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#34d399", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: "999px", padding: "0.15rem 0.5rem" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  Live
                </span>
              </div>
            </div>
            <button className="add-report-btn" onClick={() => alert("Complaint management coming in Phase 2!")}>
              <Plus style={{ width: 16, height: 16 }} />
              New Report
            </button>
          </div>

          {/* 3-column grid */}
          <div className="dash-grid">

            {/* ── LEFT COL ────────────────────────────────── */}
            <div className="dash-col-left fade-up fade-up-2">

              {/* Featured stat card */}
              <div className="featured-stat-card blue">
                <div className="featured-stat-label">
                  <ClipboardList style={{ width: 12, height: 12 }} />
                  Pending Complaints
                  <span style={{ marginLeft: "auto", fontWeight: 500, opacity: 0.7, textTransform: "none", letterSpacing: 0, fontSize: "0.7rem" }}>···</span>
                </div>
                <div>
                  <div className="featured-stat-value">
                    4 <span>/ 4 total</span>
                  </div>
                  <div className="featured-stat-sub">Ramesh Kumar · Today at 9:15 AM</div>
                </div>
                <div className="featured-progress">
                  <div className="featured-progress-fill" style={{ width: "0%" }} />
                </div>
              </div>

              {/* Mini stats */}
              <div className="mini-stat-row">
                {[
                  { num: 4, lbl: "Total", color: "#94a3b8" },
                  { num: 2, lbl: "Pending", color: "#fbbf24" },
                  { num: 1, lbl: "Active", color: "#60a5fa" },
                  { num: 1, lbl: "Resolved", color: "#34d399" },
                ].map(({ num, lbl, color }) => (
                  <div key={lbl} className="mini-stat-card">
                    <div className="mini-stat-num" style={{ color }}>{num}</div>
                    <div className="mini-stat-lbl">{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Weekly activity bar chart */}
              <div className="weekly-chart-card">
                <div className="chart-header">
                  <span className="chart-title">Weekly Activity</span>
                  <button className="chart-more-btn"><MoreHorizontal style={{ width: 14, height: 14 }} /></button>
                </div>
                <div className="bar-chart">
                  {BAR_DATA.map(({ day, h, today }) => (
                    <div key={day} className="bar-chart-day">
                      <div
                        className={`bar-chart-bar ${h === 0 ? "empty" : today ? "today" : "filled"}`}
                        style={{ height: h === 0 ? "30%" : `${h}%` }}
                      />
                      <span className={`bar-chart-lbl${today ? " today" : ""}`}>{day}</span>
                    </div>
                  ))}
                </div>

                {/* AI status row */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: "10px", background: "rgba(27,79,216,0.08)", border: "1px solid rgba(27,79,216,0.15)" }}>
                  <Zap style={{ width: 12, height: 12, color: "#fbbf24" }} />
                  <span style={{ fontSize: "0.72rem", color: "#93c5fd", fontWeight: 600 }}>AI classification active</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "rgba(148,163,184,0.5)" }}>real-time</span>
                </div>
              </div>

            </div>

            {/* ── CENTER COL ──────────────────────────────── */}
            <div className="dash-col-center fade-up fade-up-3">

              {/* Complaints card */}
              <div className="complaints-card">
                <div className="complaints-card-header">
                  <span className="complaints-card-title">Recent Complaints</span>
                  <div className="complaints-nav-btns">
                    <button className="complaints-nav-btn"><ChevronLeft style={{ width: 13, height: 13 }} /></button>
                    <button className="complaints-nav-btn"><ChevronRight style={{ width: 13, height: 13 }} /></button>
                  </div>
                </div>

                {/* Week calendar strip */}
                <div className="week-strip">
                  {weekDates.map(({ name, num, isToday }) => (
                    <div key={name} className="week-day">
                      <span className="week-day-name">{name}</span>
                      <span className={`week-day-num${isToday ? " today" : ""}`}>{num}</span>
                    </div>
                  ))}
                </div>

                {/* Complaint items */}
                {DEMO_COMPLAINTS.map((c) => (
                  <div key={c.id} className="complaint-item">
                    <div>
                      <div className="complaint-item-date">{c.date}</div>
                    </div>
                    <div className="complaint-avatar" style={{ background: c.avatarBg }}>
                      {getInitials(c.villagerName)}
                    </div>
                    <div className="complaint-info">
                      <div className="complaint-title">{c.title}</div>
                      <div className="complaint-name">{c.villagerName} · {c.category}</div>
                    </div>
                    <span className={`complaint-status ${c.status}`}>
                      {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Capabilities */}
              <div className="ai-pill-card">
                <div className="ai-pill-header">
                  <div className="ai-pill-title">AI-Powered Features</div>
                  <div className="ai-pill-sub">Intelligent automation for Panchayat officials</div>
                </div>
                {AI_CAPABILITIES.map(({ icon: Icon, label, desc, badge, badgeColor, badgeBg, iconColor, iconBg }) => (
                  <div key={label} className="feature-item" style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="feature-icon-wrap" style={{ background: iconBg, borderColor: "rgba(255,255,255,0.06)" }}>
                      <Icon style={{ width: 15, height: 15, color: iconColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="feature-label">{label}</p>
                      <p className="feature-desc">{desc}</p>
                    </div>
                    <span className="feature-badge" style={{ background: badgeBg, border: "1px solid transparent", color: badgeColor }}>{badge}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* ── RIGHT COL ───────────────────────────────── */}
            <div className="dash-col-right fade-up fade-up-4">

              {/* Escalation Alerts */}
              <div className="alerts-card">
                <div className="alerts-header">
                  <span className="alerts-title">Escalation Alerts</span>
                  <button className="alerts-view-all">View All</button>
                </div>
                {ESCALATION_ALERTS.map(({ id, name, desc, dotClass, action, icon: Icon, iconColor }) => (
                  <div key={id} className="alert-item">
                    <div className={`alert-dot ${dotClass}`}>
                      <Icon style={{ width: 14, height: 14, color: iconColor }} />
                    </div>
                    <div className="alert-info">
                      <div className="alert-name">{name}</div>
                      <div className="alert-desc">{desc}</div>
                    </div>
                    <button
                      className={`alert-action${desc.includes("Resolved") ? " muted" : ""}`}
                      onClick={() => desc.includes("Resolved") ? null : alert(`${action} — coming in Phase 2`)}
                    >
                      {action}
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick info card */}
              <div className="glass-card" style={{ padding: "1.125rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Activity style={{ width: 15, height: 15, color: "#60a5fa" }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e2e8f0" }}>Resolution Rate</span>
                </div>
                {[
                  { label: "Roads", pct: 40, color: "#3b82f6" },
                  { label: "Water", pct: 0, color: "#0891b2" },
                  { label: "Electricity", pct: 60, color: "#a78bfa" },
                  { label: "Sanitation", pct: 100, color: "#34d399" },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ marginBottom: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "rgba(148,163,184,0.7)", fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: "0.72rem", color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: color, transition: "width 1s ease", boxShadow: `0 0 8px ${color}50` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* System status */}
              <div className="glass-card" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.8375rem", fontWeight: 700, color: "#e2e8f0" }}>System Status</span>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", boxShadow: "0 0 6px #34d399" }} />
                </div>
                {[
                  { label: "AI Classification", ok: true },
                  { label: "Complaint Routing", ok: true },
                  { label: "Notifications", ok: true },
                  { label: "Live Tracking", ok: false, phase: "Phase 2" },
                ].map(({ label, ok, phase }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(148,163,184,0.65)" }}>{label}</span>
                    {ok
                      ? <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#34d399", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: "999px", padding: "0.1rem 0.4rem" }}>Operational</span>
                      : <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#a78bfa", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: "999px", padding: "0.1rem 0.4rem" }}>{phase}</span>
                    }
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ── BOTTOM TIMELINE ───────────────────────────── */}
          <div className="timeline-card fade-up fade-up-5">
            <div className="timeline-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button className="timeline-nav"><ChevronLeft style={{ width: 13, height: 13 }} /></button>
                <div className="timeline-date">
                  <Calendar style={{ width: 15, height: 15, color: "#60a5fa" }} />
                  {TODAY.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}
                </div>
                <button className="timeline-nav"><ChevronRight style={{ width: 13, height: 13 }} /></button>
              </div>
              <div className="timeline-view-select">
                Daily
                <ChevronDown style={{ width: 12, height: 12, color: "rgba(148,163,184,0.5)" }} />
              </div>
            </div>

            <div className="timeline-track">
              {/* Hour labels */}
              <div className="timeline-hours">
                {["0:00", "2:00", "4:00", "6:00", "8:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"].map(h => (
                  <div key={h} className="timeline-hour">{h}</div>
                ))}
              </div>

              <div className="timeline-ruler">
                <div className="timeline-now-line" style={{ left: "38%" }} />
              </div>

              {/* Complaint chips */}
              <div className="timeline-chips">
                <div className="timeline-chip pending" style={{ left: "15%" }}>
                  <div className="timeline-chip-icon" style={{ background: "rgba(251,191,36,0.15)" }}>
                    <Clock style={{ width: 10, height: 10, color: "#fbbf24" }} />
                  </div>
                  Road damage · Pending
                </div>
                <div className="timeline-chip resolved" style={{ left: "38%" }}>
                  <div className="timeline-chip-icon" style={{ background: "rgba(16,185,129,0.12)" }}>
                    <CheckCircle2 style={{ width: 10, height: 10, color: "#34d399" }} />
                  </div>
                  Sanitation · Resolved
                </div>
                <div className="timeline-chip in_progress" style={{ left: "26%" }}>
                  <div className="timeline-chip-icon" style={{ background: "rgba(59,130,246,0.12)" }}>
                    <Activity style={{ width: 10, height: 10, color: "#60a5fa" }} />
                  </div>
                  Street light · In Progress
                </div>
                <div className="timeline-chip pending" style={{ left: "55%" }}>
                  <div className="timeline-chip-icon" style={{ background: "rgba(251,191,36,0.15)" }}>
                    <Clock style={{ width: 10, height: 10, color: "#fbbf24" }} />
                  </div>
                  Water supply · Pending
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
