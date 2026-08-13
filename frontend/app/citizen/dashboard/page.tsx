"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isVillager,
  isPanchayatOfficial,
} from "@/services/demoSession";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { DemoVillager } from "@/types";
import {
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function CitizenDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<DemoVillager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    if (isPanchayatOfficial(s)) {
      router.replace("/panchayat/dashboard");
      return;
    }
    if (isVillager(s)) {
      setSession(s);
    }
    setLoading(false);
  }, [router]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        title="Nivaaran AI"
        subtitle={session.village}
        role="villager"
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="welcome-banner saffron">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Namaste, {session.name} 🙏
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-sm text-slate-600">{session.village}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-sm text-slate-600">
            <AlertCircle className="h-4 w-4 text-saffron-600 flex-shrink-0" />
            <span>Use Nivaaran AI to report civic problems in your village.</span>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="section-card">
          <h2 className="section-title">Have a Problem?</h2>
          <p className="text-sm text-slate-600 mb-4">
            Report road damage, water supply issues, sanitation problems, and
            more. Your complaint will be routed to the right authority.
          </p>
          <button
            className="primary-btn w-full"
            onClick={() => alert("Complaint reporting is coming in Phase 2!")}
            aria-label="Report a Problem"
          >
            <FileText className="h-5 w-5" />
            Report a Problem
          </button>
        </div>

        {/* How it works — Phase 2 preview */}
        <div className="section-card">
          <h2 className="section-title">How Nivaaran AI Works</h2>
          <div className="space-y-3 mt-3">
            {[
              {
                icon: FileText,
                color: "text-saffron-600 bg-saffron-50",
                step: "1",
                label: "Describe your problem",
                desc: "Type, record voice, or upload a photo.",
              },
              {
                icon: AlertCircle,
                color: "text-indigo-600 bg-indigo-50",
                step: "2",
                label: "AI classifies & routes",
                desc: "Our AI identifies the issue and finds the right official.",
              },
              {
                icon: CheckCircle2,
                color: "text-emerald-600 bg-emerald-50",
                step: "3",
                label: "Track resolution",
                desc: "Get notified as your complaint is addressed.",
              },
            ].map(({ icon: Icon, color, step, label, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Complaints */}
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Complaints</h2>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              All time
            </span>
          </div>
          <EmptyState
            icon={FileText}
            title="No complaints filed yet"
            description="Once you report a problem, you can track its status here."
            comingSoon
          />
        </div>
      </main>
    </div>
  );
}
