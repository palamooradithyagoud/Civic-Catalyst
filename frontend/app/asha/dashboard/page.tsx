"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isAshaWorker,
  setAshaSession,
  clearSession,
  DEMO_ASHA_WORKER,
} from "@/services/demoSession";
import type { DemoAshaWorker } from "@/types";
import IndianNationalEmblem from "@/components/IndianNationalEmblem";
import {
  HeartPulse,
  Users,
  Baby,
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Droplets,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Stethoscope,
  Syringe,
  TrendingUp,
  Zap,
  Bell,
  ChevronDown,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";

// ── Demo ASHA Patient / Visit Data ─────────────────────────────────────────

const PATIENT_VISITS = [
  {
    id: "P-101",
    name: "Lakshmi Narayana",
    ward: "Ward 3",
    type: "Maternal Health (7 Months)",
    risk: "high",
    lastVisit: "Today, 10:30 AM",
    status: "HB Low (8.5g) · Iron Tablets Given",
  },
  {
    id: "P-102",
    name: "Anitha & Baby Sairam",
    ward: "Ward 4",
    type: "Infant Immunization (Polio 2)",
    risk: "normal",
    lastVisit: "Yesterday, 3:15 PM",
    status: "Vaccination Done · Next: 10th Sep",
  },
  {
    id: "P-103",
    name: "Venkatesh (Family of 5)",
    ward: "Ward 3",
    type: "Fever & Diarrhea Cluster",
    risk: "urgent",
    lastVisit: "Today, 8:45 AM",
    status: "Escalated to Panchayat Water Testing",
  },
  {
    id: "P-104",
    name: "Sunitha Rao",
    ward: "Ward 2",
    type: "Postnatal Care (PNC Visit 3)",
    risk: "normal",
    lastVisit: "12 Aug, 2:00 PM",
    status: "Mother & Baby Healthy",
  },
];

const HEALTH_ESCALATIONS = [
  {
    id: "ESC-01",
    issue: "Dirty Water Supply causing Typhoid & Fever",
    location: "Ward 3, Near Handpump #2",
    priority: "HIGH",
    panchayatStatus: "In Progress (Panchayat Chlorination scheduled)",
    date: "13 Aug 2026",
  },
  {
    id: "ESC-02",
    issue: "Stagnant Water Drain Breeding Mosquitoes",
    location: "Ward 4, Backstreet Drain",
    priority: "CRITICAL",
    panchayatStatus: "Pending Action",
    date: "12 Aug 2026",
  },
];

export default function AshaDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoAshaWorker | null>(null);

  useEffect(() => {
    let current = getSession();
    if (!current || !isAshaWorker(current)) {
      setAshaSession();
      current = DEMO_ASHA_WORKER;
    }
    setSession(current as DemoAshaWorker);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (!session) return null;

  const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Baby, label: "Maternal & Child", badge: "4 Risk" },
    { icon: Activity, label: "Health Complaints", badge: "2 Active" },
    { icon: Syringe, label: "Immunization", active: false },
    { icon: MapPin, label: "Ward Health Map", active: false },
    { icon: ShieldAlert, label: "Epidemic Alerts", active: false },
  ];

  return (
    <div className="panchayat-shell">
      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <aside className="panchayat-sidebar">
        {/* Brand Header */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <HeartPulse style={{ width: 18, height: 18, color: "#ffffff" }} />
          </div>
          <div>
            <div className="sidebar-logo-name">Nivaaran AI</div>
            <div className="sidebar-logo-version">ASHA Portal · v1.0</div>
          </div>
        </div>

        {/* Navigation */}
        <p className="sidebar-section-label">ASHA Health Menu</p>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ icon: Icon, label, active, badge }) => (
            <div key={label} className={`sidebar-nav-item${active ? " active" : ""}`}>
              <Icon className="sidebar-nav-icon" />
              <span className="sidebar-nav-text">{label}</span>
              {badge && <span className="sidebar-nav-badge">{badge}</span>}
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
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
        {/* Top Header Bar */}
        <header className="panchayat-topbar">
          <div className="topbar-right">
            <button className="topbar-icon-btn" title="Messages">
              <MessageSquare style={{ width: 15, height: 15 }} />
            </button>
            <button className="topbar-icon-btn" title="2 Health Alerts">
              <Bell style={{ width: 15, height: 15 }} />
              <span className="topbar-notif-dot">2</span>
            </button>

            <div className="topbar-profile">
              <div className="topbar-avatar" style={{ background: "#059669" }}>
                SD
              </div>
              <div>
                <div className="topbar-profile-name">Sunita Devi (ASHA)</div>
                <div className="topbar-profile-role">PHC Ward 3 & 4</div>
              </div>
              <ChevronDown style={{ width: 12, height: 12, color: "#94a3b8", marginLeft: "0.25rem" }} />
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="panchayat-content">
          {/* Official Indian National Emblem Watermark */}
          <IndianNationalEmblem opacity={0.06} className="emblem-watermark" />

          {/* Background Ambient Orbs */}
          <div className="orb orb-1" style={{ opacity: 0.5 }} />
          <div className="orb orb-2" style={{ opacity: 0.4 }} />

          {/* Greeting Row */}
          <div className="greeting-row fade-up fade-up-1">
            <div>
              <h1 className="greeting-title" style={{ display: "inline-flex", alignItems: "center" }}>
                {getHour()}, Sunita Devi
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
                {session.village} · Primary Health Centre (PHC) Ward 3 & 4
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginLeft: "0.5rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "999px", padding: "0.15rem 0.5rem" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  ASHA LIVE
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="add-report-btn" onClick={() => alert("New Health Survey form opening...")}>
                <Plus style={{ width: 16, height: 16 }} />
                New Home Survey
              </button>
            </div>
          </div>

          {/* ── 3-COLUMN DASHBOARD GRID ──────────────────────────── */}
          <div className="dash-grid fade-up fade-up-2">
            
            {/* ── LEFT COLUMN ── */}
            <div className="dash-col-left">
              {/* Featured Stat Card */}
              <div className="featured-stat-card blue">
                <div>
                  <div className="featured-stat-label">
                    <Baby style={{ width: 14, height: 14 }} />
                    Maternal & Infant Care
                  </div>
                  <div className="featured-stat-value" style={{ marginTop: "0.5rem" }}>
                    38 <span>Mothers</span>
                  </div>
                  <div className="featured-stat-sub">
                    4 High Risk ANC Alerts · 100% ANC Checked
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "rgba(255,255,255,0.85)", marginBottom: "0.25rem", fontWeight: 600 }}>
                    <span>Target ANC Visits</span>
                    <span>38 / 38 (100%)</span>
                  </div>
                  <div className="featured-progress">
                    <div className="featured-progress-fill" style={{ width: "100%" }} />
                  </div>
                </div>
              </div>

              {/* 4 Mini Stat Cards */}
              <div className="mini-stat-row">
                <div className="mini-stat-card">
                  <div className="mini-stat-num">112</div>
                  <div className="mini-stat-lbl">Immunizations</div>
                </div>
                <div className="mini-stat-card">
                  <div className="mini-stat-num" style={{ color: "#d97706" }}>06</div>
                  <div className="mini-stat-lbl">Panchayat Sync</div>
                </div>
                <div className="mini-stat-card">
                  <div className="mini-stat-num" style={{ color: "#047857" }}>24</div>
                  <div className="mini-stat-lbl">Visits Done</div>
                </div>
                <div className="mini-stat-card">
                  <div className="mini-stat-num" style={{ color: "#dc2626" }}>04</div>
                  <div className="mini-stat-lbl">High Risk</div>
                </div>
              </div>

              {/* Weekly Family Visits Chart */}
              <div className="weekly-chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Weekly Family Visits</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Target: 30 Visits / Week</div>
                  </div>
                  <div className="chart-more-btn">
                    <MoreHorizontal style={{ width: 14, height: 14 }} />
                  </div>
                </div>

                <div className="bar-chart">
                  {[
                    { day: "M", val: 80, count: 5 },
                    { day: "T", val: 60, count: 4 },
                    { day: "W", val: 100, count: 6, today: true },
                    { day: "T", val: 70, count: 4 },
                    { day: "F", val: 50, count: 3 },
                    { day: "S", val: 30, count: 2 },
                    { day: "S", val: 0, count: 0, empty: true },
                  ].map((bar, idx) => (
                    <div key={idx} className="bar-chart-day">
                      <div
                        className={`bar-chart-bar ${bar.today ? "today" : bar.empty ? "empty" : "filled"}`}
                        style={{ height: `${bar.val}%` }}
                      />
                      <span className={`bar-chart-lbl ${bar.today ? "today" : ""}`}>{bar.day}</span>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "0.6rem", background: "#f8faf8", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TrendingUp style={{ width: 15, height: 15, color: "#047857", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.72rem", color: "#042d20", fontWeight: 600 }}>
                    80% of weekly home visit quota completed (24/30).
                  </span>
                </div>
              </div>

              {/* PHC Center Sync Status */}
              <div className="glass-card">
                <div className="glass-card-title" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Stethoscope style={{ width: 15, height: 15, color: "#047857" }} />
                  PHC Sync Status
                </div>
                <p style={{ fontSize: "0.72rem", color: "#64748b", margin: "0.25rem 0 0.75rem" }}>
                  Demo Primary Health Centre (PHC)
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", padding: "0.4rem 0.6rem", background: "#f8faf8", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#334155", fontWeight: 600 }}>Medicine Stock</span>
                    <span style={{ color: "#047857", fontWeight: 800 }}>Sufficient</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", padding: "0.4rem 0.6rem", background: "#f8faf8", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#334155", fontWeight: 600 }}>Next Vaccine Drive</span>
                    <span style={{ color: "#2563eb", fontWeight: 800 }}>18th Aug</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CENTER COLUMN ── */}
            <div className="dash-col-center">
              {/* Nivaaran AI Epidemic Early Warning Banner */}
              <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fde68a", borderRadius: "18px", padding: "1.25rem", position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "10px", background: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                    <ShieldAlert style={{ width: 20, height: 20, margin: "auto" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "#92400e", marginBottom: "0.25rem" }}>
                      Nivaaran AI Outbreak Alert: Ward 3 Water Contamination Risk
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#78350f", lineHeight: "1.4" }}>
                      Detected 4 cases of fever & acute diarrhea near <strong>Handpump #2 (Ward 3)</strong>. High probability of drinking water contamination. Gram Panchayat notified for immediate water testing & chlorination.
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <button onClick={() => alert("Urgent escalation sent to Gram Panchayat Sarpanch & Sanitation Secretary.")} style={{ background: "#d97706", color: "white", border: "none", borderRadius: "8px", padding: "0.4rem 0.875rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <AlertTriangle style={{ width: 14, height: 14 }} />
                        Re-Escalate to Gram Panchayat
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Health Registry & House Visit Tracker */}
              <div className="complaints-card">
                <div className="complaints-card-header">
                  <div>
                    <div className="complaints-card-title">ASHA Patient & Home Visit Registry</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Ward 3 & 4 Active Beneficiaries</div>
                  </div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "999px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                    4 Active
                  </span>
                </div>

                {/* Patient Visit Items */}
                <div>
                  {PATIENT_VISITS.map((visit) => (
                    <div key={visit.id} className="complaint-item" style={{ padding: "1rem 1.25rem" }}>
                      <div className="complaint-avatar" style={{ background: visit.risk === "urgent" ? "#ef4444" : visit.risk === "high" ? "#f59e0b" : "#059669" }}>
                        {visit.id.split("-")[1]}
                      </div>
                      <div className="complaint-info">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div className="complaint-title">{visit.name}</div>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "999px", background: visit.risk === "urgent" ? "#fef2f2" : visit.risk === "high" ? "#fffbeb" : "#ecfdf5", color: visit.risk === "urgent" ? "#dc2626" : visit.risk === "high" ? "#d97706" : "#047857", border: `1px solid ${visit.risk === "urgent" ? "#fca5a5" : visit.risk === "high" ? "#fde68a" : "#a7f3d0"}` }}>
                            {visit.ward} · {visit.risk.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", margin: "0.15rem 0" }}>{visit.type}</div>
                        <div style={{ fontSize: "0.72rem", color: "#042d20", fontWeight: 600 }}>{visit.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immunization & ANC Schedule */}
              <div className="ai-pill-card">
                <div className="ai-pill-header">
                  <div className="ai-pill-title" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Calendar style={{ width: 15, height: 15, color: "#047857" }} />
                    Upcoming Vaccine Drives & Anganwadi Sync
                  </div>
                  <div className="ai-pill-sub">Scheduled drives for Ward 3 & 4</div>
                </div>

                <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.875rem", background: "#f8faf8", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <Syringe style={{ width: 16, height: 16, color: "#2563eb" }} />
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>Pulse Polio Drive 2026</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Booth: Ward 3 Primary School</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2563eb" }}>18 Aug 2026</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.875rem", background: "#f8faf8", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <Baby style={{ width: 16, height: 16, color: "#047857" }} />
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>Pregnant Women ANC Health Checkup</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Anganwadi Center Ward 4</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#047857" }}>22 Aug 2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="dash-col-right">
              {/* Gram Panchayat Health & Sanitation Sync */}
              <div className="alerts-card">
                <div className="complaints-card-header">
                  <div className="complaints-card-title" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Droplets style={{ width: 15, height: 15, color: "#0284c7" }} />
                    Gram Panchayat Health Sync
                  </div>
                </div>

                <div style={{ padding: "0.875rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {HEALTH_ESCALATIONS.map((esc) => (
                    <div key={esc.id} style={{ padding: "0.75rem", background: "#f8faf8", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#dc2626", background: "#fef2f2", padding: "0.15rem 0.4rem", borderRadius: "4px", border: "1px solid #fca5a5" }}>
                          {esc.priority}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{esc.date}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.2rem" }}>
                        {esc.issue}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.4rem" }}>
                        {esc.location}
                      </div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#047857" }}>
                        Status: {esc.panchayatStatus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vaccine Stock Status Card */}
              <div className="glass-card">
                <div className="glass-card-title" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Syringe style={{ width: 15, height: 15, color: "#16a34a" }} />
                  Vaccine Kit Inventory
                </div>
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#334155", fontWeight: 600, marginBottom: "0.2rem" }}>
                      <span>OPV (Oral Polio Vaccine)</span>
                      <span style={{ color: "#047857", fontWeight: 800 }}>45 Vials</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ width: "90%", height: "100%", background: "#059669" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#334155", fontWeight: 600, marginBottom: "0.2rem" }}>
                      <span>Pentavalent & DPT</span>
                      <span style={{ color: "#047857", fontWeight: 800 }}>28 Vials</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ width: "70%", height: "100%", background: "#2563eb" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#334155", fontWeight: 600, marginBottom: "0.2rem" }}>
                      <span>Iron & Folic Acid Tablets</span>
                      <span style={{ color: "#d97706", fontWeight: 800 }}>200 Tabs</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ width: "50%", height: "100%", background: "#d97706" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Healthcare Contacts */}
              <div className="glass-card" style={{ background: "#f0fdf4", borderColor: "#a7f3d0" }}>
                <div className="glass-card-title" style={{ color: "#042d20", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <HeartPulse style={{ width: 15, height: 15, color: "#047857" }} />
                  ASHA Emergency Helpline
                </div>
                <div style={{ fontSize: "0.72rem", color: "#334155", marginTop: "0.375rem", lineHeight: "1.4" }}>
                  108 Emergency Ambulance · PHC Medical Officer on-call
                </div>
                <button
                  onClick={() => alert("Connecting to 108 Emergency Rural Healthcare Ambulance Dispatch...")}
                  style={{ width: "100%", marginTop: "0.75rem", background: "#064e3b", color: "#ffffff", border: "none", borderRadius: "10px", padding: "0.5rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
                >
                  Call 108 Ambulance Dispatch
                </button>
              </div>
            </div>
          </div>

          {/* ── BOTTOM TIMELINE CARD ──────────────────────────── */}
          <div className="timeline-card fade-up fade-up-3" style={{ marginTop: "1.25rem" }}>
            <div className="chart-header" style={{ marginBottom: "0.875rem" }}>
              <div>
                <div className="chart-title" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Clock style={{ width: 15, height: 15, color: "#047857" }} />
                  ASHA Daily Visit Timeline · Ward 3 & 4
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                  Today: 4 ANC & PNC Home Visits Completed
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.7rem", color: "#047857", fontWeight: 700 }}>
                  August 13, 2026
                </span>
              </div>
            </div>

            {/* Timeline Ruler */}
            <div className="timeline-ruler-wrap">
              <div className="timeline-hours">
                {["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"].map((h) => (
                  <span key={h} className="timeline-hour">{h}</span>
                ))}
              </div>
              <div className="timeline-ruler">
                <div className="timeline-now-line" style={{ left: "62%" }} />
              </div>
            </div>

            {/* Timeline Chips */}
            <div className="timeline-chips">
              <div className="timeline-chip resolved" style={{ left: "10%" }}>
                <div className="timeline-chip-icon" style={{ background: "#dcfce7", color: "#15803d" }}>
                  <CheckCircle2 style={{ width: 11, height: 11 }} />
                </div>
                <span>08:45 AM · Ward 3 Fever Cluster Inspection</span>
              </div>

              <div className="timeline-chip in_progress" style={{ left: "38%" }}>
                <div className="timeline-chip-icon" style={{ background: "#ecfdf5", color: "#047857" }}>
                  <Baby style={{ width: 11, height: 11 }} />
                </div>
                <span>10:30 AM · ANC Checkup (Lakshmi N.)</span>
              </div>

              <div className="timeline-chip pending" style={{ left: "68%" }}>
                <div className="timeline-chip-icon" style={{ background: "#fffbeb", color: "#d97706" }}>
                  <Syringe style={{ width: 11, height: 11 }} />
                </div>
                <span>03:30 PM · Ward 4 Infant Polio Vaccination</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
