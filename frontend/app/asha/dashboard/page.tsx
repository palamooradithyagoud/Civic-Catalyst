"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  isAshaWorker,
  setAshaSession,
  clearSession,
  DEMO_ASHA_WORKER,
} from "@/services/demoSession";
import type { DemoAshaWorker } from "@/types";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CivicLogo } from "@/components/CivicLogo";
import {
  fetchDashboardKPIs,
  fetchInventoryItems,
  createInventoryItem,
  restockInventoryItem,
  distributeInventoryItem,
  fetchTransactions,
  fetchDistributions,
  fetchAlerts,
  resolveAlert,
  fetchAnalytics,
  fetchCategories,
  fetchSuppliers,
  triggerReSeed,
  InventoryItem,
  InventoryTransaction,
  DistributionRecord,
  AlertItem,
  DashboardKPIs,
  AnalyticsData,
  Category,
  Supplier,
  MedicineRequest,
  fetchMedicineRequests,
  createMedicineRequestApi,
  updateMedicineRequestStatusApi,
} from "@/services/inventoryApi";

import {
  LayoutDashboard,
  Package,
  SendHorizontal,
  History,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  Bot,
  HeartPulse,
  LogOut,
  MapPin,
  HelpCircle,
  Settings,
  Pill,
  Syringe,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ChevronRight,
  X,
  Check,
  Globe,
  Home,
  Hospital,
  Truck,
  Building,
  Inbox,
  Megaphone,
} from "lucide-react";

