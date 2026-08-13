"use client";

import { useRouter } from "next/navigation";
import { setVillagerSession, setPanchayatSession, setAshaSession } from "@/services/demoSession";
import { Users, Building2, HeartPulse, ArrowRight, ShieldCheck, Home, Hospital } from "lucide-react";

export function RoleSelector() {
  const router = useRouter();

  const handleVillager = () => {
    setVillagerSession();
    router.push("/citizen/dashboard");
  };

  const handlePanchayat = () => {
    setPanchayatSession();
    router.push("/panchayat/dashboard");
  };

  const handleAshaVillage = () => {
    setAshaSession();
    router.push("/asha/dashboard?mode=village");
  };

  const handleAshaMandal = () => {
    setAshaSession();
    router.push("/asha/dashboard?mode=mandal");
  };

  return (
    <div className="w-full space-y-4">
      {/* Villager Card */}
      <button
        onClick={handleVillager}
        className="role-card group w-full text-left"
        aria-label="Continue as Villager"
      >
        <div className="role-card-icon bg-emerald-100 border border-emerald-200">
          <Users className="h-7 w-7 text-emerald-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="role-card-title">Continue as Villager</p>
          <p className="role-card-subtitle">
            Report civic problems in your village
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </button>

      {/* Panchayat Card */}
      <button
        onClick={handlePanchayat}
        className="role-card group w-full text-left"
        aria-label="Continue as Gram Panchayat"
      >
        <div className="role-card-icon bg-emerald-900 border border-emerald-800">
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="role-card-title">Continue as Gram Panchayat</p>
          <p className="role-card-subtitle">
            Manage and resolve village complaints
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </button>

      {/* ── ASHA WORKER 2 CARDS DIRECTLY ON LANDING PAGE ──────────────── */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <HeartPulse className="h-4 w-4 text-teal-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
            ASHA Healthcare Options (Select Access Level)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* CARD 1: ASHA Worker (Village) */}
          <button
            onClick={handleAshaVillage}
            className="group relative cursor-pointer text-left rounded-2xl p-4 border-2 border-teal-200 hover:border-teal-600 bg-gradient-to-br from-teal-50/80 to-emerald-50/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs">
                  <Home className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                  Village Level
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1 group-hover:text-teal-900 transition-colors">
                1. ASHA Worker (Village Health Center)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Village surveys, maternal ANC/PNC tracking, immunization visits & village stock inventory.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-teal-800 mt-3 pt-2 border-t border-teal-200/60">
              <span>Enter Village Portal</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* CARD 2: Mandal Hospital & Health Office */}
          <button
            onClick={handleAshaMandal}
            className="group relative cursor-pointer text-left rounded-2xl p-4 border-2 border-emerald-200 hover:border-emerald-600 bg-gradient-to-br from-emerald-50/80 to-cyan-50/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs">
                  <Hospital className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Mandal HQ Level
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1 group-hover:text-emerald-900 transition-colors">
                2. Mandal Hospital & Health Office
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitor ALL villages under Mandal. Automatic out-of-stock alerts & 1-click stock dispatch to villages.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-900 mt-3 pt-2 border-t border-emerald-200/60">
              <span>Enter Mandal Office</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Demo notice */}
      <div className="flex items-start gap-2 pt-1 px-1">
        <ShieldCheck className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          This is a demo environment. No account required.
        </p>
      </div>
    </div>
  );
}
