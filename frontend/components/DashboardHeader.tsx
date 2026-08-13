"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/services/demoSession";
import { LogOut, Leaf } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  role: "villager" | "panchayat_official";
}

export function DashboardHeader({ title, subtitle, role }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  const accentColor =
    role === "villager"
      ? "bg-saffron-50 text-saffron-700 border-saffron-200"
      : "bg-indigo-50 text-indigo-700 border-indigo-200";

  const roleBadgeLabel =
    role === "villager" ? "Villager" : "Panchayat Official";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-tight truncate">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`hidden sm:inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${accentColor}`}
          >
            {roleBadgeLabel}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 min-h-[44px]"
            aria-label="Logout and switch role"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Switch Role</span>
          </button>
        </div>
      </div>
    </header>
  );
}
