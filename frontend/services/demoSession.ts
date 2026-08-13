/**
 * demoSession.ts
 * Manages demo user sessions using localStorage.
 * Phase 1: No real authentication — demo only.
 * Phase 2: Replace with real auth tokens / JWT / Supabase session.
 */

import type { DemoSession, DemoVillager, DemoPanchayat } from "@/types";

const SESSION_KEY = "nivaaran_demo_session";

// ── Demo data ────────────────────────────────────────────────────────────────

export const DEMO_VILLAGER: DemoVillager = {
  id: "demo-villager-001",
  name: "Ramesh Kumar",
  role: "villager",
  village: "Demo Village",
};

export const DEMO_PANCHAYAT: DemoPanchayat = {
  id: "demo-panchayat-001",
  name: "Demo Gram Panchayat",
  village: "Demo Village",
  role: "panchayat_official",
};

// ── Session helpers ───────────────────────────────────────────────────────────

export function setVillagerSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_VILLAGER));
}

export function setPanchayatSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_PANCHAYAT));
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
