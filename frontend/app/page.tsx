"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isVillager } from "@/services/demoSession";
import { RoleSelector } from "@/components/RoleSelector";
import { Leaf, Mic, MapPin, Zap, Users, Building2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  // If a session already exists, redirect to the correct dashboard
  useEffect(() => {
    const s = getSession();
    if (s) {
      router.replace(
        isVillager(s) ? "/citizen/dashboard" : "/panchayat/dashboard"
      );
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="w-full px-4 py-4 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-700 flex items-center justify-center shadow-sm">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            Nivaaran AI
          </span>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Phase 1 Demo
        </span>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4">
        {/* Hero section */}
        <section className="pt-8 pb-10 text-center">
          {/* Emblem */}
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-200" />
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
              <Leaf className="h-10 w-10 text-white" />
            </div>
            {/* Pulse ring */}
            <div className="absolute -inset-2 rounded-[20px] border-2 border-indigo-200 opacity-60 animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-3">
            Nivaaran AI
          </h1>
          <p className="text-lg sm:text-xl text-indigo-700 font-semibold mb-4 leading-snug">
            &ldquo;AI can turn every citizen&apos;s voice into action.&rdquo;
          </p>
          <p className="text-slate-600 text-base max-w-md mx-auto leading-relaxed">
            An AI-assisted civic issue reporting platform bridging villagers
            with Gram Panchayat authorities — faster, smarter, and simpler.
          </p>
        </section>

        {/* ── Feature pills ──────────────────────────────────────────────────── */}
        <section className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: Mic, label: "Voice & Text Reports" },
            { icon: MapPin, label: "Location-aware" },
            { icon: Zap, label: "AI Classification" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 rounded-full px-3.5 py-1.5 border border-slate-200"
            >
              <Icon className="h-3.5 w-3.5 text-indigo-600" />
              <span>{label}</span>
            </div>
          ))}
        </section>

        {/* ── Role Selection ─────────────────────────────────────────────────── */}
        <section id="role-selection" className="mb-10">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-5">
            Who are you?
          </p>
          <RoleSelector />
        </section>

        {/* ── How it connects ────────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4 text-center">
              How Nivaaran AI connects communities
            </p>
            <div className="flex items-center justify-between gap-2">
              {/* Villager */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-xs font-semibold text-slate-700 text-center">
                  Villager
                </p>
                <p className="text-[11px] text-slate-500 text-center leading-tight">
                  Reports a problem
                </p>
              </div>

              {/* Arrow + AI */}
              <div className="flex flex-col items-center gap-1">
                <div className="h-9 w-9 rounded-full bg-indigo-700 flex items-center justify-center shadow-sm">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  AI
                </p>
              </div>

              {/* Panchayat */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-indigo-700" />
                </div>
                <p className="text-xs font-semibold text-slate-700 text-center">
                  Gram Panchayat
                </p>
                <p className="text-[11px] text-slate-500 text-center leading-tight">
                  Resolves the issue
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="text-center py-6 px-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Nivaaran AI &nbsp;·&nbsp; Built for rural India &nbsp;·&nbsp; Hackathon Demo v0.1
        </p>
      </footer>
    </div>
  );
}