export default function AshaInventoryDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoAshaWorker | null>(null);

  // Portal Mode State ("village" vs "mandal")
  const [portalMode, setPortalMode] = useState<"village" | "mandal">("village");
  const [selectedMandalVillage, setSelectedMandalVillage] = useState<string>("ALL");

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "mandal" | "inventory" | "distribute" | "history" | "alerts" | "analytics" | "transactions" | "mandal_req" | "vaccines"
  >("dashboard");

  // Language State (English, Hindi, Telugu)
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("asha_lang") as Language;
    if (saved && (saved === "en" || saved === "hi" || saved === "te")) {
      setLang(saved);
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode");
      if (modeParam === "mandal") {
        setPortalMode("mandal");
        setActiveTab("mandal");
      }
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("asha_lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Healthy": return t("statusHealthy");
      case "Low Stock": return t("statusLowStock");
      case "Out of Stock": return t("statusOutOfStock");
      case "Expiring Soon": return t("statusExpiringSoon");
      case "Expired": return t("statusExpired");
      default: return status;
    }
  };

  // Data Loading & Sync States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // API Data States
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicineRequests, setMedicineRequests] = useState<MedicineRequest[]>([]);

  // Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedArea, setSelectedArea] = useState<string>("ALL");

  // Modal States
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [isMandalReqOpen, setIsMandalReqOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<InventoryItem | null>(null);

  // Free-Text ASHA Medicine Request Form State
  const [freeTextReqForm, setFreeTextReqForm] = useState({
    medicine_name: "",
    requested_quantity: 100,
    unit: "Packets",
    urgency: "Normal" as "Normal" | "High" | "Urgent",
    reason: "",
    notes: "",
  });

  // Vaccine & Pulse Polio Drive State
  const [isRecordVaccineOpen, setIsRecordVaccineOpen] = useState(false);
  const [polioStats, setPolioStats] = useState({
    todayAdministered: 148,
    targetChildren: 160,
    activeCampaign: "National Pulse Polio Drive (NID)",
    coldChainTemp: "+4.2°C",
    bopvVials: 45,
    ipvVials: 30,
  });

  const [immunizationRecords, setImmunizationRecords] = useState([
    { id: "POLIO-2026-001", child_name: "Ananya Reddy", parent_name: "Suresh Reddy", age: "2 Yrs", ward: "Ward 3 Central Village", vaccine: "bOPV (Pulse Polio Drops)", dose: "Dose 3", status: "Given Today", administered_by: "Sunita Devi (ASHA)", finger_marked: true, time: "Today, 09:15 AM" },
    { id: "POLIO-2026-002", child_name: "Vivaan Sharma", parent_name: "Ramesh Sharma", age: "9 Months", ward: "Ward 1 North Block", vaccine: "bOPV + IPV (Polio Drops & Inj)", dose: "Dose 2 + IPV 1", status: "Given Today", administered_by: "Sunita Devi (ASHA)", finger_marked: true, time: "Today, 09:45 AM" },
    { id: "POLIO-2026-003", child_name: "Kavya Sri", parent_name: "Mahesh Kumar", age: "1.5 Yrs", ward: "Ward 2 East Block", vaccine: "bOPV (Pulse Polio Drops)", dose: "Dose 3", status: "Given Today", administered_by: "Sunita Devi (ASHA)", finger_marked: true, time: "Today, 10:20 AM" },
    { id: "POLIO-2026-004", child_name: "Rahul Varma", parent_name: "Venkat Varma", age: "3 Yrs", ward: "Ward 3 Central Village", vaccine: "bOPV (Pulse Polio Drops)", dose: "Booster 1", status: "Given Today", administered_by: "Sunita Devi (ASHA)", finger_marked: true, time: "Today, 11:05 AM" },
    { id: "POLIO-2026-005", child_name: "Karthik Goud", parent_name: "Shekar Goud", age: "4 Yrs", ward: "Ward 4 South Colony", vaccine: "bOPV (Pulse Polio Drops)", dose: "Booster 2", status: "Scheduled", administered_by: "Sunita Devi (ASHA)", finger_marked: false, time: "Scheduled 02:00 PM" },
  ]);

  const [newVaccineForm, setNewVaccineForm] = useState({
    child_name: "",
    parent_name: "",
    age: "2 Yrs",
    ward: "Ward 3 Central Village",
    vaccine: "bOPV (Pulse Polio Drops)",
    dose: "Dose 3",
    finger_marked: true,
    notes: "",
  });

  // Public Health Announcement Broadcast State
  const [isPostAnnouncementOpen, setIsPostAnnouncementOpen] = useState(false);
  const [ashaAnnouncements, setAshaAnnouncements] = useState([
    {
      id: "ANNC-2026-001",
      title: "📢 National Pulse Polio Drive Active Today!",
      category: "Polio Vaccination",
      location: "Ward 3 PHC Sub-Center & Door-to-Door",
      message: "Special Pulse Polio booth is active today. All children aged 0-5 years must receive 2 oral polio drops. ASHA workers are visiting homes.",
      priority: "Urgent",
      posted_by: "Sunita Devi (ASHA Worker)",
      created_at: "Today, 08:30 AM",
      unread: true,
    }
  ]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "📢 National Pulse Polio Drive Active Today!",
    category: "Polio Vaccination",
    location: "All Wards / Village PHC Sub-Center",
    message: "Special Pulse Polio booth is active today. All children aged 0-5 years must receive 2 oral polio drops. Please visit the local sub-center!",
    priority: "Urgent",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("civic_asha_announcements");
      if (stored) {
        setAshaAnnouncements(JSON.parse(stored));
      } else {
        localStorage.setItem("civic_asha_announcements", JSON.stringify(ashaAnnouncements));
      }
    } catch (e) {
      console.warn("Storage err", e);
    }
  }, []);

  // Mandal Decision Action Modal State
  const [mandalActionModal, setMandalActionModal] = useState<{
    targetReq: MedicineRequest | null;
    actionType: "PARTIAL" | "REJECT" | "DISPATCH" | null;
    approvedQty: number;
    dispatchedQty: number;
    notes: string;
  }>({
    targetReq: null,
    actionType: null,
    approvedQty: 0,
    dispatchedQty: 0,
    notes: "",
  });

  // Form States - New Item
  const [newItemForm, setNewItemForm] = useState({
    item_name: "",
    category_id: 1,
    unit: "Strips",
    current_quantity: 50,
    min_quantity: 15,
    max_quantity: 250,
    batch_number: "BAT-" + Math.floor(1000 + Math.random() * 9000),
    expiry_date: "2027-06-30",
    supplier_id: 1,
    notes: "",
  });

  // Form States - Restock
  const [restockForm, setRestockForm] = useState({
    item_id: 0,
    quantity: 50,
    batch_number: "",
    expiry_date: "",
    supplier_id: 1,
    reference: "PHC_REFILL_DOC",
    notes: "Restocked from District Warehouse",
  });

  // Form States - Distribute
  const [distributeForm, setDistributeForm] = useState({
    item_id: 0,
    quantity: 1,
    beneficiary_ref: "",
    area_village: "Ward 3",
    purpose: "Maternal ANC Care",
    notes: "",
  });
  const [distributeError, setDistributeError] = useState<string | null>(null);

  // Initial Session Check & Load
  useEffect(() => {
    let current = getSession();
    if (!current || !isAshaWorker(current)) {
      setAshaSession();
      current = DEMO_ASHA_WORKER;
    }
    setSession(current as DemoAshaWorker);
    loadAllData();
  }, []);

  // Show Toast Auto-dismiss
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load All Data from API
  const loadAllData = async () => {
    setLoading(true);
    setSyncing(true);
    try {
      const [kpiRes, itemRes, txRes, distRes, alertRes, analyticsRes, catRes, supRes, medReqRes] = await Promise.all([
        fetchDashboardKPIs(),
        fetchInventoryItems(),
        fetchTransactions(),
        fetchDistributions(),
        fetchAlerts(),
        fetchAnalytics(),
        fetchCategories(),
        fetchSuppliers(),
        fetchMedicineRequests(),
      ]);

      setKpis(kpiRes);
      setItems(itemRes);
      setTransactions(txRes);
      setDistributions(distRes);
      setAlerts(alertRes);
      setAnalytics(analyticsRes);
      setCategories(catRes);
      setSuppliers(supRes);
      setMedicineRequests(medReqRes);

      if (distributeForm.item_id === 0 && itemRes.length > 0) {
        setDistributeForm((prev) => ({ ...prev, item_id: itemRes[0].id }));
      }
    } catch (err: any) {
      console.error("Failed to load inventory data:", err);
      showToast(err.message || "Failed to load database records.", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  // Handle Create New Item Submit
  const handleCreateItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInventoryItem(newItemForm);
      showToast(`Successfully created item '${newItemForm.item_name}'.`);
      setIsAddItemOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Error creating inventory item", "error");
    }
  };

  // Handle Restock Submit
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockForm.item_id) return;
    try {
      await restockInventoryItem(restockForm);
      showToast(`Restock successful (+${restockForm.quantity} units).`);
      setIsRestockOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Error restocking item", "error");
    }
  };

  // Handle Distribute Submit
  const handleDistributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDistributeError(null);
    if (!distributeForm.item_id || !distributeForm.beneficiary_ref.trim()) {
      setDistributeError("Please specify a valid beneficiary reference or household ID.");
      return;
    }

    try {
      const res = await distributeInventoryItem(distributeForm);
      showToast(res.message);
      setIsDistributeOpen(false);
      setDistributeForm((prev) => ({ ...prev, beneficiary_ref: "", notes: "" }));
      loadAllData();
    } catch (err: any) {
      setDistributeError(err.message);
      showToast(err.message || "Distribution error", "error");
    }
  };

  // Quick Open Restock Modal for specific item
  const openRestockForItem = (item: InventoryItem) => {
    setSelectedItemForModal(item);
    setRestockForm({
      item_id: item.id,
      quantity: 30,
      batch_number: item.batch_number || "",
      expiry_date: item.expiry_date || "",
      supplier_id: item.supplier_id || 1,
      reference: "PHC_REFILL",
      notes: `Restocking for ${item.item_name}`,
    });
    setIsRestockOpen(true);
  };

  // Quick Open Distribute Modal for specific item
  const openDistributeForItem = (item: InventoryItem) => {
    setSelectedItemForModal(item);
    setDistributeForm({
      item_id: item.id,
      quantity: 1,
      beneficiary_ref: "",
      area_village: "Ward 3",
      purpose: "Maternal ANC Care",
      notes: "",
    });
    setDistributeError(null);
    setIsDistributeOpen(true);
  };

  // Medicine Request Workflow Handlers
  const handleApproveRequest = async (r: MedicineRequest) => {
    try {
      await updateMedicineRequestStatusApi(r.request_id, "APPROVE", r.requested_quantity);
      showToast("✓ Request " + r.request_id + " Approved for " + r.requested_quantity + " " + r.unit);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to approve request", "error");
    }
  };

  const handleDispatchRequest = async (r: MedicineRequest) => {
    try {
      const sendQty = r.approved_quantity > 0 ? r.approved_quantity : r.requested_quantity;
      await updateMedicineRequestStatusApi(r.request_id, "DISPATCH", sendQty, sendQty, "Dispatched from Mandal Depot");
      showToast("🚚 Dispatched " + sendQty + " " + r.unit + " of " + r.medicine_name + " to ASHA Worker!");
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch", "error");
    }
  };

  const handleMarkReceivedRequest = async (r: MedicineRequest) => {
    try {
      await updateMedicineRequestStatusApi(r.request_id, "MARK_RECEIVED");
      showToast("✓ Received " + r.dispatched_quantity + " " + r.unit + " of " + r.medicine_name + "! Village inventory updated.");
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to mark received", "error");
    }
  };

  // Filtered Inventory Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.item_id_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.batch_number && item.batch_number.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === "ALL" || item.category_id === selectedCategory;
      const matchesStatus =
        selectedStatus === "ALL" || item.status.toLowerCase().replace(/\s+/g, "_") === selectedStatus.toLowerCase();

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  // Sorted Medicine Requests (Pending & Newly created at TOP)
  const sortedMedicineRequests = useMemo(() => {
    const statusPriority: Record<string, number> = {
      PENDING: 1,
      UNDER_REVIEW: 1,
      NEW: 1,
      REQUESTED: 1,
      APPROVED: 2,
      PARTIALLY_APPROVED: 2,
      DISPATCHED: 3,
      RECEIVED: 4,
      REJECTED: 5,
    };
    return [...medicineRequests].sort((a, b) => {
      const statusA = (a.status || "").trim().toUpperCase();
      const statusB = (b.status || "").trim().toUpperCase();
      const prioA = statusPriority[statusA] ?? 99;
      const prioB = statusPriority[statusB] ?? 99;
      if (prioA !== prioB) return prioA - prioB;

      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA;
      }
      const numIdA = typeof a.id === "number" ? a.id : parseInt(String(a.id || "0").replace(/\D/g, "") || "0", 10);
      const numIdB = typeof b.id === "number" ? b.id : parseInt(String(b.id || "0").replace(/\D/g, "") || "0", 10);
      return numIdB - numIdA;
    });
  }, [medicineRequests]);

  // Selected Item for Distribute Form in Distribute Tab
  const selectedDistributeItem = useMemo(() => {
    return items.find((i) => i.id === distributeForm.item_id) || items[0];
  }, [items, distributeForm.item_id]);

  if (!session) return null;

  return (
    <div className="panchayat-shell" style={{ background: "#f8fafc", color: "#0f172a" }}>
      {/* ── TOAST NOTIFICATION BANNER ──────────────────────── */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1.25rem",
            borderRadius: "12px",
            background: toastMessage.type === "success" ? "#047857" : "#b91c1c",
            color: "white",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── SIDEBAR NAVIGATION ────────────────────────────── */}
      <aside className="panchayat-sidebar">
        {/* Brand Header */}
        <div className="sidebar-logo">
          <CivicLogo size="sm" />
          <div>
            <div className="sidebar-logo-name" style={{ fontSize: "1.05rem" }}>
              {portalMode === "mandal" ? "Mandal Health HQ" : t("systemTitle")}
            </div>
            <div className="sidebar-logo-version" style={{ color: portalMode === "mandal" ? "#0d9488" : "#059669", fontWeight: 700 }}>
              {portalMode === "mandal" ? "Central Hospital Depot" : t("subTitle")}
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <p className="sidebar-section-label">
          {portalMode === "mandal" ? "MANDAL HOSPITAL WORKSPACES" : t("inventoryWorkspaces")}
        </p>
        <nav className="sidebar-nav">
          {(portalMode === "mandal"
            ? [
                { id: "mandal", label: "ASHA Requests & Shortages", icon: Inbox, badge: medicineRequests.filter(r => r.status === "PENDING").length, alert: medicineRequests.filter(r => r.status === "PENDING").length > 0 },
                { id: "vaccines", label: "Vaccine Depot & Cold Chain", icon: Syringe, badge: polioStats.bopvVials + polioStats.ipvVials, alert: false },
                { id: "transactions", label: "Dispatched Delivery Logs", icon: Truck, badge: transactions.length },
                { id: "alerts", label: "Village Stock Alerts", icon: AlertTriangle, badge: alerts.length, alert: alerts.length > 0 },
              ]
            : [
                { id: "dashboard", label: t("navDashboard"), icon: LayoutDashboard, badge: null },
                { id: "vaccines", label: "Vaccines & Polio", icon: Syringe, badge: "Active", alert: true },
                { id: "mandal_req", label: "Request Medicine", icon: Inbox, badge: medicineRequests.filter(r => r.status === "PENDING" || r.status === "DISPATCHED").length, alert: medicineRequests.filter(r => r.status === "DISPATCHED").length > 0 },
                { id: "inventory", label: t("navInventory"), icon: Package, badge: items.length },
                { id: "distribute", label: t("navDistribute"), icon: SendHorizontal, badge: null },
                { id: "history", label: t("navHistory"), icon: History, badge: distributions.length },
                { id: "alerts", label: t("navAlerts"), icon: AlertTriangle, badge: alerts.length, alert: alerts.length > 0 },
                { id: "transactions", label: t("navTransactions"), icon: FileSpreadsheet, badge: transactions.length },
              ]
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`sidebar-nav-item${isActive ? " active" : ""}`}
                style={{ cursor: "pointer" }}
              >
                <Icon className="sidebar-nav-icon" />
                <span className="sidebar-nav-text">{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className="sidebar-nav-badge"
                    style={{
                      background: tab.alert ? "#fef2f2" : undefined,
                      color: tab.alert ? "#dc2626" : undefined,
                      border: tab.alert ? "1px solid #fca5a5" : undefined,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="sidebar-bottom">
          <div style={{ padding: "0.75rem", background: portalMode === "mandal" ? "#f0fdfa" : "#f0fdf4", borderRadius: "10px", border: portalMode === "mandal" ? "1px solid #99f6e4" : "1px solid #bbf7d0", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: portalMode === "mandal" ? "#0f766e" : "#047857" }}>
              {portalMode === "mandal" ? "Mandal Health Headquarters" : t("phcCenter")}
            </div>
            <div style={{ fontSize: "0.72rem", color: portalMode === "mandal" ? "#115e59" : "#166534" }}>
              {portalMode === "mandal" ? "Central Medical Depot · All Villages" : t("phcDepot")}
            </div>
          </div>
          <button
            className="sidebar-bottom-item danger"
            onClick={() => {
              clearSession();
              router.push("/");
            }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            <span className="sidebar-nav-text">{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN BODY CONTAINER ───────────────────────────── */}
      <div className="panchayat-body">
        {/* Top Header Bar */}
        <header className="panchayat-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0.875rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
              {activeTab === "dashboard" && (portalMode === "mandal" ? "Mandal Hospital HQ" : t("tabDashboard"))}
              {activeTab === "mandal" && "Mandal Hospital Office"}
              {activeTab === "vaccines" && "Vaccines & Pulse Polio Immunization Tracker"}
              {activeTab === "inventory" && t("tabInventory")}
              {activeTab === "distribute" && t("tabDistribute")}
              {activeTab === "history" && t("tabHistory")}
              {activeTab === "alerts" && t("tabAlerts")}
              {activeTab === "analytics" && t("tabAnalytics")}
              {activeTab === "transactions" && t("tabTransactions")}
            </div>

            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#047857",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              {t("liveSync")}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Language Selector Dropdown (Google Translation) */}
            <LanguageSelector onLanguageChange={(l) => setLang(l as Language)} />

            {/* Broadcast Announcement Button (ASHA Village Mode Only) */}
            {portalMode !== "mandal" && (
              <button
                onClick={() => setIsPostAnnouncementOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
                  color: "white",
                  border: "none",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(13,148,136,0.3)"
                }}
              >
                <Megaphone size={16} />
                <span>📢 Post Broadcast to Citizens</span>
              </button>
            )}

            {/* Portal Switcher Pill */}
            <button
              onClick={() => {
                if (portalMode === "mandal") {
                  setPortalMode("village");
                  setActiveTab("dashboard");
                } else {
                  setPortalMode("mandal");
                  setActiveTab("mandal");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: portalMode === "mandal" ? "#eff6ff" : "#ecfdf5",
                color: portalMode === "mandal" ? "#1d4ed8" : "#047857",
                border: portalMode === "mandal" ? "1px solid #bfdbfe" : "1px solid #a7f3d0",
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              {portalMode === "mandal" ? <Hospital size={16} /> : <UserCheck size={16} />}
              <span>{portalMode === "mandal" ? "Mode: Mandal Medical HQ" : "Mode: ASHA Village"}</span>
            </button>

            {/* Profile Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", paddingLeft: "0.5rem", borderLeft: "1px solid #e2e8f0" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#064e3b", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" }}>
                SD
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0f172a" }}>Sunita Devi</div>
                <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{t("wardInfo")}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="panchayat-content" style={{ padding: "1.5rem", position: "relative" }}>

          {/* DISPATCHED NOTIFICATION BANNER FOR ASHA WORKER */}
          {portalMode !== "mandal" && medicineRequests.filter(r => r.status === "DISPATCHED").length > 0 && (
            <div style={{ background: "linear-gradient(135deg, #059669, #047857)", borderRadius: "16px", padding: "1.25rem 1.5rem", color: "white", boxShadow: "0 10px 15px -3px rgba(4, 120, 87, 0.3)", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={24} style={{ color: "#6ee7b7" }} />
                    ✅ Your medicine request has been dispatched by Mandal Central Hospital!
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#a7f3d0", marginTop: "0.35rem", display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
                    {medicineRequests.filter(r => r.status === "DISPATCHED").map(r => (
                      <span key={r.id} style={{ background: "rgba(255,255,255,0.15)", padding: "0.3rem 0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)" }}>
                        <strong>{r.medicine_name}</strong> | Req ID: <code>{r.request_id}</code> | Approved: <strong>{r.approved_quantity}</strong> | Dispatched: <strong>{r.dispatched_quantity} {r.unit}</strong> | Date: {r.dispatch_date || r.updated_at}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("mandal_req")}
                  style={{ background: "#ffffff", color: "#047857", border: "none", padding: "0.55rem 1.1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 900, cursor: "pointer" }}
                >
                  View & Mark Received →
                </button>
              </div>
            </div>
          )}

          {/* ── TAB: MANDAL HOSPITAL OFFICE WORKSPACE ──────────────────────── */}
          {activeTab === "mandal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Mandal Hospital Header Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, #0f766e 0%, #064e3b 100%)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  color: "white",
                  boxShadow: "0 10px 30px rgba(15, 118, 110, 0.2)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      🏥 Mandal Health Headquarters
                    </span>
                    <span style={{ background: "#fef08a", color: "#854d0e", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800 }}>
                      Central Medical Stock Depot
                    </span>
                  </div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
                    Mandal Hospital & Health Office HQ
                  </h2>
                  <p style={{ fontSize: "0.82rem", opacity: 0.9, marginTop: "0.3rem" }}>
                    Centralized stock oversight across ALL villages under Mandal · 1-Click Village Automated Replenishment & Dispatch
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => {
                      setPortalMode("village");
                      setActiveTab("dashboard");
                    }}
                    style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "0.6rem 1rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <Home size={15} />
                    Switch to Village ASHA Portal
                  </button>
                </div>
              </div>

              {/* Mandal Overview KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <div style={{ background: "#eff6ff", padding: "1.2rem", borderRadius: "14px", border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1e40af" }}>📩 Pending ASHA Requests</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#1d4ed8", marginTop: "0.2rem" }}>
                    {medicineRequests.filter(r => r.status === "PENDING" || r.status === "UNDER_REVIEW").length} Requests
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: 700 }}>Awaiting Mandal Review & Approval</div>
                </div>

                <div style={{ background: "#fef2f2", padding: "1.2rem", borderRadius: "14px", border: "2px solid #fca5a5" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#991b1b" }}>⚠️ Village Out-of-Stock Items</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#dc2626", marginTop: "0.2rem" }}>
                    {items.filter(i => i.current_quantity === 0 || i.status === "Out of Stock").length} Shortages
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#b91c1c", fontWeight: 700 }}>Action Required: Deliver Stock from Mandal</div>
                </div>

                <div style={{ background: "#fffbe8", padding: "1.2rem", borderRadius: "14px", border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#92400e" }}>⚡ Village Low-Stock Warnings</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#d97706", marginTop: "0.2rem" }}>
                    {items.filter(i => i.status === "Low Stock").length} Items
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#b45309", fontWeight: 700 }}>Below Minimum Safety Level</div>
                </div>

                <div style={{ background: "#f0fdf4", padding: "1.2rem", borderRadius: "14px", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#166534" }}>📦 Total Deliveries Dispatched</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#047857", marginTop: "0.2rem" }}>
                    {transactions.filter(t => t.reference?.includes("MANDAL") || t.notes?.includes("Mandal") || t.notes?.includes("District")).length || transactions.length} Deliveries
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 700 }}>Mandal HQ → Village Sub-Centers</div>
                </div>
              </div>

              {/* ── SECTION: ASHA MEDICINE REQUESTS & MANDAL FULFILLMENT ── */}
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", border: "2px solid #bfdbfe", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #dbeafe", paddingBottom: "0.85rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Inbox size={22} style={{ color: "#2563eb" }} />
                      📥 ASHA Worker Medicine Requests (మండల్ మెడిసిన్ రిక్వెస్ట్‌లు)
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#3b82f6", marginTop: "0.2rem" }}>
                      Free-text supply requests submitted by ASHA workers across villages. Review, Approve custom quantities, and Dispatch.
                    </div>
                  </div>
                </div>

                {sortedMedicineRequests.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "0.85rem" }}>
                    No pending medicine requests from ASHA workers at this moment.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                      <thead>
                        <tr style={{ background: "#f0f9ff", borderBottom: "1px solid #bae6fd", color: "#0369a1", textAlign: "left" }}>
                          <th style={{ padding: "0.75rem 1rem" }}>Req ID</th>
                          <th style={{ padding: "0.75rem 1rem" }}>ASHA Worker & Village</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Medicine / Supply</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Requested Qty</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Approved / Dispatched</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Urgency</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Reason</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                          <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Mandal Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMedicineRequests.map((r) => {
                          const isPending = r.status === "PENDING" || r.status === "UNDER_REVIEW";
                          const isApproved = r.status === "APPROVED" || r.status === "PARTIALLY_APPROVED";
                          const isDispatched = r.status === "DISPATCHED";
                          const isReceived = r.status === "RECEIVED";
                          const isRejected = r.status === "REJECTED";

                          return (
                            <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#64748b", fontFamily: "monospace" }}>
                                {r.request_id}
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <div style={{ fontWeight: 800, color: "#0f172a" }}>{r.asha_worker_name || "Sunita Devi"}</div>
                                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Ward 3 & 4 Sub-Center</div>
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <div style={{ fontWeight: 800, color: "#0369a1" }}>{r.medicine_name}</div>
                                {r.notes && <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Note: {r.notes}</div>}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#0f172a" }}>
                                {r.requested_quantity} {r.unit}
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <div style={{ fontWeight: 800, color: "#047857" }}>
                                  Appr: {r.approved_quantity} {r.unit}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                                  Disp: {r.dispatched_quantity} {r.unit}
                                </div>
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <span style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "999px",
                                  background: r.urgency === "Urgent" ? "#fef2f2" : r.urgency === "High" ? "#fff7ed" : "#f0fdf4",
                                  color: r.urgency === "Urgent" ? "#dc2626" : r.urgency === "High" ? "#ea580c" : "#047857",
                                  border: r.urgency === "Urgent" ? "1px solid #fca5a5" : r.urgency === "High" ? "1px solid #ffedd5" : "1px solid #bbf7d0",
                                }}>
                                  {r.urgency || "Normal"}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                                {r.reason}
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <span style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  padding: "0.2rem 0.65rem",
                                  borderRadius: "999px",
                                  background: isPending ? "#fef3c7" : isApproved ? "#dbeafe" : isDispatched ? "#ecfdf5" : isReceived ? "#dcfce7" : "#fef2f2",
                                  color: isPending ? "#d97706" : isApproved ? "#1d4ed8" : isDispatched ? "#047857" : isReceived ? "#15803d" : "#dc2626",
                                  border: isPending ? "1px solid #fde68a" : isApproved ? "1px solid #bfdbfe" : isDispatched ? "1px solid #a7f3d0" : isReceived ? "1px solid #86efac" : "1px solid #fca5a5",
                                }}>
                                  {r.status.replace("_", " ")}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleApproveRequest(r)}
                                        style={{ background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "0.3rem 0.55rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer" }}
                                      >
                                        ✓ Approve
                                      </button>

                                      <button
                                        onClick={() => {
                                          setMandalActionModal({
                                            targetReq: r,
                                            actionType: "PARTIAL",
                                            approvedQty: Math.floor(r.requested_quantity * 0.8),
                                            dispatchedQty: 0,
                                            notes: "Stock constraint at Mandal HQ - Partial approval",
                                          });
                                        }}
                                        style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #ffedd5", padding: "0.3rem 0.55rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer" }}
                                      >
                                        ⚡ Partial
                                      </button>

                                      <button
                                        onClick={() => {
                                          setMandalActionModal({
                                            targetReq: r,
                                            actionType: "REJECT",
                                            approvedQty: 0,
                                            dispatchedQty: 0,
                                            notes: "Item out of stock at Mandal Depot",
                                          });
                                        }}
                                        style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "0.3rem 0.55rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer" }}
                                      >
                                        ❌ Reject
                                      </button>
                                    </>
                                  )}

                                  {(isPending || isApproved) && !isDispatched && !isReceived && !isRejected && (
                                    <button
                                      onClick={() => handleDispatchRequest(r)}
                                      style={{ background: "#047857", color: "white", border: "none", padding: "0.35rem 0.7rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                    >
                                      🚚 Send / Dispatch
                                    </button>
                                  )}

                                  {(isDispatched || isReceived) && (
                                    <span style={{ fontSize: "0.72rem", color: "#047857", fontWeight: 800 }}>
                                      ✅ Dispatched ({r.dispatched_quantity} {r.unit})
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 1: VILLAGE STOCK SHORTAGES & MANDAL DELIVERY ACTION */}
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", border: "2px solid #fca5a5", boxShadow: "0 4px 14px rgba(220, 38, 38, 0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #fecdd3", paddingBottom: "0.85rem" }}>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#991b1b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <AlertTriangle size={22} style={{ color: "#dc2626" }} />
                      🚨 Village Medical Stock Shortages & Required Deliveries
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#7f1d1d", marginTop: "0.2rem" }}>
                      Real-time inventory shortages reported by village sub-centers. Click <strong>Deliver Stock to Village</strong> to update village inventory from Mandal Hospital.
                    </div>
                  </div>
                </div>

                {items.filter(i => i.current_quantity === 0 || i.status === "Out of Stock" || i.status === "Low Stock").length === 0 ? (
                  <div style={{ padding: "2rem", textTransform: "none", textAlign: "center", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                    <CheckCircle2 size={32} style={{ color: "#047857", margin: "0 auto 0.5rem auto" }} />
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#047857" }}>All Village Sub-Centers are Fully Stocked!</div>
                    <div style={{ fontSize: "0.78rem", color: "#166534", marginTop: "0.25rem" }}>No current shortages or out-of-stock items reported across villages in the Mandal.</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "1rem" }}>
                    {items
                      .filter(i => i.current_quantity === 0 || i.status === "Out of Stock" || i.status === "Low Stock")
                      .map(item => (
                        <div key={item.id} style={{ background: item.current_quantity === 0 ? "#fff5f5" : "#fffbeb", padding: "1.1rem", borderRadius: "14px", border: item.current_quantity === 0 ? "2px solid #fca5a5" : "1px solid #fde68a", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "0.85rem" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{item.item_name}</div>
                                <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.15rem" }}>Code: <strong>{item.item_id_code}</strong> · {item.category_name}</div>
                              </div>
                              <span style={{ fontSize: "0.68rem", fontWeight: 900, padding: "0.2rem 0.55rem", borderRadius: "999px", background: item.current_quantity === 0 ? "#fef2f2" : "#fef3c7", color: item.current_quantity === 0 ? "#dc2626" : "#b45309", border: item.current_quantity === 0 ? "1px solid #fca5a5" : "1px solid #fde68a" }}>
                                {item.current_quantity === 0 ? "⚠️ OUT OF STOCK" : "⚡ LOW STOCK"}
                              </span>
                            </div>

                            <div style={{ background: "rgba(255,255,255,0.7)", padding: "0.6rem 0.75rem", borderRadius: "8px", marginTop: "0.6rem", border: "1px solid rgba(0,0,0,0.05)" }}>
                              <div style={{ fontSize: "0.75rem", color: "#475569", display: "flex", justifyContent: "space-between" }}>
                                <span>Target Location:</span>
                                <strong style={{ color: "#0f172a" }}>Ward 3 & 4 Sub-Center</strong>
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#475569", display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                                <span>Current Village Stock:</span>
                                <strong style={{ color: item.current_quantity === 0 ? "#dc2626" : "#d97706", fontSize: "0.95rem" }}>{item.current_quantity} {item.unit}</strong>
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#475569", display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                                <span>Minimum Requirement:</span>
                                <strong>{item.min_quantity} {item.unit}</strong>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                await restockInventoryItem({
                                  item_id: item.id,
                                  quantity: 50,
                                  batch_number: item.batch_number || "BAT-MANDAL-2026",
                                  expiry_date: item.expiry_date || "2027-12-31",
                                  supplier_id: item.supplier_id || 1,
                                  reference: "MANDAL_HQ_DISPATCH",
                                  notes: `Delivered 50 ${item.unit} from Mandal Hospital HQ to Village Sub-Center`,
                                });
                                showToast(`✓ Delivery Completed! Mandal Hospital successfully delivered 50 ${item.unit} of ${item.item_name} to Village Sub-Center.`);
                                loadAllData();
                              } catch (err: any) {
                                showToast(err.message || "Failed to deliver stock from Mandal HQ", "error");
                              }
                            }}
                            style={{ background: "#047857", color: "white", border: "none", padding: "0.65rem 0.9rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", width: "100%", boxShadow: "0 2px 6px rgba(4,120,87,0.25)" }}
                          >
                            🚚 Deliver 50 Units from Mandal Hospital to Village
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: DISPATCHED & DELIVERED SUPPLIES HISTORY */}
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Truck size={20} style={{ color: "#047857" }} />
                      Dispatched & Delivered Supplies Log (Mandal Hospital HQ → Villages)
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                      Complete delivery audit trail of medical stock dispatched from Mandal Central Hospital to Village Health Sub-Centers
                    </div>
                  </div>

                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "0.25rem 0.65rem", borderRadius: "999px" }}>
                    ✓ Delivery Sync Live
                  </span>
                </div>

                {/* Delivery Log Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase", fontSize: "0.7rem", color: "#64748b", fontWeight: 800 }}>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "left" }}>Delivery Ref</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "left" }}>Medical Item</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "left" }}>Recipient Village Sub-Center</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>Delivered Quantity</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>Date & Time</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "right" }}>Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8" }}>
                            No delivery transactions logged yet. Click 'Deliver Stock to Village' above to initiate a dispatch.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#047857" }}>{tx.transaction_id_code}</td>
                            <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#0f172a" }}>{tx.item_name}</td>
                            <td style={{ padding: "0.75rem 0.85rem", color: "#475569", fontWeight: 600 }}>Ward 3 & 4 Village Sub-Center</td>
                            <td style={{ padding: "0.75rem 0.85rem", textAlign: "center", fontWeight: 800, color: "#047857" }}>+{tx.quantity} Units</td>
                            <td style={{ padding: "0.75rem 0.85rem", textAlign: "center", color: "#64748b" }}>{tx.date}</td>
                            <td style={{ padding: "0.75rem 0.85rem", textAlign: "right" }}>
                              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                                ✓ Delivered & Stocked
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 1: DASHBOARD OVERVIEW ──────────────────────── */}
          {activeTab === "dashboard" && portalMode === "village" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* 7 KPI Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                {[
                  { label: t("kpiTotalItems"), val: kpis?.total_items || 0, sub: t("kpiTotalItemsSub"), icon: Package, color: "#0284c7", bg: "#f0f9ff" },
                  { label: t("kpiTotalUnits"), val: kpis?.total_stock_units || 0, sub: t("kpiTotalUnitsSub"), icon: Layers, color: "#059669", bg: "#ecfdf5" },
                  { label: t("kpiLowStock"), val: kpis?.low_stock_count || 0, sub: t("kpiLowStockSub"), icon: AlertTriangle, color: "#d97706", bg: "#fffbe8" },
                  { label: t("kpiOutOfStock"), val: kpis?.out_of_stock_count || 0, sub: t("kpiOutOfStockSub"), icon: XCircle, color: "#dc2626", bg: "#fef2f2" },
                  { label: t("kpiDistributed30"), val: kpis?.total_distributed_30days || 0, sub: t("kpiDistributed30Sub"), icon: SendHorizontal, color: "#7c3aed", bg: "#f5f3ff" },
                  { label: t("kpiExpiringSoon"), val: (kpis?.expiring_soon_count || 0) + (kpis?.expired_count || 0), sub: t("kpiExpiringSoonSub"), icon: Clock, color: "#ea580c", bg: "#fff7ed" },
                  { label: t("kpiActiveAlerts"), val: alerts.length, sub: t("kpiActiveAlertsSub"), icon: ShieldAlert, color: "#e11d48", bg: "#fff1f2" },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        padding: "1.1rem",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>{kpi.label}</span>
                        <div style={{ width: 32, height: 32, borderRadius: "8px", background: kpi.bg, color: kpi.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={18} />
                        </div>
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", lineHeight: "1" }}>{kpi.val}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{kpi.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions Bar */}
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{t("quickActions")}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Common stock management shortcuts for field health operations</div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setIsAddItemOpen(true)}
                    style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", padding: "0.6rem 1rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                  >
                    <Plus size={16} />
                    <span>+ {t("btnAddNew")}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("distribute")}
                    style={{ background: "#047857", color: "white", border: "none", padding: "0.6rem 1rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                  >
                    <SendHorizontal size={16} />
                    <span>↓ {t("btnDistribute")}</span>
                  </button>
                  <button
                    onClick={async () => {
                      await triggerReSeed();
                      showToast(t("toastReseedSuccess"));
                      loadAllData();
                    }}
                    style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", padding: "0.6rem 1rem", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                  >
                    <RefreshCw size={16} />
                    <span>{t("reseedData")}</span>
                  </button>
                </div>
              </div>

              {/* Grid Layout: Critical Alerts & Top Supplies */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {/* Critical Alert Banners */}
                <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#991b1b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <AlertTriangle size={18} />
                      {t("sectionRecentAlerts")} ({alerts.length})
                    </div>
                    <button onClick={() => setActiveTab("alerts")} style={{ fontSize: "0.75rem", fontWeight: 700, color: "#047857", background: "none", border: "none", cursor: "pointer" }}>
                      {t("viewAllAlerts")}
                    </button>
                  </div>

                  {alerts.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "#047857", background: "#f0fdf4", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600 }}>
                      ✅ {t("noAlerts")}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {alerts.slice(0, 4).map((alert) => (
                        <div
                          key={alert.id}
                          style={{
                            padding: "0.75rem 1rem",
                            borderRadius: "10px",
                            background: alert.severity === "CRITICAL" ? "#fef2f2" : "#fffbe8",
                            border: alert.severity === "CRITICAL" ? "1px solid #fca5a5" : "1px solid #fde68a",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: alert.severity === "CRITICAL" ? "#991b1b" : "#92400e" }}>
                              {alert.item_name}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: alert.severity === "CRITICAL" ? "#b91c1c" : "#b45309", marginTop: "0.2rem" }}>
                              {alert.message}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              await resolveAlert(alert.id);
                              showToast(t("toastAlertResolved"));
                              loadAllData();
                            }}
                            style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.2rem 0.5rem", fontSize: "0.68rem", fontWeight: 700, color: "#475569", cursor: "pointer", flexShrink: 0 }}
                          >
                            {t("btnResolve")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Critical Items Needing Restock */}
                <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                      {t("sectionLowStockRefill")}
                    </div>
                    <button onClick={() => setActiveTab("inventory")} style={{ fontSize: "0.75rem", fontWeight: 700, color: "#047857", background: "none", border: "none", cursor: "pointer" }}>
                      {t("viewCatalog")}
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {items
                      .filter((i) => i.current_quantity <= i.min_quantity)
                      .slice(0, 4)
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: "0.65rem 0.85rem",
                            borderRadius: "10px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>{item.item_name}</div>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                              {item.category_name} · {t("minThreshold")}: {item.min_quantity} {item.unit}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                padding: "0.2rem 0.5rem",
                                borderRadius: "999px",
                                background: item.current_quantity === 0 ? "#fef2f2" : "#fffbe8",
                                color: item.current_quantity === 0 ? "#dc2626" : "#d97706",
                                border: item.current_quantity === 0 ? "1px solid #fca5a5" : "1px solid #fde68a",
                              }}
                            >
                              {item.current_quantity} {item.unit}
                            </span>
                            <button
                              onClick={() => openRestockForItem(item)}
                              style={{ background: "#047857", color: "white", border: "none", borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                            >
                              {t("btnRefill")}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Recent Field Distribution Stream */}
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
                  {t("sectionRecentDistributions")}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                        <th style={{ padding: "0.6rem 0.75rem" }}>{t("colDate")}</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>{t("colItemName")}</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>{t("colQty")}</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>{t("colBeneficiary")}</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>{t("colVillage")}</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>{t("colPurpose")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributions.slice(0, 6).map((dist) => (
                        <tr key={dist.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.6rem 0.75rem", color: "#64748b", fontWeight: 600 }}>{dist.date}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontWeight: 800, color: "#0f172a" }}>{dist.item_name}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontWeight: 800, color: "#047857" }}>
                            {dist.quantity} {dist.unit}
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: "#334155" }}>{dist.beneficiary_ref}</td>
                          <td style={{ padding: "0.6rem 0.75rem", color: "#64748b" }}>{dist.area_village}</td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>
                            <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#047857", padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>
                              {dist.purpose}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: INVENTORY MASTER CATALOG ───────────────── */}
          {activeTab === "inventory" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Header & Controls Bar */}
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{t("catalogTitle")}</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {t("catalogSub")} ({filteredItems.length})
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddItemOpen(true)}
                    style={{ background: "#047857", color: "white", border: "none", padding: "0.6rem 1.1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                  >
                    <Plus size={16} />
                    <span>+ {t("btnAddNew")}</span>
                  </button>
                </div>

                {/* Filter Controls Row */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem" }}>
                  {/* Search Bar */}
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.25rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none" }}
                    />
                  </div>

                  {/* Category Dropdown */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white" }}
                  >
                    <option value="ALL">{t("filterCategory")} ({categories.length})</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {/* Status Dropdown */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white" }}
                  >
                    <option value="ALL">{t("filterStatus")}</option>
                    <option value="healthy">{t("statusHealthy")}</option>
                    <option value="low_stock">{t("statusLowStock")}</option>
                    <option value="out_of_stock">{t("statusOutOfStock")}</option>
                    <option value="expiring_soon">{t("statusExpiringSoon")}</option>
                    <option value="expired">{t("statusExpired")}</option>
                  </select>
                </div>
              </div>

              {/* Master Inventory Table */}
              <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colItemCode")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colItemName")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colCategory")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colStock")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colBatch")} & {t("colExpiry")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colStatus")}</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{t("colActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                            {t("noData")}
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => {
                          const isOut = item.current_quantity === 0;
                          const isLow = item.current_quantity > 0 && item.current_quantity <= item.min_quantity;
                          const isExpired = item.status === "Expired";
                          const isExpiring = item.status === "Expiring Soon";

                          return (
                            <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#64748b", fontFamily: "monospace" }}>
                                {item.item_id_code}
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.item_name}</div>
                                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Supplier: {item.supplier_name || "Depot"}</div>
                              </td>
                              <td style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: 600 }}>{item.category_name}</td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <div style={{ fontWeight: 800, color: isOut ? "#dc2626" : isLow ? "#d97706" : "#047857" }}>
                                  {item.current_quantity} {item.unit}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                                  Min: {item.min_quantity} | Max: {item.max_quantity}
                                </div>
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <div style={{ fontWeight: 600, color: "#334155" }}>{item.batch_number || "N/A"}</div>
                                <div style={{ fontSize: "0.7rem", color: isExpired ? "#dc2626" : isExpiring ? "#ea580c" : "#64748b", fontWeight: isExpired || isExpiring ? 700 : 400 }}>
                                  Exp: {item.expiry_date || "N/A"}
                                </div>
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "999px",
                                    background: isOut ? "#fef2f2" : isLow ? "#fffbe8" : isExpired ? "#fef2f2" : isExpiring ? "#fff7ed" : "#ecfdf5",
                                    color: isOut ? "#dc2626" : isLow ? "#d97706" : isExpired ? "#b91c1c" : isExpiring ? "#ea580c" : "#047857",
                                    border: isOut ? "1px solid #fca5a5" : isLow ? "1px solid #fde68a" : isExpired ? "1px solid #fca5a5" : isExpiring ? "1px solid #ffedd5" : "1px solid #a7f3d0",
                                  }}
                                >
                                  {getStatusLabel(item.status)}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => openRestockForItem(item)}
                                    style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", borderRadius: "6px", padding: "0.3rem 0.6rem", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}
                                  >
                                    + {t("btnRestock")}
                                  </button>
                                  <button
                                    disabled={isOut || isExpired}
                                    onClick={() => openDistributeForItem(item)}
                                    style={{
                                      background: isOut || isExpired ? "#f1f5f9" : "#047857",
                                      color: isOut || isExpired ? "#94a3b8" : "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      padding: "0.3rem 0.6rem",
                                      fontSize: "0.72rem",
                                      fontWeight: 700,
                                      cursor: isOut || isExpired ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    ↓ {t("btnDistribute")}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: DISTRIBUTE SUPPLIES FORM ────────────────── */}
          {activeTab === "distribute" && (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <SendHorizontal size={22} style={{ color: "#047857" }} />
                    {t("distributeTitle")}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
                    {t("distributeSub")}
                  </div>
                </div>

                {distributeError && (
                  <div style={{ padding: "0.875rem 1rem", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: "0.8rem", fontWeight: 700, marginBottom: "1.25rem" }}>
                    ⚠️ {distributeError}
                  </div>
                )}

                <form onSubmit={handleDistributeSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Select Supply Item */}
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.4rem" }}>
                      {t("selectSupplyToIssue")}
                    </label>
                    <select
                      value={distributeForm.item_id}
                      onChange={(e) => {
                        setDistributeForm((prev) => ({ ...prev, item_id: Number(e.target.value) }));
                        setDistributeError(null);
                      }}
                      style={{ width: "100%", padding: "0.65rem 0.875rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", background: "white" }}
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.item_name} ({i.current_quantity} {i.unit} left) — [{getStatusLabel(i.status)}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Item Stock & Expiry Balance Card */}
                  {selectedDistributeItem && (
                    <div
                      style={{
                        padding: "1rem",
                        borderRadius: "12px",
                        background: selectedDistributeItem.current_quantity === 0 ? "#fef2f2" : "#f0fdf4",
                        border: selectedDistributeItem.current_quantity === 0 ? "1px solid #fca5a5" : "1px solid #bbf7d0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>{selectedDistributeItem.item_name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          Category: {selectedDistributeItem.category_name} | Batch: {selectedDistributeItem.batch_number || "N/A"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: selectedDistributeItem.current_quantity === 0 ? "#dc2626" : "#047857" }}>
                          {selectedDistributeItem.current_quantity} {selectedDistributeItem.unit} {t("availableStock")}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: selectedDistributeItem.status === "Expired" ? "#dc2626" : "#64748b" }}>
                          Expiry: {selectedDistributeItem.expiry_date || "N/A"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity & Household Reference */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.4rem" }}>
                        {t("qtyToIssue")}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selectedDistributeItem?.current_quantity || 100}
                        value={distributeForm.quantity}
                        onChange={(e) => setDistributeForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.4rem" }}>
                        {t("beneficiaryRefLabel")}
                      </label>
                      <input
                        type="text"
                        placeholder={t("beneficiaryRefPlaceholder")}
                        value={distributeForm.beneficiary_ref}
                        onChange={(e) => setDistributeForm((prev) => ({ ...prev, beneficiary_ref: e.target.value }))}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
                      />
                    </div>
                  </div>

                  {/* Ward & Purpose */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.4rem" }}>
                        {t("villageAreaLabel")}
                      </label>
                      <select
                        value={distributeForm.area_village}
                        onChange={(e) => setDistributeForm((prev) => ({ ...prev, area_village: e.target.value }))}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", background: "white" }}
                      >
                        <option value="Ward 1">Ward 1 (North Block)</option>
                        <option value="Ward 2">Ward 2 (East Block)</option>
                        <option value="Ward 3">Ward 3 (Central Village)</option>
                        <option value="Ward 4">Ward 4 (South Colony)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.4rem" }}>
                        {t("purposeLabel")}
                      </label>
                      <select
                        value={distributeForm.purpose}
                        onChange={(e) => setDistributeForm((prev) => ({ ...prev, purpose: e.target.value }))}
                        style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", background: "white" }}
                      >
                        <option value="Maternal ANC Care">{t("purposeMch")}</option>
                        <option value="Infant Immunization & Health">{t("purposeImm")}</option>
                        <option value="Child Health & Nutrition">{t("purposeChild")}</option>
                        <option value="Emergency Aid">{t("purposeEmg")}</option>
                        <option value="Routine Field Visit">{t("purposeRtn")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.4rem" }}>
                      {t("notesLabel")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("notesPlaceholder")}
                      value={distributeForm.notes}
                      onChange={(e) => setDistributeForm((prev) => ({ ...prev, notes: e.target.value }))}
                      style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!selectedDistributeItem || selectedDistributeItem.current_quantity === 0 || selectedDistributeItem.status === "Expired"}
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.85rem",
                      borderRadius: "12px",
                      background: selectedDistributeItem?.current_quantity === 0 || selectedDistributeItem?.status === "Expired" ? "#cbd5e1" : "#047857",
                      color: "white",
                      border: "none",
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      cursor: selectedDistributeItem?.current_quantity === 0 || selectedDistributeItem?.status === "Expired" ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 14px rgba(4, 120, 87, 0.2)",
                    }}
                  >
                    <SendHorizontal size={18} />
                    <span>{t("btnConfirmDistribute")}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB 4: DISTRIBUTION HISTORY ───────────────────── */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{t("historyTitle")}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {t("historySub")} ({distributions.length})
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none", background: "white" }}
                  >
                    <option value="ALL">All Wards / Villages</option>
                    <option value="Ward 1">Ward 1</option>
                    <option value="Ward 2">Ward 2</option>
                    <option value="Ward 3">Ward 3</option>
                    <option value="Ward 4">Ward 4</option>
                  </select>
                </div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem 1rem" }}>Record ID</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colDate")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colItemName")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colQty")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colBeneficiary")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colVillage")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colPurpose")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colRef")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributions
                        .filter((d) => selectedArea === "ALL" || d.area_village === selectedArea)
                        .map((dist) => (
                          <tr key={dist.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#64748b", fontFamily: "monospace" }}>
                              #DST-{dist.id}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: 600 }}>{dist.date}</td>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#0f172a" }}>{dist.item_name}</td>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#047857" }}>
                              {dist.quantity} {dist.unit}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#1e293b" }}>{dist.beneficiary_ref}</td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{dist.area_village}</td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <span style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>
                                {dist.purpose}
                              </span>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.75rem" }}>{dist.notes || "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: ALERTS CENTER ──────────────────────────── */}
          {activeTab === "alerts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{t("alertsTitle")}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {t("alertsSub")} ({alerts.length})
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
                {alerts.map((alert) => {
                  const targetItem = items.find((i) => i.id === alert.item_id);
                  return (
                    <div
                      key={alert.id}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        padding: "1.25rem",
                        border: alert.severity === "CRITICAL" ? "1px solid #fca5a5" : "1px solid #fde68a",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "999px",
                            background: alert.severity === "CRITICAL" ? "#fef2f2" : "#fffbe8",
                            color: alert.severity === "CRITICAL" ? "#dc2626" : "#d97706",
                            border: alert.severity === "CRITICAL" ? "1px solid #fca5a5" : "1px solid #fde68a",
                          }}
                        >
                          {alert.alert_type} · {alert.severity}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{alert.created_at.split(" ")[0]}</span>
                      </div>

                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>{alert.item_name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#334155", lineHeight: "1.4" }}>{alert.message}</div>

                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                        {targetItem && (
                          <button
                            onClick={() => openRestockForItem(targetItem)}
                            style={{ flex: 1, background: "#047857", color: "white", border: "none", borderRadius: "8px", padding: "0.45rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            + {t("btnRestock")}
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            await resolveAlert(alert.id);
                            showToast(t("toastAlertResolved"));
                            loadAllData();
                          }}
                          style={{ background: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "8px", padding: "0.45rem 0.75rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          {t("btnResolve")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 6: ANALYTICS & TRENDS ─────────────────────── */}
          {activeTab === "analytics" && analytics && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{t("analyticsTitle")}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{t("analyticsSub")}</div>
              </div>

              {/* Grid: Category Breakdown & Top Distributed */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                {/* Category Stock Breakdown */}
                <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
                    {t("catAllocation")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {analytics.category_breakdown.map((cat, idx) => (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                          <span>{cat.category}</span>
                          <span>
                            {cat.total_quantity} units ({cat.item_count} items)
                          </span>
                        </div>
                        <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, (cat.total_quantity / 500) * 100)}%`, height: "100%", background: "#047857" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 5 Distributed Supplies */}
                <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
                    {t("topItems")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {analytics.top_distributed_items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem", background: "#f8fafc", borderRadius: "8px" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>
                          {idx + 1}. {item.item_name}
                        </div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#047857" }}>
                          {item.total_distributed} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Distribution Purpose Breakdown */}
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginBottom: "1rem" }}>
                  {t("purposeBreakdown")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  {analytics.distribution_by_purpose.map((purp, idx) => (
                    <div key={idx} style={{ padding: "0.85rem", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#047857" }}>{purp.purpose}</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#064e3b", marginTop: "0.2rem" }}>
                        {purp.total_quantity} units
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#166534" }}>{purp.record_count} distribution events</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 7: IMMUTABLE AUDIT LOG ─────────────────────── */}
          {activeTab === "transactions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{t("auditTitle")}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {t("auditSub")} ({transactions.length})
                  </div>
                </div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem 1rem" }}>TX Code</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colDate")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colItemName")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colTxType")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colQty")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colPrevNew")}</th>
                        <th style={{ padding: "0.75rem 1rem" }}>{t("colRef")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const isIn = tx.transaction_type === "STOCK_IN";
                        const isDist = tx.transaction_type === "DISTRIBUTION";
                        return (
                          <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#64748b", fontFamily: "monospace" }}>
                              {tx.transaction_id_code}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>{tx.date}</td>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#0f172a" }}>{tx.item_name}</td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "999px",
                                  background: isIn ? "#ecfdf5" : isDist ? "#f0f9ff" : "#fffbe8",
                                  color: isIn ? "#047857" : isDist ? "#0284c7" : "#d97706",
                                  border: isIn ? "1px solid #a7f3d0" : isDist ? "1px solid #bae6fd" : "1px solid #fde68a",
                                }}
                              >
                                {tx.transaction_type}
                              </span>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: isIn ? "#047857" : "#dc2626" }}>
                              {isIn ? `+${tx.quantity}` : `-${tx.quantity}`}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: 600 }}>
                              {tx.previous_quantity} → {tx.new_quantity}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.75rem" }}>
                              {tx.reference || "N/A"} — {tx.notes || ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 7: MANDAL HQ REQUESTS & TRACKING (MY REQUESTS) ── */}
          {activeTab === "mandal_req" && portalMode === "village" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Header & Controls Bar */}
              <div style={{ background: "#ffffff", borderRadius: "14px", padding: "1.25rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Inbox size={22} style={{ color: "#047857" }} />
                    My Medicine Requisitions from Mandal HQ (నా మందుల రిక్వెస్ట్‌లు)
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Request any medicine or health supply directly from Mandal Medical HQ and track real-time dispatch status.
                  </div>
                </div>

                <button
                  onClick={() => setIsMandalReqOpen(true)}
                  style={{ background: "#047857", color: "white", border: "none", padding: "0.65rem 1.25rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", boxShadow: "0 2px 8px rgba(4,120,87,0.25)" }}
                >
                  <Plus size={18} />
                  <span>+ Request Medicine (నూతన రిక్వెస్ట్ చేయండి)</span>
                </button>
              </div>

              {/* My Requests Stream Table */}
              <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem 1rem" }}>Request ID</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Medicine / Supply</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Requested Qty</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Approved / Dispatched</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Urgency</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Reason</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Date</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMedicineRequests.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                            No medicine requisitions submitted yet. Click <strong>+ Request Medicine</strong> above to create a new requisition.
                          </td>
                        </tr>
                      ) : (
                        sortedMedicineRequests.map((r) => {
                          const isPending = r.status === "PENDING" || r.status === "UNDER_REVIEW";
                          const isApproved = r.status === "APPROVED" || r.status === "PARTIALLY_APPROVED";
                          const isDispatched = r.status === "DISPATCHED";
                          const isReceived = r.status === "RECEIVED";
                          const isRejected = r.status === "REJECTED";

                          return (
                            <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#64748b", fontFamily: "monospace" }}>
                                {r.request_id}
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <div style={{ fontWeight: 800, color: "#0f172a" }}>{r.medicine_name}</div>
                                {r.notes && <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Note: {r.notes}</div>}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#0f172a" }}>
                                {r.requested_quantity} {r.unit}
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <div style={{ fontWeight: 800, color: "#047857" }}>
                                  Appr: {r.approved_quantity} {r.unit}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                                  Disp: {r.dispatched_quantity} {r.unit}
                                </div>
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <span style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "999px",
                                  background: r.urgency === "Urgent" ? "#fef2f2" : r.urgency === "High" ? "#fff7ed" : "#f0fdf4",
                                  color: r.urgency === "Urgent" ? "#dc2626" : r.urgency === "High" ? "#ea580c" : "#047857",
                                  border: r.urgency === "Urgent" ? "1px solid #fca5a5" : r.urgency === "High" ? "1px solid #ffedd5" : "1px solid #bbf7d0",
                                }}>
                                  {r.urgency || "Normal"}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                                {r.reason}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.75rem" }}>
                                {r.created_at.split(" ")[0]}
                              </td>
                              <td style={{ padding: "0.75rem 1rem" }}>
                                <span style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  padding: "0.2rem 0.65rem",
                                  borderRadius: "999px",
                                  background: isPending ? "#fef3c7" : isApproved ? "#dbeafe" : isDispatched ? "#ecfdf5" : isReceived ? "#dcfce7" : "#fef2f2",
                                  color: isPending ? "#d97706" : isApproved ? "#1d4ed8" : isDispatched ? "#047857" : isReceived ? "#15803d" : "#dc2626",
                                  border: isPending ? "1px solid #fde68a" : isApproved ? "1px solid #bfdbfe" : isDispatched ? "1px solid #a7f3d0" : isReceived ? "1px solid #86efac" : "1px solid #fca5a5",
                                }}>
                                  {r.status.replace("_", " ")}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                {isDispatched && (
                                  <button
                                    onClick={() => handleMarkReceivedRequest(r)}
                                    style={{ background: "#047857", color: "white", border: "none", padding: "0.4rem 0.75rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                                  >
                                    ✓ Mark Received
                                  </button>
                                )}
                                {isReceived && (
                                  <span style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 800 }}>
                                    ✓ Stock Received
                                  </span>
                                )}
                                {isPending && (
                                  <span style={{ fontSize: "0.72rem", color: "#d97706", fontWeight: 700 }}>
                                    ⏳ Awaiting Mandal
                                  </span>
                                )}
                                {isRejected && (
                                  <span style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 700 }}>
                                    ❌ Rejected
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {/* ── TAB 8: VACCINES & PULSE POLIO TRACKER ──────────────────────── */}
          {activeTab === "vaccines" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Header Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  color: "white",
                  boxShadow: "0 10px 30px rgba(13, 148, 136, 0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <span style={{ background: "rgba(255,255,255,0.2)", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>
                      💉 Universal Immunization Program (UIP)
                    </span>
                    <span style={{ background: "#fef08a", color: "#854d0e", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800 }}>
                      🟢 National Pulse Polio Drive Active
                    </span>
                  </div>
                  <h2 style={{ fontSize: "1.45rem", fontWeight: 900, margin: 0 }}>
                    Vaccines & Pulse Polio Campaign Tracker (టీకాలు & పోలియో చుక్కల పోర్టల్)
                  </h2>
                  <p style={{ fontSize: "0.82rem", opacity: 0.9, marginTop: "0.3rem" }}>
                    Track 0-5 years child polio doses, finger indelible marking, UIP vaccine cold chain temperature & stock levels across village sub-centers.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setIsRecordVaccineOpen(true)}
                    style={{ background: "#ffffff", color: "#0f766e", border: "none", padding: "0.65rem 1.1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                  >
                    <Syringe size={18} />
                    <span>+ Record Polio Vaccination (చుక్కలు నమోదు)</span>
                  </button>
                </div>
              </div>

              {/* Polio Campaign KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div style={{ background: "#f0fdf4", padding: "1.1rem", borderRadius: "14px", border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#166534" }}>💉 Polio Drops Administered Today</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#047857", marginTop: "0.2rem" }}>
                    {polioStats.todayAdministered} Children
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 700 }}>bOPV Oral Polio Drops</div>
                </div>

                <div style={{ background: "#eff6ff", padding: "1.1rem", borderRadius: "14px", border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1e40af" }}>🎯 Target Children (0-5 Yrs)</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#1d4ed8", marginTop: "0.2rem" }}>
                    {polioStats.targetChildren} Target
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: 700 }}>
                    {((polioStats.todayAdministered / polioStats.targetChildren) * 100).toFixed(1)}% Campaign Coverage
                  </div>
                </div>

                <div style={{ background: "#f0fdfa", padding: "1.1rem", borderRadius: "14px", border: "1px solid #99f6e4" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f766e" }}>❄️ Cold Chain Storage Temp</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0d9488", marginTop: "0.2rem" }}>
                    {polioStats.coldChainTemp}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#115e59", fontWeight: 700 }}>Optimal Range: +2°C to +8°C</div>
                </div>

                <div style={{ background: "#fffbe8", padding: "1.1rem", borderRadius: "14px", border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#92400e" }}>🧪 Polio Vials Available</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#d97706", marginTop: "0.2rem" }}>
                    {polioStats.bopvVials} bOPV + {polioStats.ipvVials} IPV
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#b45309", fontWeight: 700 }}>900 Oral Doses + 300 Inj Doses</div>
                </div>
              </div>

              {/* ── SECTION 1: TODAY'S PULSE POLIO BENEFICIARIES LOG ── */}
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Syringe size={20} style={{ color: "#0d9488" }} />
                      👶 Today's Pulse Polio Drive Beneficiaries & Immunization Field Log
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
                      Real-time register of children (0-5 years) administered Polio drops & finger-marked during booth & door-to-door drive.
                    </div>
                  </div>

                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0d9488", background: "#f0fdfa", border: "1px solid #99f6e4", padding: "0.25rem 0.75rem", borderRadius: "999px" }}>
                    ✓ Booth #3 Ward 3 Live
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                        <th style={{ padding: "0.75rem 1rem" }}>Record ID</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Child Name & Age</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Parent / Guardian</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Ward / Village</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Vaccine & Dose</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Finger Marked</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {immunizationRecords.map((r) => {
                        const isGiven = r.status === "Given Today";
                        return (
                          <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#0d9488", fontFamily: "monospace" }}>
                              {r.id}
                            </td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <div style={{ fontWeight: 800, color: "#0f172a" }}>{r.child_name}</div>
                              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Age: {r.age}</div>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#334155", fontWeight: 600 }}>
                              {r.parent_name}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>
                              {r.ward}
                            </td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <div style={{ fontWeight: 800, color: "#047857" }}>{r.vaccine}</div>
                              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{r.dose}</div>
                            </td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <span style={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                padding: "0.15rem 0.55rem",
                                borderRadius: "999px",
                                background: r.finger_marked ? "#ecfdf5" : "#fffbe8",
                                color: r.finger_marked ? "#047857" : "#b45309",
                                border: r.finger_marked ? "1px solid #a7f3d0" : "1px solid #fde68a",
                              }}>
                                {r.finger_marked ? "✓ Marked Ink" : "⏳ Pending Ink"}
                              </span>
                            </td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <span style={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                padding: "0.2rem 0.65rem",
                                borderRadius: "999px",
                                background: isGiven ? "#dcfce7" : "#fffbe8",
                                color: isGiven ? "#15803d" : "#d97706",
                                border: isGiven ? "1px solid #86efac" : "1px solid #fde68a",
                              }}>
                                {r.status}
                              </span>
                            </td>
                            <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                              {!isGiven ? (
                                <button
                                  onClick={() => {
                                    setImmunizationRecords(prev => prev.map(item => item.id === r.id ? { ...item, status: "Given Today", finger_marked: true, time: "Today, Just Now" } : item));
                                    setPolioStats(prev => ({ ...prev, todayAdministered: prev.todayAdministered + 1 }));
                                    showToast(`✓ Polio Oral Drops administered to ${r.child_name}! Finger marked.`);
                                  }}
                                  style={{ background: "#047857", color: "white", border: "none", padding: "0.35rem 0.7rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer" }}
                                >
                                  ✓ Administer Drops
                                </button>
                              ) : (
                                <span style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 800 }}>
                                  ✓ Completed ({r.time})
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SECTION 2: UIP VACCINES & COLD CHAIN MASTER CATALOG ── */}
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Package size={20} style={{ color: "#047857" }} />
                      Universal Immunization Program (UIP) Cold Chain Vaccines Catalog
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                      Master vaccine stock levels, cold chain storage limits, and batch expiry tracking for PHC & Village Sub-Center.
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textTransform: "uppercase", fontSize: "0.7rem", color: "#64748b", fontWeight: 800 }}>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "left" }}>Vaccine Name</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "left" }}>Target Group</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "left" }}>Cold Chain Temperature</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>Vials / Stock</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>Batch & Expiry</th>
                        <th style={{ padding: "0.75rem 0.85rem", textAlign: "right" }}>Stock Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "bOPV (Bivalent Oral Polio Vaccine)", target: "Children 0-5 Years", temp: "-20°C to +8°C (Carrier Box)", stock: "45 Vials (900 doses)", batch: "BAT-OPV-992", exp: "2027-08-31", status: "🟢 Optimal Stock" },
                        { name: "IPV (Inactivated Polio Vaccine)", target: "Infants 14 Wks & 9 Mos", temp: "+2°C to +8°C (Ice Lined Refrigerator)", stock: "30 Vials (300 doses)", batch: "BAT-IPV-441", exp: "2027-06-30", status: "🟢 Optimal Stock" },
                        { name: "BCG Vaccine (Tuberculosis)", target: "Newborns at Birth", temp: "+2°C to +8°C", stock: "15 Vials (300 doses)", batch: "BAT-BCG-102", exp: "2027-04-15", status: "🟢 Optimal Stock" },
                        { name: "Pentavalent (DPT + HepB + Hib)", target: "Infants 6, 10, 14 Weeks", temp: "+2°C to +8°C", stock: "25 Vials (250 doses)", batch: "BAT-PENTA-883", exp: "2027-11-20", status: "🟢 Optimal Stock" },
                        { name: "Measles-Rubella (MR) Vaccine", target: "Infants 9 & 16 Months", temp: "+2°C to +8°C", stock: "8 Vials (80 doses)", batch: "BAT-MR-502", exp: "2026-12-31", status: "⚡ Low Stock" },
                        { name: "Rotavirus Vaccine (RVV Drops)", target: "Infants 6, 10, 14 Weeks", temp: "+2°C to +8°C", stock: "20 Vials (100 doses)", batch: "BAT-RVV-331", exp: "2027-09-15", status: "🟢 Optimal Stock" },
                        { name: "TT / Td Vaccine (Tetanus)", target: "Pregnant Women & Adolescents", temp: "+2°C to +8°C", stock: "40 Vials (400 doses)", batch: "BAT-TT-601", exp: "2028-02-28", status: "🟢 Optimal Stock" },
                      ].map((v, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.75rem 0.85rem", fontWeight: 800, color: "#0f172a" }}>{v.name}</td>
                          <td style={{ padding: "0.75rem 0.85rem", color: "#475569", fontWeight: 600 }}>{v.target}</td>
                          <td style={{ padding: "0.75rem 0.85rem", color: "#0f766e", fontWeight: 700 }}>{v.temp}</td>
                          <td style={{ padding: "0.75rem 0.85rem", textAlign: "center", fontWeight: 800, color: "#047857" }}>{v.stock}</td>
                          <td style={{ padding: "0.75rem 0.85rem", textAlign: "center", color: "#64748b" }}>{v.batch} · Exp: {v.exp}</td>
                          <td style={{ padding: "0.75rem 0.85rem", textAlign: "right" }}>
                            <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800, background: v.status.includes("Low") ? "#fffbe8" : "#ecfdf5", color: v.status.includes("Low") ? "#d97706" : "#047857", border: v.status.includes("Low") ? "1px solid #fde68a" : "1px solid #a7f3d0" }}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

          {/* ── MODAL 1: ADD NEW ITEM MODAL ─────────────────────── */}
      {isAddItemOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "560px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{t("modalAddTitle")}</div>
              <button onClick={() => setIsAddItemOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateItemSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("colItemName")} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Paracetamol 500mg, Clean Delivery Kit"
                  value={newItemForm.item_name}
                  onChange={(e) => setNewItemForm((prev) => ({ ...prev, item_name: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("colCategory")} *</label>
                  <select
                    value={newItemForm.category_id}
                    onChange={(e) => setNewItemForm((prev) => ({ ...prev, category_id: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("colUnit")} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Strips, Bottles, Kits, Vials, Packs"
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm((prev) => ({ ...prev, unit: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("colStock")}</label>
                  <input
                    type="number"
                    min={0}
                    value={newItemForm.current_quantity}
                    onChange={(e) => setNewItemForm((prev) => ({ ...prev, current_quantity: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("colMinQty")}</label>
                  <input
                    type="number"
                    min={1}
                    value={newItemForm.min_quantity}
                    onChange={(e) => setNewItemForm((prev) => ({ ...prev, min_quantity: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("colMaxQty")}</label>
                  <input
                    type="number"
                    min={10}
                    value={newItemForm.max_quantity}
                    onChange={(e) => setNewItemForm((prev) => ({ ...prev, max_quantity: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("modalBatchNo")}</label>
                  <input
                    type="text"
                    value={newItemForm.batch_number}
                    onChange={(e) => setNewItemForm((prev) => ({ ...prev, batch_number: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("modalExpiryDate")}</label>
                  <input
                    type="date"
                    value={newItemForm.expiry_date}
                    onChange={(e) => setNewItemForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsAddItemOpen(false)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#f1f5f9", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                  {t("btnCancel")}
                </button>
                <button type="submit" style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#047857", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "white", cursor: "pointer" }}>
                  {t("btnSubmit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: RESTOCK STOCK-IN MODAL ─────────────────── */}
      {isRestockOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{t("modalRestockTitle")}</div>
              <button onClick={() => setIsRestockOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("modalItemSelect")} *</label>
                <select
                  value={restockForm.item_id}
                  onChange={(e) => setRestockForm((prev) => ({ ...prev, item_id: Number(e.target.value) }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.item_name} ({t("colStock")}: {i.current_quantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("modalQty")} *</label>
                  <input
                    type="number"
                    min={1}
                    value={restockForm.quantity}
                    onChange={(e) => setRestockForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("modalRefCode")}</label>
                  <input
                    type="text"
                    value={restockForm.reference}
                    onChange={(e) => setRestockForm((prev) => ({ ...prev, reference: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsRestockOpen(false)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#f1f5f9", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                  {t("btnCancel")}
                </button>
                <button type="submit" style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#047857", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "white", cursor: "pointer" }}>
                  {t("btnSubmit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ROW DISTRIBUTE MODAL ──────────────────── */}
      {isDistributeOpen && selectedItemForModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>↓ {t("btnDistribute")} '{selectedItemForModal.item_name}'</div>
              <button onClick={() => setIsDistributeOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            {distributeError && (
              <div style={{ padding: "0.75rem", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.85rem" }}>
                ⚠️ {distributeError}
              </div>
            )}

            <form onSubmit={handleDistributeSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ padding: "0.75rem", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#047857" }}>
                  {t("availableStock")}: {selectedItemForModal.current_quantity} {selectedItemForModal.unit}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#166534" }}>Expiry Date: {selectedItemForModal.expiry_date || "N/A"}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("modalQty")} *</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedItemForModal.current_quantity}
                    value={distributeForm.quantity}
                    onChange={(e) => setDistributeForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("modalBeneficiary")} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HH-101 Lakshmi Narayana"
                    value={distributeForm.beneficiary_ref}
                    onChange={(e) => setDistributeForm((prev) => ({ ...prev, beneficiary_ref: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>{t("modalVillage")} *</label>
                <select
                  value={distributeForm.area_village}
                  onChange={(e) => setDistributeForm((prev) => ({ ...prev, area_village: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                >
                  <option value="Ward 1">Ward 1</option>
                  <option value="Ward 2">Ward 2</option>
                  <option value="Ward 3">Ward 3</option>
                  <option value="Ward 4">Ward 4</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsDistributeOpen(false)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#f1f5f9", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                  {t("btnCancel")}
                </button>
                <button type="submit" style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#047857", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "white", cursor: "pointer" }}>
                  {t("btnSubmit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: FREE-TEXT MEDICINE REQUEST MODAL (ASHA WORKER) ─────── */}
      {isMandalReqOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "520px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Inbox size={20} style={{ color: "#047857" }} />
                📩 Request Medicine from Mandal HQ (నూతన రిక్వెస్ట్)
              </div>
              <button onClick={() => setIsMandalReqOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!freeTextReqForm.medicine_name.trim()) {
                  showToast("Please enter medicine or supply name", "error");
                  return;
                }
                try {
                  const res = await createMedicineRequestApi(freeTextReqForm);
                  showToast(`✓ Medicine Request ${res.request?.request_id || "submitted"} created successfully! Sent to Mandal HQ.`);
                  setIsMandalReqOpen(false);
                  setFreeTextReqForm({
                    medicine_name: "",
                    requested_quantity: 100,
                    unit: "Packets",
                    urgency: "Normal",
                    reason: "",
                    notes: "",
                  });
                  if (res.request) {
                    setMedicineRequests((prev) => [res.request, ...prev.filter(r => r.id !== res.request.id && r.request_id !== res.request.request_id)]);
                  }
                  await loadAllData();
                } catch (err: any) {
                  showToast(err.message || "Failed to create medicine request", "error");
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
            >
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#334155" }}>
                  Medicine / Health Supply Name (ఏ మందులైనా నమోదు చేయవచ్చు) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 ORS packets, Zinc Tablets, Amoxicillin Syrup"
                  value={freeTextReqForm.medicine_name}
                  onChange={(e) => setFreeTextReqForm((prev) => ({ ...prev, medicine_name: e.target.value }))}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", marginTop: "0.2rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    value={freeTextReqForm.requested_quantity}
                    onChange={(e) => setFreeTextReqForm((prev) => ({ ...prev, requested_quantity: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Unit *</label>
                  <select
                    value={freeTextReqForm.unit}
                    onChange={(e) => setFreeTextReqForm((prev) => ({ ...prev, unit: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                  >
                    <option value="Packets">Packets</option>
                    <option value="Strips">Strips</option>
                    <option value="Vials">Vials</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Kits">Kits</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Urgency *</label>
                  <select
                    value={freeTextReqForm.urgency}
                    onChange={(e) => setFreeTextReqForm((prev) => ({ ...prev, urgency: e.target.value as any }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">⚡ Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Reason / Requirement *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diarrhea outbreak in Ward 3 village households"
                  value={freeTextReqForm.reason}
                  onChange={(e) => setFreeTextReqForm((prev) => ({ ...prev, reason: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Additional Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Need immediate supply before monsoon drive"
                  value={freeTextReqForm.notes}
                  onChange={(e) => setFreeTextReqForm((prev) => ({ ...prev, notes: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsMandalReqOpen(false)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#f1f5f9", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#047857", border: "none", fontSize: "0.82rem", fontWeight: 800, color: "white", cursor: "pointer" }}>
                  Submit Requisition →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: MANDAL DECISION ACTION MODAL (PARTIAL / REJECT) ─────── */}
      {mandalActionModal.targetReq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "480px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                {mandalActionModal.actionType === "PARTIAL" ? "⚡ Partial Approval" : "❌ Reject Request"} — {mandalActionModal.targetReq.request_id}
              </div>
              <button onClick={() => setMandalActionModal({ targetReq: null, actionType: null, approvedQty: 0, dispatchedQty: 0, notes: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const reqId = mandalActionModal.targetReq!.request_id;
                const act = mandalActionModal.actionType === "PARTIAL" ? "PARTIALLY_APPROVE" : "REJECT";
                try {
                  await updateMedicineRequestStatusApi(
                    reqId,
                    act,
                    mandalActionModal.actionType === "PARTIAL" ? mandalActionModal.approvedQty : 0,
                    0,
                    mandalActionModal.notes
                  );
                  showToast(`✓ Request ${reqId} updated to ${act}`);
                  setMandalActionModal({ targetReq: null, actionType: null, approvedQty: 0, dispatchedQty: 0, notes: "" });
                  loadAllData();
                } catch (err: any) {
                  showToast(err.message || "Failed to update request", "error");
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
            >
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>{mandalActionModal.targetReq.medicine_name}</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Requested: {mandalActionModal.targetReq.requested_quantity} {mandalActionModal.targetReq.unit} by {mandalActionModal.targetReq.asha_worker_name || "Sunita Devi"}</div>
              </div>

              {mandalActionModal.actionType === "PARTIAL" && (
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>Approved Quantity ({mandalActionModal.targetReq.unit}) *</label>
                  <input
                    type="number"
                    min={1}
                    max={mandalActionModal.targetReq.requested_quantity}
                    value={mandalActionModal.approvedQty}
                    onChange={(e) => setMandalActionModal((prev) => ({ ...prev, approvedQty: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>Mandal Remarks / Reason *</label>
                <input
                  type="text"
                  required
                  value={mandalActionModal.notes}
                  onChange={(e) => setMandalActionModal((prev) => ({ ...prev, notes: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setMandalActionModal({ targetReq: null, actionType: null, approvedQty: 0, dispatchedQty: 0, notes: "" })} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#f1f5f9", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: mandalActionModal.actionType === "PARTIAL" ? "#ea580c" : "#dc2626", border: "none", fontSize: "0.82rem", fontWeight: 800, color: "white", cursor: "pointer" }}>
                  Confirm {mandalActionModal.actionType === "PARTIAL" ? "Partial Approval" : "Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 6: RECORD POLIO VACCINATION MODAL ─────────────────────── */}
      {isRecordVaccineOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "520px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Syringe size={20} style={{ color: "#0d9488" }} />
                💉 Record Polio Vaccination (చుక్కల నమోదు)
              </div>
              <button onClick={() => setIsRecordVaccineOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newVaccineForm.child_name.trim()) {
                  showToast("Please enter child name", "error");
                  return;
                }
                const nextId = `POLIO-2026-${String(immunizationRecords.length + 1).padStart(3, "0")}`;
                const newRec = {
                  id: nextId,
                  child_name: newVaccineForm.child_name,
                  parent_name: newVaccineForm.parent_name || "Guardian",
                  age: newVaccineForm.age,
                  ward: newVaccineForm.ward,
                  vaccine: newVaccineForm.vaccine,
                  dose: newVaccineForm.dose,
                  status: "Given Today",
                  administered_by: "Sunita Devi (ASHA)",
                  finger_marked: newVaccineForm.finger_marked,
                  time: "Today, Just Now",
                };
                setImmunizationRecords(prev => [newRec, ...prev]);
                setPolioStats(prev => ({ ...prev, todayAdministered: prev.todayAdministered + 1 }));
                setIsRecordVaccineOpen(false);
                setNewVaccineForm({
                  child_name: "",
                  parent_name: "",
                  age: "2 Yrs",
                  ward: "Ward 3 Central Village",
                  vaccine: "bOPV (Pulse Polio Drops)",
                  dose: "Dose 3",
                  finger_marked: true,
                  notes: "",
                });
                showToast(`✓ Polio Vaccination recorded for ${newVaccineForm.child_name}! Finger marked.`);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
            >
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#334155" }}>
                  Child Name (పిల్లల పేరు) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sai Teja, Ananya, Rahul"
                  value={newVaccineForm.child_name}
                  onChange={(e) => setNewVaccineForm((prev) => ({ ...prev, child_name: e.target.value }))}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", marginTop: "0.2rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Parent / Guardian Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={newVaccineForm.parent_name}
                    onChange={(e) => setNewVaccineForm((prev) => ({ ...prev, parent_name: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Age (0 - 5 Years) *</label>
                  <select
                    value={newVaccineForm.age}
                    onChange={(e) => setNewVaccineForm((prev) => ({ ...prev, age: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                  >
                    <option value="Newborn (At Birth)">Newborn (At Birth)</option>
                    <option value="6 Weeks">6 Weeks</option>
                    <option value="10 Weeks">10 Weeks</option>
                    <option value="14 Weeks">14 Weeks</option>
                    <option value="9 Months">9 Months</option>
                    <option value="1.5 Yrs">1.5 Yrs</option>
                    <option value="2 Yrs">2 Yrs</option>
                    <option value="3 Yrs">3 Yrs</option>
                    <option value="4 Yrs">4 Yrs</option>
                    <option value="5 Yrs">5 Yrs</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Ward / Location *</label>
                  <select
                    value={newVaccineForm.ward}
                    onChange={(e) => setNewVaccineForm((prev) => ({ ...prev, ward: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                  >
                    <option value="Ward 1 North Block">Ward 1 North Block</option>
                    <option value="Ward 2 East Block">Ward 2 East Block</option>
                    <option value="Ward 3 Central Village">Ward 3 Central Village</option>
                    <option value="Ward 4 South Colony">Ward 4 South Colony</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Vaccine Type *</label>
                  <select
                    value={newVaccineForm.vaccine}
                    onChange={(e) => setNewVaccineForm((prev) => ({ ...prev, vaccine: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                  >
                    <option value="bOPV (Pulse Polio Drops)">bOPV (Pulse Polio Drops)</option>
                    <option value="bOPV + IPV (Polio Drops & Inj)">bOPV + IPV (Polio Drops & Inj)</option>
                    <option value="Pentavalent (DPT+HepB+Hib)">Pentavalent (DPT+HepB+Hib)</option>
                    <option value="BCG (Tuberculosis)">BCG (Tuberculosis)</option>
                    <option value="MR (Measles-Rubella)">MR (Measles-Rubella)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdfa", padding: "0.75rem", borderRadius: "10px", border: "1px solid #99f6e4" }}>
                <input
                  type="checkbox"
                  id="finger_marked"
                  checked={newVaccineForm.finger_marked}
                  onChange={(e) => setNewVaccineForm((prev) => ({ ...prev, finger_marked: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#0f766e", cursor: "pointer" }}
                />
                <label htmlFor="finger_marked" style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f766e", cursor: "pointer" }}>
                  ✓ Left Little Finger Marked with Indelible Marker Ink (వేలికి గుర్తు వేయబడింది)
                </label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsRecordVaccineOpen(false)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#f1f5f9", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#0d9488", border: "none", fontSize: "0.82rem", fontWeight: 900, color: "white", cursor: "pointer" }}>
                  ✓ Confirm & Save Dose
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 7: POST PUBLIC HEALTH ANNOUNCEMENT MODAL ───────────── */}
      {isPostAnnouncementOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "520px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Megaphone size={20} style={{ color: "#0d9488" }} />
                📢 Broadcast Health Announcement to Citizens
              </div>
              <button onClick={() => setIsPostAnnouncementOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "-0.5rem", marginBottom: "1rem" }}>
              Publish official health alerts, vaccine drive notices & medical camps live to all citizen mobile & web dashboards.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
                  showToast("Please enter announcement title & message", "error");
                  return;
                }
                const newAnnc = {
                  id: `ANNC-2026-${String(ashaAnnouncements.length + 1).padStart(3, "0")}`,
                  title: announcementForm.title,
                  category: announcementForm.category,
                  location: announcementForm.location,
                  message: announcementForm.message,
                  priority: announcementForm.priority,
                  posted_by: "Sunita Devi (ASHA Worker)",
                  created_at: "Just Now, Today",
                  unread: true,
                };
                const updated = [newAnnc, ...ashaAnnouncements];
                setAshaAnnouncements(updated);
                try {
                  localStorage.setItem("civic_asha_announcements", JSON.stringify(updated));
                  window.dispatchEvent(new Event("asha_announcement_posted"));
                } catch (err) {
                  console.warn("Storage err", err);
                }
                setIsPostAnnouncementOpen(false);
                showToast("📢 Health Announcement broadcast live to all Citizen dashboards!");
              }}
              style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
            >
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#334155" }}>
                  Announcement Title (ప్రకటన శీర్షిక) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 📢 Pulse Polio Drive Active Today, Free Eye Camp"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", marginTop: "0.2rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Category *</label>
                  <select
                    value={announcementForm.category}
                    onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, category: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                  >
                    <option value="Polio Vaccination">Polio Vaccination</option>
                    <option value="Maternal & Child Health">Maternal & Child Health</option>
                    <option value="Free Health Camp">Free Health Camp</option>
                    <option value="Dengue/Malaria Warning">Dengue/Malaria Warning</option>
                    <option value="General Health Notice">General Health Notice</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Target Village / Ward *</label>
                  <select
                    value={announcementForm.location}
                    onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, location: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", background: "white", marginTop: "0.2rem" }}
                  >
                    <option value="All Wards / Village PHC Sub-Center">All Wards / Village PHC</option>
                    <option value="Ward 1 North Block">Ward 1 North Block</option>
                    <option value="Ward 2 East Block">Ward 2 East Block</option>
                    <option value="Ward 3 Central Village">Ward 3 Central Village</option>
                    <option value="Ward 4 South Colony">Ward 4 South Colony</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>Priority Level *</label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                  <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: 700, color: "#dc2626" }}>
                    <input
                      type="radio"
                      name="priority"
                      value="Urgent"
                      checked={announcementForm.priority === "Urgent"}
                      onChange={() => setAnnouncementForm((prev) => ({ ...prev, priority: "Urgent" }))}
                    />
                    🔴 Urgent Broadcast (Red Alert Banner)
                  </label>
                  <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: 700, color: "#0d9488" }}>
                    <input
                      type="radio"
                      name="priority"
                      value="Normal"
                      checked={announcementForm.priority === "Normal"}
                      onChange={() => setAnnouncementForm((prev) => ({ ...prev, priority: "Normal" }))}
                    />
                    🟢 General Notice
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 800, color: "#334155" }}>
                  Announcement Message & Instructions *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide instructions for villagers e.g. Bring children aged 0-5 for 2 oral polio drops at PHC center from 7 AM to 5 PM."
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none", marginTop: "0.2rem", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setIsPostAnnouncementOpen(false)} style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "#f1f5f9", border: "none", fontSize: "0.82rem", fontWeight: 700, color: "#475569", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: "0.65rem", borderRadius: "8px", background: "linear-gradient(135deg, #0d9488, #0f766e)", border: "none", fontSize: "0.82rem", fontWeight: 900, color: "white", cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
                  📢 Publish & Broadcast Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
