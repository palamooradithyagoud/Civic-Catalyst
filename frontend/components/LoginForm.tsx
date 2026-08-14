"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEMO_ACCOUNTS,
  loginWithCredentials,
  setSessionByAccount,
  DemoAccount,
} from "@/services/demoSession";
import {
  Users,
  Building2,
  HeartPulse,
  Hospital,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Check,
  Copy,
  AlertCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"credentials" | "quick">("credentials");
  const [identifier, setIdentifier] = useState("citizen@civic.gov.in");
  const [password, setPassword] = useState("citizen123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedAccId, setSelectedAccId] = useState<string>("demo-villager-001");

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleAutofill = (acc: DemoAccount) => {
    setIdentifier(acc.email);
    setPassword(acc.password);
    setSelectedAccId(acc.id);
    setError(null);
  };

  const handleQuickLogin = (acc: DemoAccount) => {
    setLoading(true);
    setError(null);
    setSelectedAccId(acc.id);
    setIdentifier(acc.email);
    setPassword(acc.password);

    setTimeout(() => {
      setSessionByAccount(acc);
      router.push(acc.redirectUrl);
    }, 400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = loginWithCredentials(identifier, password);
      if (res.success) {
        router.push(res.redirectUrl);
      } else {
        setError(res.error);
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* ── Mode Toggle Tabs ──────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("credentials");
            setError(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "credentials"
              ? "bg-white text-emerald-950 shadow-xs border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock className="h-4 w-4 text-emerald-700" />
          <span>Credential Login</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-extrabold">
            Credentials Below
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("quick");
            setError(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "quick"
              ? "bg-white text-emerald-950 shadow-xs border border-slate-200"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Zap className="h-4 w-4 text-amber-500" />
          <span>1-Click Role Access</span>
        </button>
      </div>

      {/* ── Tab 1: Credential Login with visible accounts ──────────────────── */}
      {activeTab === "credentials" ? (
        <div className="p-5 sm:p-7 space-y-6">
          {/* Main Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{error}</div>
              </div>
            )}

            {/* Email / User ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email / Mobile Number / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. citizen@civic.gov.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-emerald-800 font-semibold">
                  Demo password autofill available
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-950 active:scale-[0.99] text-white font-extrabold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* ── Visibly Provided Credentials Section ─────────────────────── */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Demo Accounts & Credentials
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                Click any card to autofill or 1-click sign in
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = selectedAccId === acc.id;
                let IconComponent = Users;
                if (acc.role === "panchayat_official") IconComponent = Building2;
                else if (acc.id.includes("mandal")) IconComponent = Hospital;
                else if (acc.role === "asha_worker") IconComponent = HeartPulse;

                return (
                  <div
                    key={acc.id}
                    className={`rounded-2xl p-3.5 border-2 transition-all text-left relative flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-700 bg-emerald-50/60 shadow-xs"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      {/* Top Row: Icon + Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center text-white ${
                              acc.role === "villager"
                                ? "bg-emerald-700"
                                : acc.role === "panchayat_official"
                                ? "bg-emerald-950"
                                : acc.id.includes("mandal")
                                ? "bg-cyan-700"
                                : "bg-teal-700"
                            }`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {acc.name}
                            </h4>
                            <p className="text-[10px] text-slate-500">{acc.roleTitle}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${acc.badgeColor}`}
                        >
                          {acc.badge}
                        </span>
                      </div>

                      {/* Credentials Display with Copy */}
                      <div className="bg-white rounded-xl p-2 border border-slate-200/80 mb-2.5 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-mono text-slate-800 font-semibold truncate pr-1">
                            {acc.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.email, `${acc.id}-email`)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy email"
                          >
                            {copiedField === `${acc.id}-email` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 pt-0.5 border-t border-slate-100">
                          <span className="font-mono text-slate-700">
                            pwd: <strong className="text-emerald-950">{acc.password}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.password, `${acc.id}-pwd`)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy password"
                          >
                            {copiedField === `${acc.id}-pwd` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAutofill(acc)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 hover:text-slate-900 transition-all text-center"
                      >
                        Autofill
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(acc)}
                        disabled={loading}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-xs transition-all"
                      >
                        <span>⚡ Sign In</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── Tab 2: 1-Click Role Direct Cards ─────────────────────────────── */
        <div className="p-5 sm:p-7 space-y-3.5">
          {DEMO_ACCOUNTS.map((acc) => {
            let IconComponent = Users;
            let themeGradient = "from-emerald-50 to-teal-50 hover:border-emerald-600";
            let iconBg = "bg-emerald-800 text-white";

            if (acc.role === "panchayat_official") {
              IconComponent = Building2;
              themeGradient = "from-slate-50 to-emerald-50 hover:border-emerald-800";
              iconBg = "bg-emerald-950 text-white";
            } else if (acc.id.includes("mandal")) {
              IconComponent = Hospital;
              themeGradient = "from-cyan-50 to-emerald-50 hover:border-cyan-600";
              iconBg = "bg-cyan-800 text-white";
            } else if (acc.role === "asha_worker") {
              IconComponent = HeartPulse;
              themeGradient = "from-teal-50 to-emerald-50 hover:border-teal-600";
              iconBg = "bg-teal-800 text-white";
            }

            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleQuickLogin(acc)}
                disabled={loading}
                className={`w-full group cursor-pointer text-left rounded-2xl p-4 border-2 border-slate-200 bg-gradient-to-r ${themeGradient} hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-950 truncate">
                        {acc.roleTitle}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
                        ({acc.name})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">{acc.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-xs font-extrabold text-emerald-900 pl-2">
                  <span className="hidden sm:inline">Direct Enter</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
