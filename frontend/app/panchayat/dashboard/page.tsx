"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isVillager,
  isPanchayatOfficial,
} from "@/services/demoSession";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import type { DemoPanchayat } from "@/types";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ClipboardList,
  Inbox,
} from "lucide-react";

export default function PanchayatDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<DemoPanchayat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    if (isVillager(s)) {
      router.replace("/citizen/dashboard");
      return;
    }
    if (isPanchayatOfficial(s)) {
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
        title={session.name}
        subtitle={session.village}
        role="panchayat_official"
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="welcome-banner indigo">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{session.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-sm text-slate-600">{session.village}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Review and resolve civic complaints from villagers in your area.
          </p>
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="section-title mb-3">Complaint Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total Complaints"
              value={0}
              icon={BarChart3}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
            />
            <StatCard
              label="Pending"
              value={0}
              icon={Clock}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
            <StatCard
              label="In Progress"
              value={0}
              icon={AlertCircle}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatCard
              label="Resolved"
              value={0}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
          </div>
        </div>

        {/* What's coming */}
        <div className="section-card">
          <h2 className="section-title">AI-Powered Complaint Management</h2>
          <div className="space-y-3 mt-3">
            {[
              {
                icon: ClipboardList,
                color: "text-indigo-600 bg-indigo-50",
                label: "Smart classification",
                desc: "AI automatically categorises incoming complaints.",
              },
              {
                icon: AlertCircle,
                color: "text-amber-600 bg-amber-50",
                label: "Priority routing",
                desc: "High-priority issues are flagged and escalated automatically.",
              },
              {
                icon: CheckCircle2,
                color: "text-emerald-600 bg-emerald-50",
                label: "Resolution tracking",
                desc: "Update status and notify villagers when issues are resolved.",
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
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

        {/* Complaint Management */}
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Complaints</h2>
            <span className="text-xs font-medium text-slate-400">
              0 total
            </span>
          </div>
          <EmptyState
            icon={Inbox}
            title="No complaints received yet"
            description="When villagers file complaints, they will appear here for review and resolution."
            comingSoon
          />
        </div>
      </main>
    </div>
  );
}
