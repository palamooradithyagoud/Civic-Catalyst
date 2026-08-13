// ── Demo data constants ──────────────────────────────────────────────────────

export type UserRole = "villager" | "panchayat_official" | "asha_worker";

export interface DemoVillager {
  id: string;
  name: string;
  role: "villager";
  village: string;
}

export interface DemoPanchayat {
  id: string;
  name: string;
  village: string;
  role: "panchayat_official";
}

export interface DemoAshaWorker {
  id: string;
  name: string;
  village: string;
  role: "asha_worker";
  phcCenter: string;
}

export type DemoSession = DemoVillager | DemoPanchayat | DemoAshaWorker;

// ── PanchayatStats ────────────────────────────────────────────────────────────

export interface PanchayatStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
}

// ── Complaint stub (Phase 2 will expand) ─────────────────────────────────────

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  createdAt: string;
  villagerName: string;
  village: string;
  category?: string;
}
