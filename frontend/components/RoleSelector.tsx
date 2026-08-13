"use client";

import { useRouter } from "next/navigation";
import { setVillagerSession, setPanchayatSession, setAshaSession } from "@/services/demoSession";
import { Users, Building2, HeartPulse, ArrowRight, ShieldCheck } from "lucide-react";

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

  const handleAsha = () => {
    setAshaSession();
    router.push("/asha/dashboard");
  };

  return (
    <div className="w-full space-y-3">
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

      {/* ASHA Worker Card */}
      <button
        onClick={handleAsha}
        className="role-card group w-full text-left"
        aria-label="Continue as ASHA Worker"
      >
        <div className="role-card-icon bg-teal-50 border border-teal-200">
          <HeartPulse className="h-7 w-7 text-teal-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="role-card-title">Continue as ASHA Worker</p>
          <p className="role-card-subtitle">
            Community healthcare, visits & sanitation sync
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </button>

      {/* Demo notice */}
      <div className="flex items-start gap-2 pt-2 px-1">
        <ShieldCheck className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          This is a demo environment. No account required.
        </p>
      </div>
    </div>
  );
}
