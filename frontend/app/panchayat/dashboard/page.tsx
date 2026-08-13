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
import IndianNationalEmblem from "@/components/IndianNationalEmblem";
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
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  fetchComplaintsApi,
  fetchComplaintKPIsApi,
  updateComplaintStatusApi,
  type Complaint,
  type ComplaintKPIs,
} from "@/services/complaintsApi";

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

const AI_CAPABILITIES = [
  {
    icon: Cpu,
    label: "Smart Classification",
    desc: "AI tags by type, urgency and dept.",
    badge: "Live",
    badgeColor: "#047857",
    badgeBg: "#dcfce7",
    iconColor: "#047857",
    iconBg: "#ecfdf5",
  },
  {
    icon: AlertTriangle,
    label: "Priority Routing",
    desc: "Auto-escalation for critical issues.",
    badge: "Live",
    badgeColor: "#047857",
    badgeBg: "#dcfce7",
    iconColor: "#d97706",
    iconBg: "#fffbeb",
  },
  {
    icon: TrendingUp,
    label: "Analytics",
    desc: "Resolution trends and heatmaps.",
    badge: "Phase 2",
    badgeColor: "#7c3aed",
    badgeBg: "#f3e8ff",
    iconColor: "#7c3aed",
    iconBg: "#f3e8ff",
  },
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, badge: null },
  { icon: ClipboardList, label: "Complaints", active: false, badge: "Live" },
  { icon: BarChart3, label: "Analytics", active: false, badge: null },
  { icon: FileText, label: "Reports", active: false, badge: null },
  { icon: Map, label: "Village Map", active: false, badge: null },
  { icon: AlertTriangle, label: "Escalations", active: false, badge: null },
];

