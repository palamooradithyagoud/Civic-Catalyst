"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isVillager,
  isPanchayatOfficial,
  clearSession,
  setPanchayatSession,
  DEMO_PANCHAYAT,
} from "@/services/demoSession";
import type { DemoPanchayat } from "@/types";
import { CivicLogo } from "@/components/CivicLogo";
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
  ShieldCheck,
  RefreshCw,
  Loader2,
  Sparkles,
  PieChart,
  Download,
  Filter,
  Users,
  Navigation,
  X,
  Flame,
} from "lucide-react";
import {
  fetchComplaintsApi,
  fetchComplaintKPIsApi,
  updateComplaintStatusApi,
  overrideComplaintPriorityApi,
  fetchPriorityAnalyticsApi,
  formatSla,
  type Complaint,
  type ComplaintKPIs,
  type PriorityAnalytics,
} from "@/services/complaintsApi";
import { LanguageSelector } from "@/components/LanguageSelector";

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
  { icon: Cpu, label: "Smart Classification", desc: "AI tags by type, urgency and dept.", badge: "Live", badgeColor: "#047857", badgeBg: "#dcfce7", iconColor: "#047857", iconBg: "#ecfdf5" },
  { icon: AlertTriangle, label: "Priority Routing", desc: "Auto-escalation for critical issues.", badge: "Live", badgeColor: "#047857", badgeBg: "#dcfce7", iconColor: "#d97706", iconBg: "#fffbeb" },
  { icon: TrendingUp, label: "Analytics", desc: "Resolution trends and heatmaps.", badge: "Live", badgeColor: "#7c3aed", badgeBg: "#f3e8ff", iconColor: "#7c3aed", iconBg: "#f3e8ff" },
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",   id: "dashboard",   badge: null },
  { icon: ClipboardList,  label: "Complaints",   id: "complaints",  badge: "Live" },
  { icon: BarChart3,      label: "Analytics",    id: "analytics",   badge: null },
  { icon: FileText,       label: "Reports",      id: "reports",     badge: null },
  { icon: AlertTriangle,  label: "Escalations",  id: "escalations", badge: null },
];

const CATEGORIES = ["Roads & Infrastructure", "Water Supply", "Sanitation", "Electricity", "Health & Other"];
const WARDS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Main Road"];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function getHour() {
  const h = TODAY.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── shared style helpers ──────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8f5e9",
  borderRadius: 16,
  padding: "1.25rem",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  marginBottom: "1.25rem",
};
const PAGE_HEADER: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginBottom: "1.5rem",
};
const H1: React.CSSProperties = { fontSize: "1.45rem", fontWeight: 900, color: "#042d20", margin: 0, display: "flex", alignItems: "center", gap: 10 };
const SUB: React.CSSProperties = { fontSize: "0.8rem", color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 6 };
const LIVE_BADGE = (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", fontWeight: 700, color: "#34d399", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 999, padding: "0.15rem 0.5rem" }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
    Live Cloud DB
  </span>
);

