/**
 * demoSession.ts
 * Manages user authentication & demo sessions with credentials.
 */

import type { DemoSession, DemoVillager, DemoPanchayat, DemoAshaWorker } from "@/types";

const SESSION_KEY = "nivaaran_demo_session";

export interface DemoAccount {
  id: string;
  email: string;
  phone?: string;
  password: string;
  name: string;
  roleTitle: string;
  role: "villager" | "panchayat_official" | "asha_worker";
  village: string;
  phcCenter?: string;
  badge: string;
  badgeColor: string;
  redirectUrl: string;
  description: string;
}

// ── Demo Accounts with Credentials ──────────────────────────────────────────

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo-villager-001",
    email: "citizen@civic.gov.in",
    phone: "9876543210",
    password: "citizen123",
    name: "Ramesh Kumar",
    roleTitle: "Rural Citizen / Villager",
    role: "villager",
    village: "Shyampet",
    badge: "Citizen Portal",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    redirectUrl: "/citizen/dashboard",
    description: "Report civic hazards (potholes, live wires, leaks) with AI Vision & GPS tracking",
  },
  {
    id: "demo-panchayat-001",
    email: "panchayat@civic.gov.in",
    phone: "9876543211",
    password: "admin123",
    name: "Panchayat Secretary",
    roleTitle: "Gram Panchayat Official",
    role: "panchayat_official",
    village: "Shyampet",
    badge: "Panchayat Admin",
    badgeColor: "bg-emerald-900 text-white border-emerald-800",
    redirectUrl: "/panchayat/dashboard",
    description: "AI 6-factor priority triage, 30-min emergency SLA dispatch & audit overrides",
  },
  {
    id: "demo-asha-001",
    email: "asha.village@civic.gov.in",
    phone: "9876543212",
    password: "asha123",
    name: "Sunita Devi (ASHA)",
    roleTitle: "ASHA Village Health Worker",
    role: "asha_worker",
    village: "Shyampet",
    phcCenter: "Shyampet Village Health Post",
    badge: "ASHA Village",
    badgeColor: "bg-teal-100 text-teal-900 border-teal-300",
    redirectUrl: "/asha/dashboard?mode=village",
    description: "Manage village medicine stock, maternal IFA supplies, vaccines & distribution",
  },
  {
    id: "demo-mandal-001",
    email: "mandal.health@civic.gov.in",
    phone: "9876543213",
    password: "mandal123",
    name: "Dr. K. Rao (Medical Officer)",
    roleTitle: "Mandal HQ Health Officer",
    role: "asha_worker",
    village: "Shyampet Mandal HQ",
    phcCenter: "Mandal Central PHC & General Hospital",
    badge: "Mandal Health HQ",
    badgeColor: "bg-cyan-100 text-cyan-900 border-cyan-300",
    redirectUrl: "/asha/dashboard?mode=mandal",
    description: "Multi-village supply monitoring, automated restock alerts & dispatch orders",
  },
];

export const DEMO_VILLAGER: DemoVillager = {
  id: DEMO_ACCOUNTS[0].id,
  name: DEMO_ACCOUNTS[0].name,
  role: "villager",
  village: DEMO_ACCOUNTS[0].village,
};

export const DEMO_PANCHAYAT: DemoPanchayat = {
  id: DEMO_ACCOUNTS[1].id,
  name: DEMO_ACCOUNTS[1].name,
  village: DEMO_ACCOUNTS[1].village,
  role: "panchayat_official",
};

export const DEMO_ASHA_WORKER: DemoAshaWorker = {
  id: DEMO_ACCOUNTS[2].id,
  name: DEMO_ACCOUNTS[2].name,
  village: DEMO_ACCOUNTS[2].village,
  role: "asha_worker",
  phcCenter: DEMO_ACCOUNTS[2].phcCenter || "Shyampet Village Health Post",
};

// ── Authentication & Session Helpers ────────────────────────────────────────

export function loginWithCredentials(
  identifier: string,
  pass: string
): { success: true; redirectUrl: string; session: DemoSession } | { success: false; error: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: "Please enter both identifier (email/phone) and password." };
  }

  const matched = DEMO_ACCOUNTS.find(
    (acc) =>
      (acc.email.toLowerCase() === cleanId ||
        acc.phone === cleanId ||
        acc.id.toLowerCase() === cleanId ||
        acc.role.toLowerCase() === cleanId) &&
      acc.password === cleanPass
  );

  if (!matched) {
    const userExists = DEMO_ACCOUNTS.some(
      (acc) =>
        acc.email.toLowerCase() === cleanId ||
        acc.phone === cleanId ||
        acc.id.toLowerCase() === cleanId
    );
    if (userExists) {
      return { success: false, error: "Invalid password. Use the demo password shown in the credentials card below." };
    }
    return { success: false, error: "Account not found. Click one of the demo credentials below to autofill." };
  }

  let sessionData: DemoSession;
  if (matched.role === "villager") {
    sessionData = {
      id: matched.id,
      name: matched.name,
      role: "villager",
      village: matched.village,
    };
  } else if (matched.role === "panchayat_official") {
    sessionData = {
      id: matched.id,
      name: matched.name,
      role: "panchayat_official",
      village: matched.village,
    };
  } else {
    sessionData = {
      id: matched.id,
      name: matched.name,
      role: "asha_worker",
      village: matched.village,
      phcCenter: matched.phcCenter || "Shyampet Health Centre",
    };
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }

  return { success: true, redirectUrl: matched.redirectUrl, session: sessionData };
}

export function setVillagerSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_VILLAGER));
}

export function setPanchayatSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_PANCHAYAT));
}

export function setAshaSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_ASHA_WORKER));
}

export function setSessionByAccount(account: DemoAccount): void {
  if (typeof window === "undefined") return;
  let sessionData: DemoSession;
  if (account.role === "villager") {
    sessionData = {
      id: account.id,
      name: account.name,
      role: "villager",
      village: account.village,
    };
  } else if (account.role === "panchayat_official") {
    sessionData = {
      id: account.id,
      name: account.name,
      role: "panchayat_official",
      village: account.village,
    };
  } else {
    sessionData = {
      id: account.id,
      name: account.name,
      role: "asha_worker",
      village: account.village,
      phcCenter: account.phcCenter || "Shyampet Health Centre",
    };
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

export function getSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isVillager(session: DemoSession | null): session is DemoVillager {
  return session?.role === "villager";
}

export function isPanchayatOfficial(
  session: DemoSession | null
): session is DemoPanchayat {
  return session?.role === "panchayat_official";
}

export function isAshaWorker(
  session: DemoSession | null
): session is DemoAshaWorker {
  return session?.role === "asha_worker";
}
