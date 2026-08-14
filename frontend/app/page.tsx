"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isVillager } from "@/services/demoSession";
import { CivicLogo } from "@/components/CivicLogo";
import { RoleSelector } from "@/components/RoleSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Zap, Users, Building2 } from "lucide-react";

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
      <header className="w-full px-4 py-4 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5">
          <CivicLogo size="sm" />
          <span className="font-extrabold text-emerald-950 text-lg tracking-tight">
            Civic Catalyst
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="landing" />
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Live Platform
          </span>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4">
        {/* Hero section */}
        <section className="pt-8 pb-8 text-center">
          {/* CS Brand Emblem */}
          <div className="flex justify-center mb-6">
            <CivicLogo size="hero" glow={true} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-3">
            Civic Catalyst
          </h1>
          <p className="text-lg sm:text-xl text-emerald-900 font-semibold mb-4 leading-snug">
            &ldquo;Empowering every citizen&apos;s voice into action.&rdquo;
          </p>
          <p className="text-slate-600 text-base max-w-md mx-auto leading-relaxed">
            Report civic problems or manage ASHA health inventory with smart AI assistance.
          </p>
        </section>

        {/* ── Role Selection ─────────────────────────────────────────────────── */}
        <section id="role-selection" className="mb-10">
          <RoleSelector />
        </section>

        {/* ── How it connects ────────────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-5">
            <p className="text-sm font-semibold text-emerald-950 mb-4 text-center">
              How Civic Catalyst connects communities
            </p>
            <div className="flex items-center justify-between gap-2">
              {/* Villager */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
                  <Users className="h-6 w-6 text-emerald-900" />
                </div>
                <p className="text-xs font-semibold text-slate-800 text-center">
                  Villager
                </p>
                <p className="text-[11px] text-slate-500 text-center leading-tight">
                  Reports a problem
                </p>
              </div>

              {/* Arrow + AI */}
              <div className="flex flex-col items-center gap-1">
                <div className="h-9 w-9 rounded-full bg-emerald-900 flex items-center justify-center shadow-sm">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  AI
                </p>
              </div>

              {/* Panchayat */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="h-12 w-12 rounded-xl bg-emerald-900 flex items-center justify-center border border-emerald-800">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-semibold text-slate-800 text-center">
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

      <footer className="text-center py-6 px-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Civic Catalyst &nbsp;·&nbsp; Built for rural India
        </p>
      </footer>
    </div>
  );
}
