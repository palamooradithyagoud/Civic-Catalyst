"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isVillager, isPanchayatOfficial, isAshaWorker } from "@/services/demoSession";
import { CivicLogo } from "@/components/CivicLogo";
import { LoginForm } from "@/components/LoginForm";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Zap, Users, Building2, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  // If a session already exists, redirect to the correct dashboard
  useEffect(() => {
    const s = getSession();
    if (s) {
      if (isVillager(s)) {
        router.replace("/citizen/dashboard");
      } else if (isPanchayatOfficial(s)) {
        router.replace("/panchayat/dashboard");
      } else if (isAshaWorker(s)) {
        router.replace("/asha/dashboard");
      } else {
        router.replace("/citizen/dashboard");
      }
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
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="w-full px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5">
          <CivicLogo size="sm" />
          <span className="font-extrabold text-emerald-950 text-lg tracking-tight">
            Civic Catalyst
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="landing" />
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Live Platform
          </span>
        </div>
      </header>

      {/* ── Hero & Login ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-12">
        {/* Hero section */}
        <section className="pt-6 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <CivicLogo size="hero" glow={true} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2 tracking-tight">
            Civic Catalyst
          </h1>
          <p className="text-base sm:text-lg text-emerald-900 font-bold mb-2">
            &ldquo;Empowering every citizen&apos;s voice into action.&rdquo;
          </p>
          <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            AI-powered Rural Governance & Healthcare Supply Chain. Select a demo account below or enter your credentials to sign in.
          </p>
        </section>

        {/* ── Interactive Login System with Visible Demo Credentials ─────────── */}
        <section id="login-section" className="mb-8">
          <LoginForm />
        </section>

        {/* ── How it connects ────────────────────────────────────────────────── */}
        <section className="mb-6">
          <div className="bg-white rounded-3xl border border-emerald-200/80 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-3 text-center">
              How Civic Catalyst connects communities
            </p>
            <div className="flex items-center justify-between gap-2">
              {/* Villager */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-900">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 text-center">
                  Villager
                </p>
                <p className="text-[11px] text-slate-500 text-center leading-tight">
                  Reports hazards via AI Vision
                </p>
              </div>

              {/* Arrow + AI */}
              <div className="flex flex-col items-center gap-1">
                <div className="h-8 w-8 rounded-full bg-emerald-900 flex items-center justify-center shadow-xs text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <p className="text-[9px] font-extrabold text-emerald-900 uppercase tracking-wider">
                  AI Triage
                </p>
              </div>

              {/* Panchayat */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className="h-11 w-11 rounded-xl bg-emerald-950 flex items-center justify-center border border-emerald-900 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 text-center">
                  Gram Panchayat
                </p>
                <p className="text-[11px] text-slate-500 text-center leading-tight">
                  30-Min Rapid SLA Resolution
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-5 px-4 border-t border-slate-200/60 bg-white">
        <p className="text-xs text-slate-400">
          Civic Catalyst &nbsp;·&nbsp; Smart Rural Governance Platform
        </p>
      </footer>
    </div>
  );
}
