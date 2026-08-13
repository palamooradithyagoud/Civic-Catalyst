"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isVillager,
  isPanchayatOfficial,
} from "@/services/demoSession";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DemoVillager } from "@/types";
import {
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Mic,
  Camera,
  ArrowUpRight,
  Sparkles,
  Clock,
  Shield,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    number: "01",
    numberClass: "step-number orange",
    icon: FileText,
    iconColor: "#fb923c",
    label: "Describe your problem",
    desc: "Type in your language, record a voice note, or upload a photo of the issue.",
  },
  {
    number: "02",
    numberClass: "step-number blue",
    icon: AlertCircle,
    iconColor: "#93c5fd",
    label: "AI classifies and routes",
    desc: "Our AI identifies the issue category and automatically finds the right official.",
  },
  {
    number: "03",
    numberClass: "step-number green",
    icon: CheckCircle2,
    iconColor: "#6ee7b7",
    label: "Track resolution",
    desc: "Get real-time updates as your complaint moves through the system.",
  },
];

const INPUT_MODES = [
  { icon: FileText, label: "Text", desc: "Type your complaint" },
  { icon: Mic, label: "Voice", desc: "Speak your issue" },
  { icon: Camera, label: "Photo", desc: "Upload evidence" },
];

export default function CitizenDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<DemoVillager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/"); return; }
    if (isPanchayatOfficial(s)) { router.replace("/panchayat/dashboard"); return; }
    if (isVillager(s)) setSession(s);
    setLoading(false);
  }, [router]);

  if (loading || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#05111f" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="gov-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="gov-content">
        <DashboardHeader title="Nivaaran AI" subtitle={session.village} role="villager" />

        <main className="gov-main">

          <div className="hero-banner citizen fade-up fade-up-1">
            <div className="hero-eyebrow citizen">
              <Sparkles style={{ width: 10, height: 10 }} />
              Citizen Portal
            </div>
            <h1 className="hero-title">Namaste, {session.name} <span style={{ fontSize: "1.5rem" }}>🙏</span></h1>
            <div className="hero-subtitle">
              <MapPin style={{ width: 14, height: 14, color: "#64748b" }} />
              {session.village}
            </div>
            <p className="hero-desc">
              Report civic problems in your village and track their resolution. Your voice matters — and Nivaaran AI makes sure it reaches the right people.
            </p>
            <div className="hero-meta">
              <span className="hero-meta-item">
                <Shield style={{ width: 12, height: 12, color: "#6ee7b7" }} />
                Secure and confidential
              </span>
              <span className="hero-meta-item">
                <ArrowUpRight style={{ width: 12, height: 12 }} />
                AI-powered routing
              </span>
              <span className="hero-meta-item">
                <Clock style={{ width: 12, height: 12 }} />
                Real-time tracking
              </span>
            </div>
          </div>

          <div className="glass-card fade-up fade-up-2">
            <p className="glass-card-title" style={{ marginBottom: "0.25rem" }}>Report a Civic Issue</p>
            <p className="glass-card-sub" style={{ marginBottom: "1.5rem" }}>
              Choose how you want to describe your problem. All types of input are supported.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem", marginBottom: "1.25rem" }}>
              {INPUT_MODES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  style={{
                    padding: "0.875rem 0.75rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(234,88,12,0.15)",
                    background: "rgba(234,88,12,0.05)",
                    textAlign: "center",
                    cursor: "not-allowed",
                    opacity: 0.65,
                    transition: "all 0.2s",
                  }}
                  title="Coming in Phase 2"
                >
                  <Icon style={{ width: 20, height: 20, color: "#fb923c", margin: "0 auto 0.375rem" }} />
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.1rem" }}>{label}</p>
                  <p style={{ fontSize: "0.68rem", color: "rgba(148,163,184,0.5)" }}>{desc}</p>
                </div>
              ))}
            </div>

            <button
              className="primary-action-btn orange"
              onClick={() => alert("Complaint reporting is coming in Phase 2!")}
              aria-label="Report a Problem"
            >
              <FileText style={{ width: 18, height: 18 }} />
              Report a Problem
            </button>
          </div>

          <div className="glass-card fade-up fade-up-3">
            <p className="glass-card-title" style={{ marginBottom: "0.25rem" }}>How Nivaaran AI Works</p>
            <p className="glass-card-sub" style={{ marginBottom: "1.5rem" }}>Three simple steps from complaint to resolution</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {HOW_IT_WORKS.map(({ number, numberClass, icon: Icon, iconColor, label, desc }, i) => (
                <div key={number} className="process-step" style={{ marginBottom: i < HOW_IT_WORKS.length - 1 ? "1.5rem" : 0 }}>
                  {i < HOW_IT_WORKS.length - 1 && <div className="step-connector" />}
                  <div className={numberClass}>{number}</div>
                  <div style={{ paddingTop: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                      <Icon style={{ width: 15, height: 15, color: iconColor }} />
                      <p className="feature-label">{label}</p>
                    </div>
                    <p className="feature-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card fade-up fade-up-4">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div>
                <p className="glass-card-title">My Complaints</p>
                <p className="glass-card-sub">Track all your submitted issues</p>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "rgba(148,163,184,0.5)", fontWeight: 500 }}>
                <Clock style={{ width: 12, height: 12 }} />
                All time
              </span>
            </div>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

            <div className="activity-empty">
              <div className="activity-empty-icon">
                <FileText style={{ width: 28, height: 28, color: "rgba(148,163,184,0.4)" }} />
              </div>
              <p className="activity-empty-title">No complaints filed yet</p>
              <p className="activity-empty-desc">
                Once you report a civic problem, you can track its status and get updates right here.
              </p>
              <span className="coming-soon-badge">
                <Sparkles style={{ width: 10, height: 10 }} />
                Live tracking — Phase 2
              </span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
