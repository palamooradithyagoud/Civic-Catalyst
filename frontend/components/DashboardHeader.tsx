"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/services/demoSession";
import { LogOut, Leaf, Shield } from "lucide-react";

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

  const isOfficial = role === "panchayat_official";

  return (
    <>
      {/* India Tricolour stripe */}
      <div className="india-top-bar" />

      <header className="gov-header">
        <div className="gov-header-inner">
          {/* Brand */}
          <div className="gov-logo">
            <div className="gov-logo-icon">
              {isOfficial
                ? <Shield className="h-5 w-5 text-white" style={{ position: "relative", zIndex: 1 }} />
                : <Leaf className="h-5 w-5 text-white" style={{ position: "relative", zIndex: 1 }} />
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="gov-logo-name">{title}</p>
              {subtitle && (
                <p className="gov-logo-sub">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="gov-header-right">
            {/* Live role badge */}
            <span className={`role-pill ${isOfficial ? "official" : "citizen"}`} style={{ display: "none" }}>
              <span aria-hidden />
            </span>
            <span
              className={`role-pill ${isOfficial ? "official" : "citizen"}`}
              style={{ display: "inline-flex" }}
            >
              <span className={`dot-live ${isOfficial ? "blue" : "orange"}`} />
              {isOfficial ? "Panchayat Official" : "Citizen"}
            </span>

            <button
              onClick={handleLogout}
              className="logout-btn"
              aria-label="Logout and switch role"
            >
              <LogOut style={{ width: 14, height: 14 }} />
              <span>Switch Role</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