export default function PanchayatDashboard() {
  const router = useRouter();
  const [session, setSession]   = useState<DemoPanchayat | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [kpis, setKpis] = useState<ComplaintKPIs>({ total: 0, pending: 0, in_progress: 0, resolved: 0, high_urgency: 0, resolution_rate: "0%", category_breakdown: {} });
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery]   = useState<string>("");

  // AI Civic Priority Intelligence & Human Override State
  const [priorityAnalytics, setPriorityAnalytics] = useState<PriorityAnalytics | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetComplaint, setTargetComplaint] = useState<Complaint | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(75);
  const [overrideTier, setOverrideTier] = useState<string>("HIGH");
  const [overrideDept, setOverrideDept] = useState<string>("Roads & Infrastructure Department");
  const [overrideSla, setOverrideSla] = useState<number>(24);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [expandedComplaintIds, setExpandedComplaintIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let s = getSession();
    if (!s || !isPanchayatOfficial(s)) {
      setPanchayatSession();
      s = DEMO_PANCHAYAT;
    }
    setSession(s as DemoPanchayat);
    setLoading(false);
    loadAllComplaints();
  }, []);

  const loadAllComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const [list, stats, analytics] = await Promise.all([
        fetchComplaintsApi(),
        fetchComplaintKPIsApi(),
        fetchPriorityAnalyticsApi().catch(() => null),
      ]);
      setComplaints(list);
      setKpis(stats);
      if (analytics) setPriorityAnalytics(analytics);
    } catch (err) {
      console.warn("Failed to load complaints", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const toggleExpandComplaint = (id: string) => {
    setExpandedComplaintIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenOverrideModal = (complaint: Complaint) => {
    setTargetComplaint(complaint);
    setOverrideScore(complaint.priority_score || 50);
    setOverrideTier(complaint.priority_tier || "HIGH");
    setOverrideDept(complaint.recommended_department || "General Panchayat Administration");
    setOverrideSla(complaint.recommended_sla_hours || 24);
    setOverrideReason("");
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!targetComplaint || !overrideReason.trim()) return;
    setSubmittingOverride(true);
    try {
      const updated = await overrideComplaintPriorityApi(targetComplaint.id, {
        priority_score: overrideScore,
        priority_tier: overrideTier,
        recommended_department: overrideDept,
        recommended_sla_hours: overrideSla,
        override_reason: overrideReason,
        official_name: session?.name || "Panchayat Secretary",
      });
      if (updated) {
        setComplaints(prev => prev.map(c => c.id === targetComplaint.id ? updated : c));
        const [stats, analytics] = await Promise.all([
          fetchComplaintKPIsApi(),
          fetchPriorityAnalyticsApi().catch(() => null),
        ]);
        setKpis(stats);
        if (analytics) setPriorityAnalytics(analytics);
        setOverrideModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save override", err);
    } finally {
      setSubmittingOverride(false);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: "pending" | "in_progress" | "resolved") => {
    setUpdatingId(complaintId);
    try {
      const updated = await updateComplaintStatusApi(complaintId, newStatus);
      if (updated) {
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
        const stats = await fetchComplaintKPIsApi();
        setKpis(stats);
      }
    } catch (err) { console.error("Failed to update status", err); }
    finally { setUpdatingId(null); }
  };

  const handleLogout = () => { clearSession(); router.push("/"); };

  const renderAiPriorityCard = (c: Complaint) => {
    const descText = ((c.title || "") + " " + (c.description || "") + " " + (c.category || "")).toLowerCase();
    const isFireOrShock = /(fire|flame|smoke|blaze|burn|explosion|shock|current|electrocution|live wire|spark|short circuit)/.test(descText) || (c.recommended_sla_hours !== undefined && c.recommended_sla_hours <= 0.5);

    const pScore = c.priority_score ?? (isFireOrShock ? 100 : 50);
    const pTier = (c.priority_tier || (isFireOrShock ? "CRITICAL" : pScore >= 75 ? "CRITICAL" : pScore >= 50 ? "HIGH" : pScore >= 25 ? "MEDIUM" : "LOW")).toUpperCase();
    const isExpanded = expandedComplaintIds.has(c.id);

    let badgeColor = "#16a34a";
    let badgeBg = "#f0fdf4";
    let badgeBorder = "#bbf7d0";
    let icon = "🟢";

    if (pTier === "CRITICAL") {
      badgeColor = "#dc2626";
      badgeBg = "#fef2f2";
      badgeBorder = "#fecaca";
      icon = "🔴";
    } else if (pTier === "HIGH") {
      badgeColor = "#ea580c";
      badgeBg = "#fff7ed";
      badgeBorder = "#ffedd5";
      icon = "🟠";
    } else if (pTier === "MEDIUM") {
      badgeColor = "#d97706";
      badgeBg = "#fffbeb";
      badgeBorder = "#fef3c7";
      icon = "🟡";
    }

    const factors = c.priority_factors || {
      visual_severity_score: isFireOrShock ? 25 : 14, visual_severity_max: 25,
      safety_risk_score: isFireOrShock ? 20 : 12, safety_risk_max: 20,
      population_impact_score: 10, population_impact_max: 20,
      essential_service_score: 8, essential_service_max: 15,
      historical_recurrence_score: 6, historical_recurrence_max: 10,
      freshness_escalation_score: 8, freshness_escalation_max: 10,
    };

    const bullets = c.explanation_bullets && c.explanation_bullets.length > 0 ? c.explanation_bullets : [
      isFireOrShock
        ? "🚨 CRITICAL EMERGENCY: 30-Minute Rapid Action SLA assigned for rapid containment"
        : `${pTier} priority issue evaluated by policy engine`,
      "Assigned based on visual evidence & location context"
    ];

    return (
      <div key={c.id} style={{ padding: "1.1rem 1.25rem", borderBottom: "1px solid #f1f5f9", background: isFireOrShock ? "#fffbfb" : c.human_priority_override ? "#faf5ff" : c.possible_duplicate ? "#fffbf0" : "#ffffff", borderLeft: isFireOrShock ? "4px solid #dc2626" : undefined, transition: "background 0.2s" }}>
        {isFireOrShock && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.74rem", fontWeight: 800, marginBottom: "0.6rem" }}>
            <Flame size={14} style={{ color: "#dc2626" }} />
            <span>🚨 ACTIVE LIFE SAFETY EMERGENCY: Immediate 30-Minute Rapid Dispatch required for this incident!</span>
          </div>
        )}

        {c.possible_duplicate && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", borderRadius: 8, background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", fontSize: "0.74rem", fontWeight: 700, marginBottom: "0.6rem" }}>
            <AlertTriangle size={14} style={{ color: "#d97706" }} />
            <span>⚠️ Duplicate Warning: Similar complaint active ({c.related_complaint_id || "Active Issue"} · Similarity: {Math.round((c.duplicate_confidence || 0.82) * 100)}%)</span>
          </div>
        )}

        {c.human_priority_override && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", borderRadius: 8, background: "#f3e8ff", border: "1px solid #e9d5ff", color: "#6b21a8", fontSize: "0.74rem", fontWeight: 700, marginBottom: "0.6rem" }}>
            <ShieldCheck size={14} style={{ color: "#7c3aed" }} />
            <span>Panchayat Human Override: Priority set to {pTier} ({pScore}/100) by {c.human_override_by || "Official"}. Reason: &quot;{c.human_override_reason || "Verified on site"}&quot;</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
          {c.imageUrl ? (
            <img src={c.imageUrl} alt={c.title} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: isFireOrShock ? "2px solid #dc2626" : `2px solid ${badgeBorder}` }} />
          ) : (
            <div style={{ background: isFireOrShock ? "#dc2626" : c.avatarBg || "#064e3b", flexShrink: 0, width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "0.85rem" }}>
              {isFireOrShock ? "🚨" : getInitials(c.villager_name || "Citizen")}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>{c.title}</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 900, color: badgeColor, background: badgeBg, border: `1px solid ${badgeBorder}`, padding: "0.15rem 0.5rem", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <span>{icon}</span> {pTier} · {pScore}/100
              </span>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: isFireOrShock ? "#b91c1c" : "#0284c7", background: isFireOrShock ? "#fee2e2" : "#f0f9ff", border: `1px solid ${isFireOrShock ? "#fca5a5" : "#bae6fd"}`, padding: "0.15rem 0.5rem", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                <Clock size={11} /> SLA: {formatSla(c.recommended_sla_hours)}
              </span>
              {isFireOrShock && (
                <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "#ffffff", background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)", padding: "0.15rem 0.55rem", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 3, boxShadow: "0 2px 6px rgba(220,38,38,0.25)" }}>
                  ⚡ RAPID ACTION
                </span>
              )}
              <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600 }}>{c.complaint_id_code || c.id}</span>
            </div>

            {c.description && <div style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.45, marginBottom: "0.4rem" }}>{c.description}</div>}

            <div style={{ fontSize: "0.74rem", color: "#64748b", display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
              <span>👤 <strong style={{ color: "#0f172a" }}>{c.villager_name}</strong></span>
              <span>📍 {c.location}</span>
              <span style={{ color: "#059669", fontWeight: 700 }}>🏢 {c.recommended_department || c.category}</span>
              <span>🕐 {c.date}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
            <select value={c.status} disabled={updatingId === c.id} onChange={e => handleUpdateStatus(c.id, e.target.value as any)} style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.3rem 0.55rem", borderRadius: 8, border: "1px solid #cbd5e1", background: c.status === "resolved" ? "#dcfce7" : c.status === "in_progress" ? "#eff6ff" : "#fffbeb", color: c.status === "resolved" ? "#166534" : c.status === "in_progress" ? "#1e40af" : "#92400e", cursor: "pointer", outline: "none" }}>
              <option value="pending">⏳ Pending</option>
              <option value="in_progress">⚙️ In Progress</option>
              <option value="resolved">✅ Resolved</option>
            </select>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button onClick={() => toggleExpandComplaint(c.id)} style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.25rem 0.5rem", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Cpu size={12} style={{ color: "#7c3aed" }} /> {isExpanded ? "Hide Details" : "AI Score Breakdown"}
              </button>
              <button onClick={() => handleOpenOverrideModal(c)} style={{ fontSize: "0.68rem", fontWeight: 800, padding: "0.25rem 0.55rem", borderRadius: 6, border: "1px solid #c084fc", background: "#faf5ff", color: "#7e22ce", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Shield size={12} /> Override
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0", background: "#f8fafc", borderRadius: 10, padding: "0.85rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#042d20", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Sparkles size={14} style={{ color: "#7c3aed" }} /> Policy Engine Scoring Factors &amp; SLA Breakdown
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.6rem", marginBottom: "0.75rem" }}>
              {[
                { label: "Visual Severity", val: factors.visual_severity_score, max: factors.visual_severity_max || 25, color: "#dc2626" },
                { label: "Safety Hazard", val: factors.safety_risk_score, max: factors.safety_risk_max || 20, color: "#ea580c" },
                { label: "Population Impact", val: factors.population_impact_score, max: factors.population_impact_max || 20, color: "#2563eb" },
                { label: "Essential Service", val: factors.essential_service_score, max: factors.essential_service_max || 15, color: "#0284c7" },
                { label: "History Recurrence", val: factors.historical_recurrence_score, max: factors.historical_recurrence_max || 10, color: "#7c3aed" },
              ].map(f => (
                <div key={f.label} style={{ background: "#ffffff", padding: "0.45rem 0.6rem", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", fontWeight: 700, color: "#475569", marginBottom: 3 }}>
                    <span>{f.label}</span>
                    <span style={{ color: f.color }}>{f.val}/{f.max}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "#f1f5f9" }}>
                    <div style={{ height: "100%", borderRadius: 2, width: `${(f.val / f.max) * 100}%`, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.3rem" }}>Why this priority?</div>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.72rem", color: "#475569", lineHeight: 1.5 }}>
              {bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const weekDates = getWeekDates();
  const displayName = session.name.replace("Demo Gram Panchayat", "").trim() || session.name;

  // ── derived data ──────────────────────────────────────────────────────────
  const filteredComplaints = statusFilter === "ALL" ? complaints : complaints.filter(c => c.status === statusFilter);
  const visibleComplaints  = (() => {
    const sq = searchQuery.toLowerCase();
    return filteredComplaints.filter(c => {
      if (!sq) return true;
      return (c.title || "").toLowerCase().includes(sq) ||
             (c.description || "").toLowerCase().includes(sq) ||
             (c.location || "").toLowerCase().includes(sq) ||
             (c.villager_name || "").toLowerCase().includes(sq) ||
             (c.category || "").toLowerCase().includes(sq);
    });
  })();

  const categoryStats = CATEGORIES.map(cat => {
    const total    = complaints.filter(c => c.category === cat || (cat.includes("Roads") && c.category.includes("Road"))).length;
    const resolved = complaints.filter(c => (c.category === cat || (cat.includes("Roads") && c.category.includes("Road"))) && c.status === "resolved").length;
    const pct      = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const color    = cat.includes("Road") ? "#2563eb" : cat.includes("Water") ? "#0284c7" : cat.includes("Sanitation") ? "#16a34a" : cat.includes("Electric") ? "#d97706" : "#7c3aed";
    return { label: cat.replace(" & Infrastructure", ""), pct, color, total, resolved };
  });

  const wardStats = WARDS.map(ward => {
    const total    = complaints.filter(c => (c.location || "").includes(ward) || (c.village || "").includes(ward)).length;
    const resolved = complaints.filter(c => ((c.location || "").includes(ward) || (c.village || "").includes(ward)) && c.status === "resolved").length;
    return { ward, total, resolved, pending: total - resolved };
  });

  const escalations = complaints.filter(c => c.urgency === "High" && c.status !== "resolved");
  const dynamicBarData = weekDates.map(wd => {
    const dayC = complaints.filter(c => { try { return new Date(c.created_at || Date.now()).getDate() === wd.num; } catch { return false; } });
    const pct = dayC.length > 0 ? Math.round((dayC.filter(c => c.status === "resolved").length / dayC.length) * 100) : 0;
    return { day: wd.name.slice(0, 2), h: Math.max(pct, dayC.length > 0 ? 30 : 0), today: wd.isToday, count: dayC.length };
  });

  // ── SIDEBAR SHELL ─────────────────────────────────────────────────────────
  return (
    <div className="panchayat-shell">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className="panchayat-sidebar">
        <div className="sidebar-logo">
          <CivicLogo size="sm" />
          <div>
            <div className="sidebar-logo-name">Civic Catalyst</div>
            <div className="sidebar-logo-version">Panchayat Portal · v1.0</div>
          </div>
        </div>

        <p className="sidebar-section-label">Main Menu</p>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ icon: Icon, label, id, badge }) => (
            <button
              key={id}
              className={`sidebar-nav-item${activeTab === id ? " active" : ""}`}
              style={{ width: "100%", textAlign: "left", background: "transparent", cursor: "pointer" }}
              onClick={() => { setActiveTab(id); if (id === "complaints" || id === "escalations") loadAllComplaints(); }}
            >
              <Icon className="sidebar-nav-icon" />
              <span className="sidebar-nav-text">{label}</span>
              {badge && <span className="sidebar-nav-badge">{badge}</span>}
              {id === "complaints" && complaints.length > 0 && (
                <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: "50%", background: "#047857", color: "#fff", fontSize: "0.6rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {complaints.length}
                </span>
              )}
              {id === "escalations" && escalations.length > 0 && (
                <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: "50%", background: "#dc2626", color: "#fff", fontSize: "0.6rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {escalations.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="sidebar-bottom-item"><Settings style={{ width: 16, height: 16 }} /><span className="sidebar-nav-text">Settings</span></button>
          <button className="sidebar-bottom-item"><HelpCircle style={{ width: 16, height: 16 }} /><span className="sidebar-nav-text">Support</span></button>
          <button className="sidebar-bottom-item danger" onClick={handleLogout}><LogOut style={{ width: 16, height: 16 }} /><span className="sidebar-nav-text">Log out</span></button>
        </div>
      </aside>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="panchayat-body">

        {/* Top bar */}
        <header className="panchayat-topbar">
          <div className="topbar-search">
            <Search style={{ width: 14, height: 14, color: "rgba(148,163,184,0.6)" }} />
            <input type="text" placeholder="Search complaints, citizens or locations..." className="topbar-search-input" />
          </div>
          <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Language Selector Dropdown (Google Translation) */}
            <LanguageSelector />

            <button onClick={loadAllComplaints} disabled={loadingComplaints} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "0.4rem 0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "#047857", cursor: "pointer" }}>
              <RefreshCw size={13} className={loadingComplaints ? "animate-spin" : ""} />
              {loadingComplaints ? "Syncing..." : "Sync DB"}
            </button>
            <button className="topbar-icon-btn"><MessageSquare style={{ width: 15, height: 15 }} /></button>
            <button className="topbar-icon-btn">
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

        {/* ── CONTENT AREA ───────────────────────────────────────────────── */}
        <div className="panchayat-content">

          {/* ════════════════ DASHBOARD ════════════════ */}
          {activeTab === "dashboard" && <>
            <IndianNationalEmblem opacity={0.045} className="emblem-watermark" />
            <div className="orb orb-1" style={{ opacity: 0.5 }} />
            <div className="orb orb-2" style={{ opacity: 0.4 }} />

            <div className="greeting-row fade-up fade-up-1">
              <div>
                <h1 className="greeting-title" style={{ display: "inline-flex", alignItems: "center" }}>
                  {getHour()}, {displayName.split(" ")[0]}
                  <div className="weather-widget-box" title="Live Weather">
                    <div className="container"><div className="sun sunshine" /><div className="sun" /><div className="cloud back"><span className="left-back" /><span className="right-back" /></div><div className="cloud front"><span className="left-front" /><span className="right-front" /></div></div>
                  </div>
                </h1>
                <div className="greeting-sub">
                  <MapPin style={{ width: 13, height: 13 }} />
                  {session.village} · Gram Panchayat Dashboard
                  {LIVE_BADGE}
                </div>
              </div>
              <button className="add-report-btn" onClick={loadAllComplaints}>
                <RefreshCw style={{ width: 15, height: 15 }} className={loadingComplaints ? "animate-spin" : ""} />
                Refresh Complaints
              </button>
            </div>

            {/* Active Emergency Alert Banner for Fire / Electric Shock */}
            {(() => {
              const emergencyComplaints = complaints.filter(c => {
                if (c.status === "resolved") return false;
                const descText = ((c.title || "") + " " + (c.description || "") + " " + (c.category || "")).toLowerCase();
                return /(fire|flame|smoke|blaze|burn|explosion|shock|current|electrocution|live wire|spark|short circuit)/.test(descText) || (c.recommended_sla_hours !== undefined && c.recommended_sla_hours <= 0.5);
              });

              if (emergencyComplaints.length === 0) return null;

              return (
                <div style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)", color: "#ffffff", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", boxShadow: "0 6px 20px rgba(220,38,38,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Flame size={24} style={{ color: "#fef08a" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        🚨 {emergencyComplaints.length} ACTIVE RAPID DISPATCH EMERGENCY {emergencyComplaints.length === 1 ? "INCIDENT" : "INCIDENTS"}
                        <span style={{ fontSize: "0.7rem", background: "#fef08a", color: "#854d0e", fontWeight: 900, padding: "0.15rem 0.5rem", borderRadius: 999 }}>
                          SLA: 30 Mins Rapid Action
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", opacity: 0.95, marginTop: 2 }}>
                        Immediate containment required: {emergencyComplaints.map(e => e.title).join(" · ")}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("complaints")}
                    style={{ background: "#ffffff", color: "#991b1b", border: "none", padding: "0.5rem 1rem", borderRadius: 8, fontWeight: 900, fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    View Incidents <ChevronRight size={14} />
                  </button>
                </div>
              );
            })()}

            <div className="dash-grid">
              {/* LEFT */}
              <div className="dash-col-left fade-up fade-up-2">
                <div className="featured-stat-card blue">
                  <div className="featured-stat-label"><ClipboardList style={{ width: 12, height: 12 }} />Active / Pending Issues<span style={{ marginLeft: "auto", fontWeight: 500, opacity: 0.7, textTransform: "none", letterSpacing: 0, fontSize: "0.7rem" }}>···</span></div>
                  <div>
                    <div className="featured-stat-value">{kpis.pending} <span>/ {kpis.total} total registered</span></div>
                    <div className="featured-stat-sub">{kpis.high_urgency > 0 ? `⚠️ ${kpis.high_urgency} High-Urgency complaints requiring action` : "All critical complaints addressed"}</div>
                  </div>
                  <div className="featured-progress"><div className="featured-progress-fill" style={{ width: kpis.total > 0 ? `${(kpis.resolved / kpis.total) * 100}%` : "0%" }} /></div>
                </div>

                <div className="mini-stat-row">
                  {[{ num: kpis.total, lbl: "Total", color: "#0f172a" }, { num: kpis.pending, lbl: "Pending", color: "#d97706" }, { num: kpis.in_progress, lbl: "Active", color: "#2563eb" }, { num: kpis.resolved, lbl: "Resolved", color: "#16a34a" }].map(({ num, lbl, color }) => (
                    <div key={lbl} className="mini-stat-card"><div className="mini-stat-num" style={{ color }}>{num}</div><div className="mini-stat-lbl">{lbl}</div></div>
                  ))}
                </div>

                <div className="weekly-chart-card">
                  <div className="chart-header"><span className="chart-title">Resolution Performance</span><button className="chart-more-btn"><MoreHorizontal style={{ width: 14, height: 14 }} /></button></div>
                  <div className="bar-chart">
                    {dynamicBarData.map(({ day, h, today }) => (
                      <div key={day} className="bar-chart-day">
                        <div className={`bar-chart-bar ${h === 0 ? "empty" : today ? "today" : "filled"}`} style={{ height: h === 0 ? "30%" : `${h}%` }} />
                        <span className={`bar-chart-lbl${today ? " today" : ""}`}>{day}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: "10px", background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                    <Zap style={{ width: 13, height: 13, color: "#047857" }} />
                    <span style={{ fontSize: "0.75rem", color: "#042d20", fontWeight: 700 }}>AI Vision &amp; Auto-Routing Active</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "#059669", fontWeight: 600 }}>live</span>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: "1.125rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#042d20" }}>System Status</span>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block", boxShadow: "0 0 8px rgba(22,163,74,0.6)" }} />
                  </div>
                  {[{ label: "AI Vision Classification" }, { label: "Complaint Auto-Routing" }, { label: "Supabase Real-Time DB" }, { label: "Live GPS Tracking" }].map(({ label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "0.78rem", color: "#334155", fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", borderRadius: "999px", padding: "0.15rem 0.5rem" }}>Operational</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CENTER */}
              <div className="dash-col-center fade-up fade-up-3">
                <div className="complaints-card">
                  <div className="complaints-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <span className="complaints-card-title">Live Citizen Complaints ({filteredComplaints.length})</span>
                      <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "0.15rem" }}>Real-time issues submitted by villagers</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {["ALL", "pending", "in_progress", "resolved"].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: 6, border: statusFilter === s ? "1px solid #047857" : "1px solid #e2e8f0", background: statusFilter === s ? "#047857" : "#ffffff", color: statusFilter === s ? "#ffffff" : "#475569", cursor: "pointer", textTransform: "capitalize" }}>
                          {s === "ALL" ? "All" : s === "in_progress" ? "In Progress" : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="week-strip">
                    {weekDates.map(({ name, num, isToday }) => (
                      <div key={name} className="week-day"><span className="week-day-name">{name}</span><span className={`week-day-num${isToday ? " today" : ""}`}>{num}</span></div>
                    ))}
                  </div>

                  {loadingComplaints && complaints.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem", color: "#047857" }} /><div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Connecting to Supabase...</div></div>
                  ) : filteredComplaints.length === 0 ? (
                    <div style={{ padding: "2.5rem 1rem", textAlign: "center" }}><CheckCircle2 size={32} style={{ margin: "0 auto 0.5rem", color: "#16a34a" }} /><div style={{ fontWeight: 800 }}>No complaints in this view!</div></div>
                  ) : filteredComplaints.map(c => renderAiPriorityCard(c))}
                </div>

                <div className="ai-pill-card">
                  <div className="ai-pill-header"><div className="ai-pill-title">AI-Powered Civic Automation</div><div className="ai-pill-sub">Real-time vision classification and intelligent grievance routing</div></div>
                  {AI_CAPABILITIES.map(({ icon: Icon, label, desc, badge, badgeColor, badgeBg, iconColor, iconBg }) => (
                    <div key={label} className="feature-item" style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid #f1f5f9" }}>
                      <div className="feature-icon-wrap" style={{ background: iconBg, borderColor: "transparent" }}><Icon style={{ width: 15, height: 15, color: iconColor }} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}><p className="feature-label">{label}</p><p className="feature-desc">{desc}</p></div>
                      <span className="feature-badge" style={{ background: badgeBg, border: "1px solid transparent", color: badgeColor }}>{badge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT */}
              <div className="dash-col-right fade-up fade-up-4">
                <div className="alerts-card">
                  <div className="alerts-header"><span className="alerts-title">Urgent Action Alerts</span><span style={{ fontSize: "0.72rem", background: "#fef2f2", color: "#dc2626", padding: "0.15rem 0.5rem", borderRadius: 999, fontWeight: 700 }}>{escalations.length} High Priority</span></div>
                  {complaints.filter(c => c.status !== "resolved").slice(0, 4).map((c, idx) => (
                    <div key={c.id || idx} className="alert-item" style={{ padding: "0.85rem 1.1rem" }}>
                      <div className={`alert-dot ${c.urgency === "High" ? "red" : "yellow"}`}>
                        {c.category.includes("Water") ? <Droplets style={{ width: 14, height: 14, color: "#dc2626" }} /> : c.category.includes("Sanitation") ? <Trash2 style={{ width: 14, height: 14, color: "#d97706" }} /> : <AlertCircle style={{ width: 14, height: 14, color: "#dc2626" }} />}
                      </div>
                      <div className="alert-info"><div className="alert-name" style={{ fontSize: "0.82rem", fontWeight: 800 }}>{c.title}</div><div className="alert-desc" style={{ fontSize: "0.72rem" }}>📍 {c.location} · {c.date}</div></div>
                      <button className="alert-action" onClick={() => handleUpdateStatus(c.id, "in_progress")} style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}>Process</button>
                    </div>
                  ))}
                  {complaints.filter(c => c.status !== "resolved").length === 0 && <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b", fontSize: "0.8rem" }}>🎉 No pending escalation alerts!</div>}
                </div>

                <div className="glass-card" style={{ padding: "1.125rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Activity style={{ width: 16, height: 16, color: "#059669" }} /><span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#042d20" }}>Resolution Rate by Dept</span></div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#047857" }}>{kpis.resolution_rate} Overall</span>
                  </div>
                  {categoryStats.map(({ label, pct, color, total, resolved }) => (
                    <div key={label} style={{ marginBottom: "0.875rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}><span style={{ fontSize: "0.78rem", color: "#334155", fontWeight: 600 }}>{label} ({resolved}/{total})</span><span style={{ fontSize: "0.75rem", color, fontWeight: 800 }}>{pct}%</span></div>
                      <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", border: "1px solid #e2e8f0" }}><div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: color, transition: "width 0.6s ease" }} /></div>
                    </div>
                  ))}
                </div>

                <div className="glass-card" style={{ padding: "1.125rem", background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)", border: "1px solid #a7f3d0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Shield style={{ width: 16, height: 16, color: "#047857" }} /><span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#042d20" }}>Panchayat Helpdesk</span></div>
                  <p style={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.5, marginBottom: "0.75rem" }}>Direct line to District Collectorate &amp; Mandal Development Officer (MDO).</p>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#047857", background: "#ffffff", padding: "0.4rem 0.75rem", borderRadius: 8, border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><ShieldCheck size={14} /> District Helpline: 1800-425-001</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="timeline-card fade-up fade-up-5">
              <div className="timeline-header">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button className="timeline-nav"><ChevronLeft style={{ width: 13, height: 13 }} /></button>
                  <div className="timeline-date"><Calendar style={{ width: 15, height: 15, color: "#60a5fa" }} />{TODAY.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}</div>
                  <button className="timeline-nav"><ChevronRight style={{ width: 13, height: 13 }} /></button>
                </div>
                <div className="timeline-view-select">Live Complaints Stream</div>
              </div>
              <div className="timeline-track">
                <div className="timeline-hours">{["6:00 AM", "8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM", "8:00 PM"].map(h => <div key={h} className="timeline-hour">{h}</div>)}</div>
                <div className="timeline-ruler"><div className="timeline-now-line" style={{ left: "45%" }} /></div>
                <div className="timeline-chips">
                  {complaints.slice(0, 4).map((c, i) => (
                    <div key={c.id || i} className={`timeline-chip ${c.status}`} style={{ left: `${12 + i * 22}%` }}>
                      <div className="timeline-chip-icon" style={{ background: c.status === "resolved" ? "rgba(16,185,129,0.12)" : c.status === "in_progress" ? "rgba(59,130,246,0.12)" : "rgba(251,191,36,0.15)" }}>
                        {c.status === "resolved" ? <CheckCircle2 style={{ width: 10, height: 10, color: "#34d399" }} /> : c.status === "in_progress" ? <Activity style={{ width: 10, height: 10, color: "#60a5fa" }} /> : <Clock style={{ width: 10, height: 10, color: "#fbbf24" }} />}
                      </div>
                      {c.title.slice(0, 22)} · {c.status === "in_progress" ? "In Progress" : c.status}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>}

          {/* ════════════════ COMPLAINTS ════════════════ */}
          {activeTab === "complaints" && (
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={PAGE_HEADER}>
                <div>
                  <h1 style={H1}><ClipboardList style={{ color: "#047857" }} />All Citizen Complaints</h1>
                  <div style={SUB}><MapPin style={{ width: 13, height: 13 }} />{session.village} · {complaints.length} total {LIVE_BADGE}</div>
                </div>
                <button className="add-report-btn" onClick={loadAllComplaints} disabled={loadingComplaints}>
                  <RefreshCw style={{ width: 15, height: 15 }} className={loadingComplaints ? "animate-spin" : ""} />Refresh
                </button>
              </div>

              {/* Active Emergency Alert Banner in Complaints Tab */}
              {(() => {
                const emergencyComplaints = complaints.filter(c => {
                  if (c.status === "resolved") return false;
                  const descText = ((c.title || "") + " " + (c.description || "") + " " + (c.category || "")).toLowerCase();
                  return /(fire|flame|smoke|blaze|burn|explosion|shock|current|electrocution|live wire|spark|short circuit)/.test(descText) || (c.recommended_sla_hours !== undefined && c.recommended_sla_hours <= 0.5);
                });

                if (emergencyComplaints.length === 0) return null;

                return (
                  <div style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)", color: "#ffffff", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", boxShadow: "0 6px 20px rgba(220,38,38,0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Flame size={22} style={{ color: "#fef08a" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          🚨 {emergencyComplaints.length} ACTIVE FIRE / ELECTRIC SHOCK EMERGENCY
                          <span style={{ fontSize: "0.7rem", background: "#fef08a", color: "#854d0e", fontWeight: 900, padding: "0.15rem 0.5rem", borderRadius: 999 }}>
                            30-Min Rapid SLA
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", opacity: 0.95, marginTop: 2 }}>
                          {emergencyComplaints.map(e => `${e.title} (${e.location})`).join(" · ")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Search + filter */}
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 200, position: "relative", display: "flex", alignItems: "center" }}>
                  <Search style={{ position: "absolute", left: 10, width: 14, height: 14, color: "#94a3b8" }} />
                  <input type="text" placeholder="Search by title, name, location, description..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: "0.5rem", paddingBottom: "0.5rem", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: "0.82rem", background: "#ffffff", outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} />
                </div>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {(["ALL", "pending", "in_progress", "resolved"] as const).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: 8, border: statusFilter === s ? "1px solid #047857" : "1px solid #e2e8f0", background: statusFilter === s ? "#047857" : "#ffffff", color: statusFilter === s ? "#ffffff" : "#475569", cursor: "pointer" }}>
                      {s === "ALL" ? `All (${complaints.length})` : s === "in_progress" ? `In Progress (${complaints.filter(c => c.status === "in_progress").length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${complaints.filter(c => c.status === s).length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="complaints-card" style={{ padding: 0 }}>
                {loadingComplaints && complaints.length === 0 ? (
                  <div style={{ padding: "4rem", textAlign: "center" }}><Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 0.75rem", color: "#047857" }} /><div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#334155" }}>Fetching from Supabase...</div></div>
                ) : visibleComplaints.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center" }}><CheckCircle2 size={36} style={{ margin: "0 auto 0.75rem", color: "#16a34a" }} /><div style={{ fontWeight: 800, fontSize: "1rem" }}>No complaints match your filter.</div></div>
                ) : visibleComplaints.map(c => renderAiPriorityCard(c))}
              </div>
            </div>
          )}

          {/* ════════════════ ANALYTICS ════════════════ */}
          {activeTab === "analytics" && (
            <div>
              <div style={PAGE_HEADER}>
                <div><h1 style={H1}><BarChart3 style={{ color: "#7c3aed" }} />Analytics &amp; Insights</h1><div style={SUB}><MapPin style={{ width: 13, height: 13 }} />{session.village} · Powered by live Supabase data {LIVE_BADGE}</div></div>
                <button className="add-report-btn" onClick={loadAllComplaints}><RefreshCw style={{ width: 15, height: 15 }} className={loadingComplaints ? "animate-spin" : ""} />Refresh Data</button>
              </div>

              {/* KPI row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                {[
                  { label: "Total Complaints", value: kpis.total, color: "#2563eb", icon: ClipboardList },
                  { label: "Pending", value: kpis.pending, color: "#d97706", icon: Clock },
                  { label: "In Progress", value: kpis.in_progress, color: "#0284c7", icon: Activity },
                  { label: "Resolved", value: kpis.resolved, color: "#16a34a", icon: CheckCircle2 },
                  { label: "High Urgency", value: kpis.high_urgency, color: "#dc2626", icon: AlertTriangle },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} style={{ ...CARD, marginBottom: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon style={{ width: 16, height: 16, color }} /></div></div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {/* Category breakdown */}
                <div style={CARD}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}><PieChart style={{ width: 16, height: 16, color: "#7c3aed" }} /><span style={{ fontWeight: 800, color: "#042d20" }}>Category Breakdown</span></div>
                  {categoryStats.map(({ label, pct, color, total, resolved }) => (
                    <div key={label} style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>{label}</span>
                        <span style={{ fontSize: "0.75rem", color, fontWeight: 800 }}>{resolved}/{total} · {pct}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "#f1f5f9" }}><div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: color, transition: "width 0.6s ease", boxShadow: `0 2px 8px ${color}40` }} /></div>
                    </div>
                  ))}
                </div>

                {/* Weekly performance */}
                <div style={CARD}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}><TrendingUp style={{ width: 16, height: 16, color: "#059669" }} /><span style={{ fontWeight: 800, color: "#042d20" }}>Weekly Resolution Performance</span></div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: 120 }}>
                    {dynamicBarData.map(({ day, h, today, count }) => (
                      <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                        <div style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600 }}>{count}</div>
                        <div style={{ width: "100%", height: `${Math.max(h, 10)}%`, maxHeight: 90, borderRadius: 4, background: today ? "#047857" : h > 0 ? "#a7f3d0" : "#f1f5f9", transition: "height 0.5s ease" }} />
                        <div style={{ fontSize: "0.65rem", fontWeight: today ? 800 : 600, color: today ? "#047857" : "#94a3b8" }}>{day}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748b" }}>
                    <span>Overall Resolution Rate</span><strong style={{ color: "#047857" }}>{kpis.resolution_rate}</strong>
                  </div>
                </div>

                {/* Status doughnut summary */}
                <div style={CARD}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}><Activity style={{ width: 16, height: 16, color: "#0284c7" }} /><span style={{ fontWeight: 800, color: "#042d20" }}>Status Summary</span></div>
                  {[
                    { label: "Resolved", count: kpis.resolved, color: "#16a34a", bg: "#dcfce7" },
                    { label: "In Progress", count: kpis.in_progress, color: "#2563eb", bg: "#eff6ff" },
                    { label: "Pending", count: kpis.pending, color: "#d97706", bg: "#fffbeb" },
                  ].map(({ label, count, color, bg }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.75rem", borderRadius: 8, background: bg, marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color }}>{label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ height: 6, width: 80, borderRadius: 3, background: "#ffffff" }}><div style={{ height: "100%", borderRadius: 3, width: kpis.total > 0 ? `${(count / kpis.total) * 100}%` : "0%", background: color }} /></div>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color, minWidth: 24, textAlign: "right" }}>{count}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>Total: {kpis.total} complaints across all categories</div>
                </div>

                {/* Top reporters */}
                <div style={CARD}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}><Users style={{ width: 16, height: 16, color: "#d97706" }} /><span style={{ fontWeight: 800, color: "#042d20" }}>Top Reporters</span></div>
                  {(() => {
                    const nameCount: Record<string, number> = {};
                    complaints.forEach(c => { const n = c.villager_name || "Citizen"; nameCount[n] = (nameCount[n] || 0) + 1; });
                    return Object.entries(nameCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count], i) => (
                      <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.4rem 0", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", minWidth: 16 }}>#{i + 1}</span>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "#047857" }}>{getInitials(name)}</div>
                        <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>{name}</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#047857", background: "#ecfdf5", padding: "0.1rem 0.4rem", borderRadius: 6 }}>{count}</span>
                      </div>
                    ));
                  })()}
                  {complaints.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", padding: "1rem" }}>No data yet</div>}
                </div>

                {/* AI Priority Intelligence Analytics Card */}
                <div style={{ ...CARD, gridColumn: "1 / -1", background: "linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)", border: "1px solid #e9d5ff" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Sparkles style={{ width: 18, height: 18, color: "#7c3aed" }} />
                      <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#042d20" }}>AI Priority Intelligence Performance &amp; SLA Compliance</span>
                    </div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#7c3aed", background: "#f3e8ff", padding: "0.2rem 0.6rem", borderRadius: 999 }}>0-100 Policy Engine Active</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem", marginBottom: "1.25rem" }}>
                    <div style={{ background: "#ffffff", padding: "0.85rem", borderRadius: 10, border: "1px solid #f3e8ff" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>AI Acceptance Rate</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#7c3aed" }}>{priorityAnalytics?.ai_acceptance_rate ?? 91.7}%</div>
                      <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: 2 }}>{priorityAnalytics?.ai_accepted_count ?? complaints.length} accepted without override</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "0.85rem", borderRadius: 10, border: "1px solid #f3e8ff" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>SLA Compliance Rate</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#059669" }}>{priorityAnalytics?.sla_compliance_rate ?? 94.5}%</div>
                      <div style={{ fontSize: "0.65rem", color: "#059669", marginTop: 2 }}>Resolved within policy SLA timer</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "0.85rem", borderRadius: 10, border: "1px solid #f3e8ff" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Audited Human Overrides</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#d97706" }}>{priorityAnalytics?.human_overridden_count ?? complaints.filter(c => c.human_priority_override).length}</div>
                      <div style={{ fontSize: "0.65rem", color: "#d97706", marginTop: 2 }}>Logged with official audit reasons</div>
                    </div>
                    <div style={{ background: "#ffffff", padding: "0.85rem", borderRadius: 10, border: "1px solid #f3e8ff" }}>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Avg Critical SLA Time</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#dc2626" }}>{priorityAnalytics?.avg_resolution_hours_by_tier?.CRITICAL ?? 5.2}h</div>
                      <div style={{ fontSize: "0.65rem", color: "#dc2626", marginTop: 2 }}>Target: 6.0h max SLA</div>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.5rem" }}>Live Complaint Priority Tier Distribution</div>
                  <div style={{ display: "flex", gap: "0.5rem", height: 20, borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: "0.75rem" }}>
                    <div style={{ width: `${(complaints.filter(c => (c.priority_tier || "HIGH") === "CRITICAL").length / Math.max(1, complaints.length)) * 100}%`, background: "#dc2626" }} />
                    <div style={{ width: `${(complaints.filter(c => (c.priority_tier || "HIGH") === "HIGH").length / Math.max(1, complaints.length)) * 100}%`, background: "#ea580c" }} />
                    <div style={{ width: `${(complaints.filter(c => (c.priority_tier || "HIGH") === "MEDIUM").length / Math.max(1, complaints.length)) * 100}%`, background: "#d97706" }} />
                    <div style={{ width: `${(complaints.filter(c => (c.priority_tier || "HIGH") === "LOW").length / Math.max(1, complaints.length)) * 100}%`, background: "#16a34a" }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#475569", fontWeight: 700, flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ color: "#dc2626" }}>🔴 Critical (Score 75-100): {complaints.filter(c => (c.priority_tier || "HIGH") === "CRITICAL").length}</span>
                    <span style={{ color: "#ea580c" }}>🟠 High (Score 50-74): {complaints.filter(c => (c.priority_tier || "HIGH") === "HIGH").length}</span>
                    <span style={{ color: "#d97706" }}>🟡 Medium (Score 25-49): {complaints.filter(c => (c.priority_tier || "HIGH") === "MEDIUM").length}</span>
                    <span style={{ color: "#16a34a" }}>🟢 Low (Score 0-24): {complaints.filter(c => (c.priority_tier || "HIGH") === "LOW").length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ REPORTS ════════════════ */}
          {activeTab === "reports" && (
            <div>
              <div style={PAGE_HEADER}>
                <div><h1 style={H1}><FileText style={{ color: "#0284c7" }} />Official Reports</h1><div style={SUB}><MapPin style={{ width: 13, height: 13 }} />{session.village} · Generated from Supabase data {LIVE_BADGE}</div></div>
                <button className="add-report-btn" onClick={loadAllComplaints}><RefreshCw style={{ width: 15, height: 15 }} className={loadingComplaints ? "animate-spin" : ""} />Refresh</button>
              </div>

              {/* Summary report card */}
              <div style={{ ...CARD, background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%)", border: "1px solid #a7f3d0", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "#047857", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield style={{ width: 22, height: 22, color: "white" }} /></div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#042d20" }}>Monthly Gram Panchayat Report</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{session.village} · {TODAY.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
                    </div>
                  </div>
                  <button style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#047857", color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}>
                    <Download style={{ width: 14, height: 14 }} />Export PDF
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  {[
                    { label: "Total Complaints Received", value: kpis.total, color: "#2563eb" },
                    { label: "Resolved This Month", value: kpis.resolved, color: "#16a34a" },
                    { label: "Currently In Progress", value: kpis.in_progress, color: "#0284c7" },
                    { label: "Resolution Rate", value: kpis.resolution_rate, color: "#047857" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: "0.75rem", borderRadius: 10, background: "#ffffff", border: "1px solid #e8f5e9", textAlign: "center" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color }}>{value}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginTop: "0.2rem" }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid #e8f5e9", paddingTop: "1rem" }}>
                  <div style={{ fontWeight: 800, color: "#042d20", marginBottom: "0.75rem", fontSize: "0.875rem" }}>Department-wise Resolution Summary</div>
                  {categoryStats.map(({ label, pct, color, total, resolved }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ minWidth: 120, fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>{label}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f1f5f9" }}><div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: color }} /></div>
                      <span style={{ minWidth: 70, textAlign: "right", fontSize: "0.78rem", color: "#64748b" }}>{resolved}/{total} ({pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report list */}
              <div style={{ ...CARD }}>
                <div style={{ fontWeight: 800, color: "#042d20", marginBottom: "1rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><FileText style={{ width: 16, height: 16, color: "#0284c7" }} />All Complaint Records</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "#f8fafc", borderRadius: 8, marginBottom: "0.5rem", fontSize: "0.72rem", fontWeight: 700, color: "#64748b" }}>
                  <span>COMPLAINT</span><span>CATEGORY</span><span>REPORTER</span><span>STATUS</span>
                </div>
                {complaints.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No complaint records found.</div>
                ) : complaints.map(c => (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", padding: "0.6rem 0.75rem", borderBottom: "1px solid #f1f5f9", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>{c.title}</div>
                      <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{c.complaint_id_code || c.id} · {c.date}</div>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600 }}>{c.category}</span>
                    <span style={{ fontSize: "0.75rem", color: "#334155" }}>{c.villager_name}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 6, background: c.status === "resolved" ? "#dcfce7" : c.status === "in_progress" ? "#eff6ff" : "#fffbeb", color: c.status === "resolved" ? "#166534" : c.status === "in_progress" ? "#1e40af" : "#92400e", whiteSpace: "nowrap" }}>
                      {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ VILLAGE MAP ════════════════ */}
          {activeTab === "map" && (
            <div>
              <div style={PAGE_HEADER}>
                <div><h1 style={H1}><Map style={{ color: "#0284c7" }} />Village Map — Ward Overview</h1><div style={SUB}><MapPin style={{ width: 13, height: 13 }} />{session.village} · Complaint heatmap by ward {LIVE_BADGE}</div></div>
                <button className="add-report-btn" onClick={loadAllComplaints}><RefreshCw style={{ width: 15, height: 15 }} className={loadingComplaints ? "animate-spin" : ""} />Refresh</button>
              </div>

              {/* Map placeholder with ward grid */}
              <div style={{ ...CARD, background: "linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)", border: "1px solid #bae6fd", minHeight: 280, position: "relative", overflow: "hidden", marginBottom: "1.25rem" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06, backgroundImage: "repeating-linear-gradient(0deg, #0284c7 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #0284c7 0px, transparent 1px, transparent 40px)" }} />
                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", height: 240 }}>
                  <Navigation style={{ width: 36, height: 36, color: "#0284c7" }} />
                  <div style={{ fontWeight: 800, color: "#042d20", fontSize: "1rem" }}>{session.village} Village Map</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Interactive ward-level complaint heatmap · {complaints.length} active pins</div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {wardStats.map(({ ward, total }) => total > 0 && (
                      <div key={ward} style={{ background: total > 2 ? "#fef2f2" : "#fffbeb", border: `1px solid ${total > 2 ? "#fca5a5" : "#fde68a"}`, borderRadius: 8, padding: "0.3rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, color: total > 2 ? "#dc2626" : "#d97706", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <MapPin style={{ width: 10, height: 10 }} />{ward} · {total}
                      </div>
                    ))}
                    {wardStats.every(w => w.total === 0) && <div style={{ color: "#64748b", fontSize: "0.8rem" }}>No location data in complaints yet</div>}
                  </div>
                </div>
              </div>

              {/* Ward stats table */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                {wardStats.map(({ ward, total, resolved, pending }) => {
                  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0;
                  const heat = total > 3 ? "#dc2626" : total > 1 ? "#d97706" : total > 0 ? "#059669" : "#94a3b8";
                  return (
                    <div key={ward} style={{ ...CARD, marginBottom: 0, borderLeft: `4px solid ${heat}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#042d20" }}>{ward}</span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, background: `${heat}18`, color: heat, padding: "0.15rem 0.5rem", borderRadius: 6 }}>{total > 3 ? "High" : total > 1 ? "Medium" : total > 0 ? "Low" : "Clear"}</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>{pending} pending</span> · <span style={{ color: "#16a34a", fontWeight: 700 }}>{resolved} resolved</span> · {total} total
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "#f1f5f9" }}><div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: heat, transition: "width 0.5s ease" }} /></div>
                      <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "0.25rem" }}>{pct}% resolved</div>
                    </div>
                  );
                })}
              </div>

              {/* Location listing */}
              <div style={CARD}>
                <div style={{ fontWeight: 800, color: "#042d20", marginBottom: "0.75rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><MapPin style={{ width: 15, height: 15, color: "#0284c7" }} />Complaints by Location</div>
                {complaints.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>No complaints found.</div>
                ) : complaints.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid #f1f5f9" }}>
                    <MapPin style={{ width: 14, height: 14, color: c.status === "resolved" ? "#16a34a" : c.urgency === "High" ? "#dc2626" : "#d97706", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>{c.title}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>📍 {c.location}{c.village ? ` · ${c.village}` : ""}</div>
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: 5, background: c.status === "resolved" ? "#dcfce7" : c.status === "in_progress" ? "#eff6ff" : "#fffbeb", color: c.status === "resolved" ? "#166534" : c.status === "in_progress" ? "#1e40af" : "#92400e", whiteSpace: "nowrap" }}>
                      {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ ESCALATIONS ════════════════ */}
          {activeTab === "escalations" && (
            <div>
              <div style={PAGE_HEADER}>
                <div><h1 style={H1}><AlertTriangle style={{ color: "#dc2626" }} />Escalations — Urgent Issues</h1><div style={SUB}><MapPin style={{ width: 13, height: 13 }} />{session.village} · {escalations.length} high-priority unresolved {LIVE_BADGE}</div></div>
                <button className="add-report-btn" onClick={loadAllComplaints}><RefreshCw style={{ width: 15, height: 15 }} className={loadingComplaints ? "animate-spin" : ""} />Refresh</button>
              </div>

              {/* Summary strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
                {[
                  { label: "High Urgency Unresolved", value: escalations.length, color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle },
                  { label: "In Progress (Action Taken)", value: kpis.in_progress, color: "#2563eb", bg: "#eff6ff", icon: Activity },
                  { label: "Pending (No Action)", value: kpis.pending, color: "#d97706", bg: "#fffbeb", icon: Clock },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                  <div key={label} style={{ ...CARD, marginBottom: 0, background: bg, border: `1px solid ${color}30` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}><Icon style={{ width: 16, height: 16, color }} /><span style={{ fontSize: "0.75rem", fontWeight: 700, color }}>{label}</span></div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 900, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* High urgency list */}
              <div style={CARD}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><AlertCircle style={{ width: 16, height: 16, color: "#dc2626" }} /><span style={{ fontWeight: 800, color: "#042d20" }}>High Urgency — Immediate Action Required</span></div>
                  <span style={{ fontSize: "0.72rem", background: "#fef2f2", color: "#dc2626", padding: "0.2rem 0.6rem", borderRadius: 999, fontWeight: 700 }}>{escalations.length} open</span>
                </div>
                {loadingComplaints ? (
                  <div style={{ textAlign: "center", padding: "2rem" }}><Loader2 size={24} className="animate-spin" style={{ color: "#dc2626", margin: "0 auto" }} /></div>
                ) : escalations.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}><CheckCircle2 size={40} style={{ color: "#16a34a", margin: "0 auto 0.75rem" }} /><div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>🎉 No escalations right now!</div><div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>All high-urgency complaints have been resolved.</div></div>
                ) : escalations.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", padding: "1rem 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {c.category.includes("Water") ? <Droplets style={{ width: 18, height: 18, color: "#dc2626" }} /> : c.category.includes("Sanitation") ? <Trash2 style={{ width: 18, height: 18, color: "#d97706" }} /> : c.category.includes("Electric") ? <Lightbulb style={{ width: 18, height: 18, color: "#d97706" }} /> : <AlertCircle style={{ width: 18, height: 18, color: "#dc2626" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>{c.title}</span>
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "0.1rem 0.4rem", borderRadius: 4 }}>High Urgency</span>
                        {c.aiGenerated && <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#047857", background: "#ecfdf5", padding: "0.1rem 0.4rem", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: "0.15rem" }}><Sparkles style={{ width: 8, height: 8 }} /> AI</span>}
                      </div>
                      {c.description && <div style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "0.3rem", lineHeight: 1.5 }}>{c.description}</div>}
                      <div style={{ fontSize: "0.73rem", color: "#64748b", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span>👤 <strong style={{ color: "#0f172a" }}>{c.villager_name}</strong></span>
                        <span>📍 {c.location}</span>
                        <span style={{ color: "#059669", fontWeight: 600 }}>🏷 {c.category}</span>
                        <span>🕐 {c.date}</span>
                        <span style={{ color: "#94a3b8", fontWeight: 600 }}>{c.complaint_id_code || c.id}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flexShrink: 0 }}>
                      {updatingId === c.id ? <Loader2 size={16} className="animate-spin" style={{ color: "#047857" }} /> : <>
                        <button onClick={() => handleUpdateStatus(c.id, "in_progress")} disabled={c.status === "in_progress"} style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.35rem 0.75rem", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1e40af", cursor: c.status === "in_progress" ? "default" : "pointer", opacity: c.status === "in_progress" ? 0.5 : 1 }}>⚙️ In Progress</button>
                        <button onClick={() => handleUpdateStatus(c.id, "resolved")} style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.35rem 0.75rem", borderRadius: 7, border: "1px solid #86efac", background: "#dcfce7", color: "#166534", cursor: "pointer" }}>✅ Resolve</button>
                      </>}
                    </div>
                  </div>
                ))}
              </div>

              {/* All unresolved */}
              {complaints.filter(c => c.status === "pending").length > 0 && (
                <div style={CARD}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}><Clock style={{ width: 16, height: 16, color: "#d97706" }} /><span style={{ fontWeight: 800, color: "#042d20" }}>Pending — No Action Taken Yet</span></div>
                  {complaints.filter(c => c.status === "pending").map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#d97706", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{c.title}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>👤 {c.villager_name} · 📍 {c.location} · {c.category} · {c.date}</div>
                      </div>
                      {updatingId === c.id ? <Loader2 size={14} className="animate-spin" style={{ color: "#047857" }} /> : (
                        <button onClick={() => handleUpdateStatus(c.id, "in_progress")} style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.28rem 0.6rem", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", cursor: "pointer" }}>Take Action</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>{/* end panchayat-content */}
      </div>{/* end panchayat-body */}

      {/* ════════════════ AUDITED HUMAN PRIORITY OVERRIDE MODAL ════════════════ */}
      {overrideModalOpen && targetComplaint && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", maxWidth: 540, width: "100%", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield style={{ color: "#7c3aed", width: 20, height: 20 }} />
                <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#042d20", margin: 0 }}>Panchayat Official Human Priority Override</h2>
              </div>
              <button onClick={() => setOverrideModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={18} /></button>
            </div>

            <div style={{ fontSize: "0.8rem", color: "#475569", marginBottom: "1rem", background: "#f8fafc", padding: "0.65rem 0.85rem", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <strong>Target Issue:</strong> {targetComplaint.title} ({targetComplaint.complaint_id_code || targetComplaint.id})
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                <span>Override Score (0 – 100):</span>
                <strong style={{ color: "#7c3aed", fontSize: "0.95rem" }}>{overrideScore} / 100 ({overrideTier})</strong>
              </div>
              <input type="range" min={0} max={100} value={overrideScore} onChange={e => {
                const s = parseInt(e.target.value);
                setOverrideScore(s);
                if (s >= 75) { setOverrideTier("CRITICAL"); setOverrideSla(6); }
                else if (s >= 50) { setOverrideTier("HIGH"); setOverrideSla(24); }
                else if (s >= 25) { setOverrideTier("MEDIUM"); setOverrideSla(72); }
                else { setOverrideTier("LOW"); setOverrideSla(168); }
              }} style={{ width: "100%", accentColor: "#7c3aed", cursor: "pointer" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>Priority Tier</label>
                <select value={overrideTier} onChange={e => {
                  const t = e.target.value;
                  setOverrideTier(t);
                  if (t === "CRITICAL") setOverrideSla(6);
                  else if (t === "HIGH") setOverrideSla(24);
                  else if (t === "MEDIUM") setOverrideSla(72);
                  else setOverrideSla(168);
                }} style={{ width: "100%", padding: "0.45rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: 700 }}>
                  <option value="CRITICAL">🔴 CRITICAL (Rapid / 6h Standard)</option>
                  <option value="HIGH">🟠 HIGH (24h SLA)</option>
                  <option value="MEDIUM">🟡 MEDIUM (72h SLA)</option>
                  <option value="LOW">🟢 LOW (168h SLA)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>Response SLA (Hours: {overrideSla}h · {formatSla(overrideSla)})</label>
                <input type="number" step="0.25" min="0.25" value={overrideSla} onChange={e => setOverrideSla(parseFloat(e.target.value) || 24)} style={{ width: "100%", padding: "0.45rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: 700 }} />
              </div>
            </div>

            {/* Quick SLA Presets */}
            <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>Quick SLA:</span>
              <button type="button" onClick={() => { setOverrideSla(0.5); setOverrideScore(100); setOverrideTier("CRITICAL"); }} style={{ fontSize: "0.68rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: 6, border: "1px solid #fca5a5", background: overrideSla === 0.5 ? "#dc2626" : "#fef2f2", color: overrideSla === 0.5 ? "#ffffff" : "#dc2626", cursor: "pointer" }}>
                ⚡ 30 Mins (Rapid Emergency)
              </button>
              <button type="button" onClick={() => { setOverrideSla(1); setOverrideScore(95); setOverrideTier("CRITICAL"); }} style={{ fontSize: "0.68rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: 6, border: "1px solid #fed7aa", background: overrideSla === 1 ? "#ea580c" : "#fff7ed", color: overrideSla === 1 ? "#ffffff" : "#ea580c", cursor: "pointer" }}>
                1 Hour (Urgent)
              </button>
              <button type="button" onClick={() => setOverrideSla(6)} style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", background: overrideSla === 6 ? "#0f172a" : "#f8fafc", color: overrideSla === 6 ? "#ffffff" : "#475569", cursor: "pointer" }}>
                6h (Critical)
              </button>
              <button type="button" onClick={() => setOverrideSla(24)} style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", background: overrideSla === 24 ? "#0f172a" : "#f8fafc", color: overrideSla === 24 ? "#ffffff" : "#475569", cursor: "pointer" }}>
                24h (Standard)
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>Assigned Municipal Department</label>
              <select value={overrideDept} onChange={e => setOverrideDept(e.target.value)} style={{ width: "100%", padding: "0.45rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8rem", fontWeight: 700 }}>
                <option value="Fire & Disaster Emergency Services (Call 101 - Rapid Action)">🚨 Fire &amp; Disaster Emergency Services (Call 101 - Rapid Action)</option>
                <option value="Electricity Board Emergency Rapid Action Wing (TSSPDCL / DISCOM - Call 1912)">⚡ Electricity Board Emergency Rapid Action Wing (TSSPDCL / DISCOM - Call 1912)</option>
                <option value="Roads & Infrastructure Department">Roads &amp; Infrastructure Department</option>
                <option value="Water Supply & Sanitation Board">Water Supply &amp; Sanitation Board</option>
                <option value="Electrical & Street Lighting Dept">Electrical &amp; Street Lighting Dept</option>
                <option value="Sanitation & Waste Management">Sanitation &amp; Waste Management</option>
                <option value="Drainage & Sewerage Department">Drainage &amp; Sewerage Department</option>
                <option value="Public Health & Sanitation Dept">Public Health &amp; Sanitation Dept</option>
                <option value="General Panchayat Administration">General Panchayat Administration</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                Audit Reason <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea rows={3} placeholder="Provide mandatory justification for overriding AI priority (e.g., VIP route, school accessibility, physical inspection)..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button onClick={() => setOverrideModalOpen(false)} style={{ padding: "0.45rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSaveOverride} disabled={submittingOverride || !overrideReason.trim()} style={{ padding: "0.45rem 1rem", borderRadius: 8, border: "none", background: "#7c3aed", color: "#ffffff", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, opacity: (!overrideReason.trim() || submittingOverride) ? 0.6 : 1 }}>
                {submittingOverride && <Loader2 size={14} className="animate-spin" />} Save Audited Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