const BAR_DATA = [
  { day: "Su", h: 20, today: false },
  { day: "Mo", h: 45, today: false },
  { day: "Tu", h: 30, today: false },
  { day: "We", h: 65, today: true },
  { day: "Th", h: 40, today: false },
  { day: "Fr", h: 50, today: false },
  { day: "Sa", h: 15, today: false },
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

  // Real Dynamic Complaints State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [kpis, setKpis] = useState<ComplaintKPIs>({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    high_urgency: 0,
    resolution_rate: "0%",
    category_breakdown: {},
  });
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/"); return; }
    if (isVillager(s)) { router.replace("/citizen/dashboard"); return; }
    if (isPanchayatOfficial(s)) setSession(s);
    setLoading(false);
    loadAllComplaints();
  }, [router]);

  const loadAllComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const [list, stats] = await Promise.all([
        fetchComplaintsApi(),
        fetchComplaintKPIsApi(),
      ]);
      setComplaints(list);
      setKpis(stats);
    } catch (err) {
      console.warn("Failed to load complaints from backend", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: "pending" | "in_progress" | "resolved") => {
    setUpdatingId(complaintId);
    try {
      const updated = await updateComplaintStatusApi(complaintId, newStatus);
      if (updated) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
        );
        // Refresh KPIs
        const stats = await fetchComplaintKPIsApi();
        setKpis(stats);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => { clearSession(); router.push("/"); };

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const weekDates = getWeekDates();
  const displayName = session.name.replace("Demo Gram Panchayat", "").trim() || session.name;

  // Filter complaints
  const filteredComplaints = statusFilter === "ALL"
    ? complaints
    : complaints.filter((c) => c.status === statusFilter);

  // Dynamic Resolution rates per category
  const categories = ["Roads & Infrastructure", "Water Supply", "Sanitation", "Electricity"];
  const categoryStats = categories.map((cat) => {
    const totalInCat = complaints.filter((c) => c.category === cat || (cat.includes("Roads") && c.category.includes("Road"))).length;
    const resolvedInCat = complaints.filter((c) => (c.category === cat || (cat.includes("Roads") && c.category.includes("Road"))) && c.status === "resolved").length;
    const pct = totalInCat > 0 ? Math.round((resolvedInCat / totalInCat) * 100) : 0;
    const color = cat.includes("Road") ? "#2563eb" : cat.includes("Water") ? "#0284c7" : cat.includes("Sanitation") ? "#16a34a" : "#7c3aed";
    return { label: cat.replace(" & Infrastructure", ""), pct, color, total: totalInCat, resolved: resolvedInCat };
  });

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
            <div className="sidebar-logo-name">Civic Catalyst</div>
            <div className="sidebar-logo-version">Panchayat Portal · v1.0</div>
          </div>
        </div>

        {/* Nav */}
        <p className="sidebar-section-label">Main Menu</p>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ icon: Icon, label, active, badge }) => (
            <button
              key={label}
              className={`sidebar-nav-item${active ? " active" : ""}`}
              style={{ width: "100%", textAlign: "left", background: "transparent", cursor: "pointer" }}
            >
              <Icon className="sidebar-nav-icon" />
              <span className="sidebar-nav-text">{label}</span>
              {badge && <span className="sidebar-nav-badge">{badge}</span>}
            </button>
          ))}
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
          <div className="topbar-search">
            <Search style={{ width: 14, height: 14, color: "rgba(148,163,184,0.6)" }} />
            <input
              type="text"
              placeholder="Search registered complaints, citizens, or locations..."
              className="topbar-search-input"
            />
          </div>

          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Real-time sync button */}
            <button
              onClick={loadAllComplaints}
              disabled={loadingComplaints}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#f0fdf4",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                padding: "0.4rem 0.75rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#047857",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={13} className={loadingComplaints ? "animate-spin" : ""} />
              {loadingComplaints ? "Syncing..." : "Sync DB"}
            </button>

            <button className="topbar-icon-btn" title="Messages">
              <MessageSquare style={{ width: 15, height: 15 }} />
            </button>
            <button className="topbar-icon-btn" title="Notifications">
              <Bell style={{ width: 15, height: 15 }} />
              <span className="topbar-notif-dot">{kpis.pending > 0 ? kpis.pending : "0"}</span>
            </button>

            <div className="topbar-profile">
              <div className="topbar-avatar">{getInitials(displayName)}</div>
              <div>
                <div className="topbar-profile-name">{displayName}</div>
                <div className="topbar-profile-role">{session.village} · Panchayat Officer</div>
              </div>
              <ChevronDown style={{ width: 12, height: 12, color: "rgba(148,163,184,0.4)", marginLeft: "0.25rem" }} />
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="panchayat-content">

          {/* Low opacity Indian National Emblem Watermark */}
          <IndianNationalEmblem opacity={0.045} className="emblem-watermark" />

          {/* Background orbs (subtle) */}
          <div className="orb orb-1" style={{ opacity: 0.5 }} />
          <div className="orb orb-2" style={{ opacity: 0.4 }} />

          {/* Greeting row */}
          <div className="greeting-row fade-up fade-up-1">
            <div>
              <h1 className="greeting-title" style={{ display: "inline-flex", alignItems: "center" }}>
                {getHour()}, {displayName.split(" ")[0]}
                <div className="weather-widget-box" title="Live Weather">
                  <div className="container">
                    <div className="sun sunshine" />
                    <div className="sun" />
                    <div className="cloud back">
                      <span className="left-back" />
                      <span className="right-back" />
                    </div>
                    <div className="cloud front">
                      <span className="left-front" />
                      <span className="right-front" />
                    </div>
                  </div>
                </div>
              </h1>
              <div className="greeting-sub">
                <MapPin style={{ width: 13, height: 13 }} />
                {session.village} · Gram Panchayat Dashboard
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginLeft: "0.5rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#34d399", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: "999px", padding: "0.15rem 0.5rem" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  Live Cloud DB
                </span>
              </div>
            </div>
            <button className="add-report-btn" onClick={loadAllComplaints}>
              <RefreshCw style={{ width: 15, height: 15 }} className={loadingComplaints ? "animate-spin" : ""} />
              Refresh Complaints
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
                  Active / Pending Issues
                  <span style={{ marginLeft: "auto", fontWeight: 500, opacity: 0.7, textTransform: "none", letterSpacing: 0, fontSize: "0.7rem" }}>···</span>
                </div>
                <div>
                  <div className="featured-stat-value">
                    {kpis.pending} <span>/ {kpis.total} total registered</span>
                  </div>
                  <div className="featured-stat-sub">
                    {kpis.high_urgency > 0 ? `⚠️ ${kpis.high_urgency} High-Urgency complaints requiring action` : "All critical complaints addressed"}
                  </div>
                </div>
                <div className="featured-progress">
                  <div
                    className="featured-progress-fill"
                    style={{ width: kpis.total > 0 ? `${(kpis.resolved / kpis.total) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              {/* Mini stats */}
              <div className="mini-stat-row">
                {[
                  { num: kpis.total, lbl: "Total", color: "#0f172a" },
                  { num: kpis.pending, lbl: "Pending", color: "#d97706" },
                  { num: kpis.in_progress, lbl: "Active", color: "#2563eb" },
                  { num: kpis.resolved, lbl: "Resolved", color: "#16a34a" },
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
                  <span className="chart-title">Resolution Performance</span>
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
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: "10px", background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                  <Zap style={{ width: 13, height: 13, color: "#047857" }} />
                  <span style={{ fontSize: "0.75rem", color: "#042d20", fontWeight: 700 }}>AI Vision &amp; Auto-Routing Active</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "#059669", fontWeight: 600 }}>live</span>
                </div>
              </div>

              {/* System status */}
              <div className="glass-card" style={{ padding: "1.125rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#042d20" }}>System Status</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 8px rgba(22,163,74,0.6)" }} />
                </div>
                {[
                  { label: "AI Vision Classification", ok: true },
                  { label: "Complaint Auto-Routing", ok: true },
                  { label: "Supabase Real-Time DB", ok: true },
                  { label: "Live GPS Tracking", ok: true },
                ].map(({ label, ok }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "0.78rem", color: "#334155", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", borderRadius: "999px", padding: "0.15rem 0.5rem" }}>Operational</span>
                  </div>
                ))}
              </div>

            </div>

            {/* ── CENTER COL (Real Complaints Stream) ─────── */}
            <div className="dash-col-center fade-up fade-up-3">

              {/* Complaints card */}
              <div className="complaints-card">
                <div className="complaints-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span className="complaints-card-title">Live Citizen Complaints ({filteredComplaints.length})</span>
                    <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "0.15rem" }}>Real-time issues submitted by villagers via Citizen Portal</div>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    {["ALL", "pending", "in_progress", "resolved"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: 6,
                          border: statusFilter === s ? "1px solid #047857" : "1px solid #e2e8f0",
                          background: statusFilter === s ? "#047857" : "#ffffff",
                          color: statusFilter === s ? "#ffffff" : "#475569",
                          cursor: "pointer",
                          textTransform: "capitalize"
                        }}
                      >
                        {s === "ALL" ? "All" : s === "in_progress" ? "In Progress" : s}
                      </button>
                    ))}
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
                {loadingComplaints && complaints.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem", color: "#047857" }} />
                    <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Connecting to Supabase Complaints Stream...</div>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748b" }}>
                    <CheckCircle2 size={32} style={{ margin: "0 auto 0.5rem", color: "#16a34a" }} />
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>No complaints in this view!</div>
                    <div style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}>New issues submitted by citizens will instantly show up here.</div>
                  </div>
                ) : (
                  filteredComplaints.map((c) => (
                    <div key={c.id} className="complaint-item" style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", padding: "1rem" }}>
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={c.title}
                          style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid #a7f3d0", flexShrink: 0 }}
                        />
                      ) : (
                        <div className="complaint-avatar" style={{ background: c.avatarBg || "#064e3b", flexShrink: 0 }}>
                          {getInitials(c.villager_name || "Citizen")}
                        </div>
                      )}

                      <div className="complaint-info" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                          <span className="complaint-title" style={{ fontSize: "0.9rem", fontWeight: 800 }}>{c.title}</span>
                          {c.aiGenerated && (
                            <span style={{ fontSize: "0.62rem", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "0.1rem 0.35rem", borderRadius: 999, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
                              <Sparkles style={{ width: 8, height: 8 }} /> AI Auto-Written
                            </span>
                          )}
                          {c.urgency && (
                            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c.urgency === "High" ? "#dc2626" : "#d97706", background: c.urgency === "High" ? "#fef2f2" : "#fffbeb", padding: "0.1rem 0.35rem", borderRadius: 4 }}>
                              {c.urgency}
                            </span>
                          )}
                        </div>

                        {c.description && (
                          <div style={{ fontSize: "0.76rem", color: "#475569", lineHeight: 1.4, marginBottom: "0.3rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {c.description}
                          </div>
                        )}

                        <div className="complaint-name" style={{ fontSize: "0.74rem", color: "#64748b" }}>
                          👤 <strong style={{ color: "#0f172a" }}>{c.villager_name}</strong> · 📍 {c.location} · <span style={{ color: "#059669", fontWeight: 600 }}>{c.category}</span> · {c.date}
                        </div>
                      </div>

                      {/* Official Action / Status Dropdown */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                        <select
                          value={c.status}
                          disabled={updatingId === c.id}
                          onChange={(e) => handleUpdateStatus(c.id, e.target.value as any)}
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "0.3rem 0.5rem",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            background: c.status === "resolved" ? "#dcfce7" : c.status === "in_progress" ? "#eff6ff" : "#fffbeb",
                            color: c.status === "resolved" ? "#166534" : c.status === "in_progress" ? "#1e40af" : "#92400e",
                            cursor: "pointer",
                            outline: "none"
                          }}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="in_progress">⚙️ In Progress</option>
                          <option value="resolved">✅ Resolved</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* AI Capabilities */}
              <div className="ai-pill-card">
                <div className="ai-pill-header">
                  <div className="ai-pill-title">AI-Powered Civic Automation</div>
                  <div className="ai-pill-sub">Real-time vision classification and intelligent grievance routing</div>
                </div>
                {AI_CAPABILITIES.map(({ icon: Icon, label, desc, badge, badgeColor, badgeBg, iconColor, iconBg }) => (
                  <div key={label} className="feature-item" style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f1f5f9" }}>
                    <div className="feature-icon-wrap" style={{ background: iconBg, borderColor: "transparent" }}>
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

              {/* Escalation Alerts (Dynamic from high urgency pending items) */}
              <div className="alerts-card">
                <div className="alerts-header">
                  <span className="alerts-title">Urgent Action Alerts</span>
                  <span style={{ fontSize: "0.72rem", background: "#fef2f2", color: "#dc2626", padding: "0.15rem 0.5rem", borderRadius: 999, fontWeight: 700 }}>
                    {complaints.filter(c => c.urgency === "High" && c.status !== "resolved").length} High Priority
                  </span>
                </div>

                {complaints.filter(c => c.status !== "resolved").slice(0, 4).map((c, idx) => (
                  <div key={c.id || idx} className="alert-item" style={{ padding: "0.85rem 1.1rem" }}>
                    <div className={`alert-dot ${c.urgency === "High" ? "red" : "yellow"}`}>
                      {c.category.includes("Water") ? (
                        <Droplets style={{ width: 14, height: 14, color: "#dc2626" }} />
                      ) : c.category.includes("Sanitation") ? (
                        <Trash2 style={{ width: 14, height: 14, color: "#d97706" }} />
                      ) : (
                        <AlertCircle style={{ width: 14, height: 14, color: "#dc2626" }} />
                      )}
                    </div>
                    <div className="alert-info">
                      <div className="alert-name" style={{ fontSize: "0.82rem", fontWeight: 800 }}>{c.title}</div>
                      <div className="alert-desc" style={{ fontSize: "0.72rem" }}>📍 {c.location} · {c.date}</div>
                    </div>
                    <button
                      className="alert-action"
                      onClick={() => handleUpdateStatus(c.id, "in_progress")}
                      style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}
                    >
                      Process
                    </button>
                  </div>
                ))}

                {complaints.filter(c => c.status !== "resolved").length === 0 && (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b", fontSize: "0.8rem" }}>
                    🎉 No pending escalation alerts. All complaints are resolved!
                  </div>
                )}
              </div>

              {/* Dynamic Resolution Rate info card */}
              <div className="glass-card" style={{ padding: "1.125rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Activity style={{ width: 16, height: 16, color: "#059669" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#042d20" }}>Resolution Rate by Dept</span>
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#047857" }}>{kpis.resolution_rate} Overall</span>
                </div>
                {categoryStats.map(({ label, pct, color, total, resolved }) => (
                  <div key={label} style={{ marginBottom: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "#334155", fontWeight: 600 }}>{label} ({resolved}/{total})</span>
                      <span style={{ fontSize: "0.75rem", color, fontWeight: 800 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: color, transition: "width 0.6s ease", boxShadow: `0 2px 6px ${color}40` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Panchayat Support Card */}
              <div className="glass-card" style={{ padding: "1.125rem", background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)", border: "1px solid #a7f3d0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Shield style={{ width: 16, height: 16, color: "#047857" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#042d20" }}>Panchayat Helpdesk</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.5, marginBottom: "0.75rem" }}>
                  Direct line to District Collectorate &amp; Mandal Development Officer (MDO).
                </p>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#047857", background: "#ffffff", padding: "0.4rem 0.75rem", borderRadius: 8, border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <ShieldCheck size={14} /> District Helpline: 1800-425-001
                </div>
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
                Live Complaints Stream
              </div>
            </div>

            <div className="timeline-track">
              <div className="timeline-hours">
                {["6:00 AM", "8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM", "8:00 PM"].map(h => (
                  <div key={h} className="timeline-hour">{h}</div>
                ))}
              </div>

              <div className="timeline-ruler">
                <div className="timeline-now-line" style={{ left: "45%" }} />
              </div>

              {/* Dynamic Complaint chips */}
              <div className="timeline-chips">
                {complaints.slice(0, 4).map((c, i) => (
                  <div
                    key={c.id || i}
                    className={`timeline-chip ${c.status}`}
                    style={{ left: `${12 + i * 22}%` }}
                  >
                    <div className="timeline-chip-icon" style={{ background: c.status === "resolved" ? "rgba(16,185,129,0.12)" : c.status === "in_progress" ? "rgba(59,130,246,0.12)" : "rgba(251,191,36,0.15)" }}>
                      {c.status === "resolved" ? (
                        <CheckCircle2 style={{ width: 10, height: 10, color: "#34d399" }} />
                      ) : c.status === "in_progress" ? (
                        <Activity style={{ width: 10, height: 10, color: "#60a5fa" }} />
                      ) : (
                        <Clock style={{ width: 10, height: 10, color: "#fbbf24" }} />
                      )}
                    </div>
                    {c.title.slice(0, 22)} · {c.status === "in_progress" ? "In Progress" : c.status}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
