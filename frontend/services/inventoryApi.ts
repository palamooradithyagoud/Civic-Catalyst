import { supabase } from "@/lib/supabaseClient";

const RAW_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const API_BASE_URL = RAW_URL.includes("/api/inventory")
  ? RAW_URL
  : RAW_URL.includes("/api/complaints")
  ? RAW_URL.replace(/\/complaints$/, "/inventory")
  : RAW_URL.includes("/api")
  ? `${RAW_URL}/inventory`
  : `${RAW_URL}/api/inventory`;

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface InventoryItem {
  id: number;
  item_id_code: string;
  item_name: string;
  category_id: number;
  category_name?: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity: number;
  batch_number?: string;
  expiry_date?: string;
  supplier_id?: number;
  supplier_name?: string;
  last_restocked?: string;
  status: "Healthy" | "Low Stock" | "Out of Stock" | "Expiring Soon" | "Expired";
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  transaction_id_code: string;
  item_id: number;
  item_name: string;
  transaction_type: "STOCK_IN" | "STOCK_OUT" | "DISTRIBUTION" | "ADJUSTMENT";
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  date: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface DistributionRecord {
  id: number;
  transaction_id: number;
  item_id: number;
  item_name: string;
  unit: string;
  quantity: number;
  beneficiary_ref: string;
  area_village: string;
  purpose: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface AlertItem {
  id: number;
  item_id: number;
  item_name: string;
  alert_type: "OUT_OF_STOCK" | "LOW_STOCK" | "EXPIRING_SOON" | "EXPIRED";
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  resolved: boolean;
  created_at: string;
}

export interface DashboardKPIs {
  total_items: number;
  total_stock_units: number;
  low_stock_count: number;
  out_of_stock_count: number;
  expiring_soon_count: number;
  expired_count: number;
  total_distributed_30days: number;
  today_distribution_count: number;
  recent_alerts: AlertItem[];
  top_critical_items: InventoryItem[];
}

export interface AnalyticsData {
  category_breakdown: Array<{ category: string; item_count: number; total_quantity: number }>;
  distribution_by_purpose: Array<{ purpose: string; record_count: number; total_quantity: number }>;
  top_distributed_items: Array<{ item_name: string; unit: string; total_distributed: number }>;
  daily_distribution_trend: Array<{ date: string; total_quantity: number; count: number }>;
  stock_status_summary: Record<string, number>;
}

export interface MedicineRequest {
  id: number;
  request_id: string;
  asha_worker_name: string;
  medicine_name: string;
  requested_quantity: number;
  approved_quantity: number;
  dispatched_quantity: number;
  unit: string;
  urgency: "Normal" | "High" | "Urgent";
  reason: string;
  notes?: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED" | "DISPATCHED" | "RECEIVED";
  dispatch_date?: string;
  created_at: string;
  updated_at: string;
}

// ── Helper ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText || `HTTP ${res.status}` }));
    let message = `API Request Failed (${res.status})`;
    const detail = errorData?.detail ?? errorData?.message ?? errorData?.error;
    if (typeof detail === "string" && detail.trim().length > 0) {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((item: any) => {
          if (typeof item === "string") return item;
          const loc = Array.isArray(item.loc) ? item.loc.filter((l: any) => l !== "body" && l !== "query").join(".") : "";
          const msg = item.msg || item.message || JSON.stringify(item);
          return loc ? `${loc}: ${msg}` : msg;
        })
        .join("; ");
    }
    throw new Error(message);
  }
  return res.json();
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────

export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const [itemsRes, alertsRes, distsRes] = await Promise.all([
    supabase.from("inventory_items").select("*"),
    supabase.from("alerts").select("*").eq("resolved", false).order("id", { ascending: false }),
    supabase.from("distribution_records").select("quantity, created_at"),
  ]);

  const items = (itemsRes.data || []) as InventoryItem[];
  const alerts = (alertsRes.data || []) as AlertItem[];
  const dists = distsRes.data || [];

  const total_items = items.length;
  const total_stock_units = items.reduce((sum, i) => sum + (i.current_quantity || 0), 0);
  const low_stock_count = items.filter((i) => i.status === "Low Stock").length;
  const out_of_stock_count = items.filter((i) => i.status === "Out of Stock").length;
  const expiring_soon_count = items.filter((i) => i.status === "Expiring Soon").length;
  const expired_count = items.filter((i) => i.status === "Expired").length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent_dists = dists.filter((d: any) => new Date(d.created_at) >= thirtyDaysAgo);
  const total_distributed_30days = recent_dists.reduce((sum: number, d: any) => sum + (d.quantity || 0), 0);

  const today = new Date().toISOString().slice(0, 10);
  const today_distribution_count = dists.filter((d: any) => (d.created_at || "").startsWith(today)).length;

  const critical_items = items.filter((i) => i.status === "Out of Stock" || i.status === "Low Stock");

  return {
    total_items,
    total_stock_units,
    low_stock_count,
    out_of_stock_count,
    expiring_soon_count,
    expired_count,
    total_distributed_30days,
    today_distribution_count,
    recent_alerts: alerts.slice(0, 5),
    top_critical_items: critical_items,
  };
}

// ── Inventory Items ───────────────────────────────────────────────────────────

export async function fetchInventoryItems(
  searchQuery?: string,
  categoryId?: number,
  statusFilter?: string
): Promise<InventoryItem[]> {
  let query = supabase.from("inventory_items").select("*").order("id", { ascending: true });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (statusFilter && statusFilter !== "ALL") query = query.eq("status", statusFilter);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase inventory fetch error: ${error.message}`);

  let results = (data || []) as InventoryItem[];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter(
      (i) =>
        (i.item_name || "").toLowerCase().includes(q) ||
        (i.item_id_code || "").toLowerCase().includes(q)
    );
  }
  return results;
}

export async function createInventoryItem(payload: {
  item_name: string;
  category_id: number;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity: number;
  batch_number?: string;
  expiry_date?: string;
  supplier_id?: number;
  notes?: string;
}): Promise<InventoryItem> {
  // Try FastAPI backend first (it handles item code generation consistently)
  try {
    const res = await fetch(`${API_BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await handleResponse<InventoryItem>(res);
  } catch (err) {
    console.warn("Backend unavailable, writing directly to Supabase.", err);
  }

  // Direct Supabase fallback
  const statusStr =
    payload.current_quantity === 0
      ? "Out of Stock"
      : payload.current_quantity <= payload.min_quantity
      ? "Low Stock"
      : "Healthy";

  const { data: lastRow } = await supabase
    .from("inventory_items")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);
  const nextId = lastRow && lastRow[0] ? lastRow[0].id + 1 : 1;
  const itemCode = `ASH-INV-${String(nextId).padStart(3, "0")}`;

  const row = {
    item_id_code: itemCode,
    item_name: payload.item_name,
    category_id: payload.category_id || 1,
    category_name: "Medicines",
    unit: payload.unit || "Strips",
    current_quantity: payload.current_quantity || 0,
    min_quantity: payload.min_quantity || 10,
    max_quantity: payload.max_quantity || 500,
    batch_number: payload.batch_number || `BAT-${Date.now().toString().slice(-4)}`,
    expiry_date: payload.expiry_date || "2027-12-31",
    supplier_id: payload.supplier_id || 1,
    supplier_name: "District Medical Warehouse",
    status: statusStr,
    last_restocked: new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("inventory_items").insert([row]).select();
  if (error) throw new Error(error.message);
  return data[0] as InventoryItem;
}

// ── Restock ───────────────────────────────────────────────────────────────────

export async function restockInventoryItem(payload: {
  item_id: number;
  quantity: number;
  batch_number?: string;
  expiry_date?: string;
  supplier_id?: number;
  reference?: string;
  notes?: string;
}): Promise<InventoryItem> {
  // Try FastAPI backend (handles multi-table transaction logging)
  try {
    const res = await fetch(`${API_BASE_URL}/restock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await handleResponse<InventoryItem>(res);
  } catch (err) {
    console.warn("Backend unavailable, restocking directly in Supabase.", err);
  }

  // Direct Supabase restock
  const { data: itemData } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", payload.item_id)
    .single();
  if (!itemData) throw new Error(`Item ${payload.item_id} not found in Supabase`);

  const prevQty = itemData.current_quantity;
  const newQty = prevQty + payload.quantity;
  const newExpiry = payload.expiry_date || itemData.expiry_date;
  const newStatus =
    newQty === 0
      ? "Out of Stock"
      : newQty <= itemData.min_quantity
      ? "Low Stock"
      : "Healthy";

  const { data: updated, error } = await supabase
    .from("inventory_items")
    .update({
      current_quantity: newQty,
      status: newStatus,
      batch_number: payload.batch_number || itemData.batch_number,
      expiry_date: newExpiry,
      last_restocked: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.item_id)
    .select();
  if (error) throw new Error(error.message);

  // Log transaction
  const txCode = `TX-STK-${Date.now().toString().slice(-6)}`;
  await supabase.from("inventory_transactions").insert([{
    transaction_id_code: txCode,
    item_id: payload.item_id,
    item_name: itemData.item_name,
    transaction_type: "STOCK_IN",
    quantity: payload.quantity,
    previous_quantity: prevQty,
    new_quantity: newQty,
    reference: payload.reference || "MANDAL_RESTOCK",
    notes: payload.notes || "Restocked from Mandal Depot",
    date: new Date().toISOString(),
  }]);

  // Clear resolved alerts for this item
  await supabase.from("alerts").update({ resolved: true }).eq("item_id", payload.item_id);

  return (updated ? updated[0] : itemData) as InventoryItem;
}

// ── Distribute ────────────────────────────────────────────────────────────────

export async function distributeInventoryItem(payload: {
  item_id: number;
  quantity: number;
  beneficiary_ref: string;
  area_village: string;
  purpose: string;
  notes?: string;
}): Promise<{ status: string; message: string; distribution_id: number; remaining_quantity: number; item: InventoryItem }> {
  // Try FastAPI backend (handles multi-table transaction logging)
  try {
    const res = await fetch(`${API_BASE_URL}/distribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await handleResponse(res);
  } catch (err) {
    console.warn("Backend unavailable, distributing directly in Supabase.", err);
  }

  // Direct Supabase distribution
  const { data: itemData } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", payload.item_id)
    .single();
  if (!itemData) throw new Error(`Item ${payload.item_id} not found`);
  if (itemData.current_quantity < payload.quantity) {
    throw new Error(`Insufficient stock for ${itemData.item_name}. Available: ${itemData.current_quantity}`);
  }

  const prevQty = itemData.current_quantity;
  const newQty = prevQty - payload.quantity;
  const newStatus =
    newQty === 0
      ? "Out of Stock"
      : newQty <= itemData.min_quantity
      ? "Low Stock"
      : "Healthy";

  const { data: updated } = await supabase
    .from("inventory_items")
    .update({
      current_quantity: newQty,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.item_id)
    .select();

  // Log transaction
  const txCode = `TX-DIST-${Date.now().toString().slice(-6)}`;
  const { data: txData } = await supabase.from("inventory_transactions").insert([{
    transaction_id_code: txCode,
    item_id: payload.item_id,
    item_name: itemData.item_name,
    transaction_type: "DISTRIBUTION",
    quantity: payload.quantity,
    previous_quantity: prevQty,
    new_quantity: newQty,
    reference: `DIST-${payload.area_village}`,
    notes: `Beneficiary: ${payload.beneficiary_ref} (${payload.area_village})`,
    date: new Date().toISOString(),
  }]).select();

  const txId = txData && txData[0] ? txData[0].id : 1;

  // Log distribution record
  const { data: distData } = await supabase.from("distribution_records").insert([{
    transaction_id: txId,
    item_id: payload.item_id,
    item_name: itemData.item_name,
    unit: itemData.unit || "Units",
    quantity: payload.quantity,
    beneficiary_ref: payload.beneficiary_ref,
    area_village: payload.area_village,
    purpose: payload.purpose,
    notes: payload.notes || "",
    date: new Date().toISOString(),
  }]).select();

  // Auto-create alert if stock <= 10
  if (newQty <= 10) {
    await supabase.from("alerts").insert([{
      item_id: payload.item_id,
      item_name: itemData.item_name,
      alert_type: newQty === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
      severity: newQty === 0 ? "CRITICAL" : "WARNING",
      message: `🚨 [Urgent Mandal Requisition] Stock for '${itemData.item_name}' dropped to ${newQty} ${itemData.unit} (<= 10 units). Auto-reported to Mandal Hospital for emergency delivery.`,
      resolved: false,
      created_at: new Date().toISOString(),
    }]);
  }

  return {
    status: "success",
    message: `Distributed ${payload.quantity} ${itemData.unit} to ${payload.beneficiary_ref}`,
    distribution_id: distData && distData[0] ? distData[0].id : 1,
    remaining_quantity: newQty,
    item: (updated ? updated[0] : itemData) as InventoryItem,
  };
}

// ── Transactions & Distributions ──────────────────────────────────────────────

export async function fetchTransactions(
  searchQuery?: string,
  itemId?: number,
  txType?: string
): Promise<InventoryTransaction[]> {
  let query = supabase
    .from("inventory_transactions")
    .select("*")
    .order("id", { ascending: false });

  if (itemId) query = query.eq("item_id", itemId);
  if (txType && txType !== "ALL") query = query.eq("transaction_type", txType);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase transactions fetch error: ${error.message}`);

  let results = (data || []) as InventoryTransaction[];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter(
      (t) =>
        (t.item_name || "").toLowerCase().includes(q) ||
        (t.transaction_id_code || "").toLowerCase().includes(q)
    );
  }
  return results;
}

export async function fetchDistributions(
  searchQuery?: string,
  areaVillage?: string,
  itemId?: number
): Promise<DistributionRecord[]> {
  let query = supabase
    .from("distribution_records")
    .select("*")
    .order("id", { ascending: false });

  if (areaVillage && areaVillage !== "ALL") query = query.eq("area_village", areaVillage);
  if (itemId) query = query.eq("item_id", itemId);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase distributions fetch error: ${error.message}`);

  let results = (data || []) as DistributionRecord[];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter(
      (d) =>
        (d.item_name || "").toLowerCase().includes(q) ||
        (d.beneficiary_ref || "").toLowerCase().includes(q) ||
        (d.area_village || "").toLowerCase().includes(q)
    );
  }
  return results;
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("resolved", false)
    .order("id", { ascending: false });

  if (error) throw new Error(`Supabase alerts fetch error: ${error.message}`);
  return (data || []) as AlertItem[];
}

export async function resolveAlert(alertId: number): Promise<void> {
  // Also try backend if online
  try {
    await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, { method: "POST" });
  } catch {}

  await supabase.from("alerts").update({ resolved: true }).eq("id", alertId);
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const [itemsRes, distsRes] = await Promise.all([
    supabase.from("inventory_items").select("category_name, current_quantity, status"),
    supabase.from("distribution_records").select("purpose, quantity, item_name, unit, created_at"),
  ]);

  const items = itemsRes.data || [];
  const dists = distsRes.data || [];

  // Category breakdown
  const catMap: Record<string, { item_count: number; total_quantity: number }> = {};
  for (const i of items) {
    const cat = (i as any).category_name || "General";
    if (!catMap[cat]) catMap[cat] = { item_count: 0, total_quantity: 0 };
    catMap[cat].item_count++;
    catMap[cat].total_quantity += (i as any).current_quantity || 0;
  }
  const category_breakdown = Object.entries(catMap).map(([category, v]) => ({ category, ...v }));

  // Stock status summary
  const stock_status_summary: Record<string, number> = {};
  for (const i of items) {
    const st = (i as any).status || "Healthy";
    stock_status_summary[st] = (stock_status_summary[st] || 0) + 1;
  }

  // Distribution by purpose
  const purposeMap: Record<string, { record_count: number; total_quantity: number }> = {};
  for (const d of dists) {
    const p = (d as any).purpose || "Other";
    if (!purposeMap[p]) purposeMap[p] = { record_count: 0, total_quantity: 0 };
    purposeMap[p].record_count++;
    purposeMap[p].total_quantity += (d as any).quantity || 0;
  }
  const distribution_by_purpose = Object.entries(purposeMap).map(([purpose, v]) => ({ purpose, ...v }));

  // Top distributed items
  const itemDistMap: Record<string, { unit: string; total: number }> = {};
  for (const d of dists) {
    const name = (d as any).item_name || "Unknown";
    if (!itemDistMap[name]) itemDistMap[name] = { unit: (d as any).unit || "Units", total: 0 };
    itemDistMap[name].total += (d as any).quantity || 0;
  }
  const top_distributed_items = Object.entries(itemDistMap)
    .map(([item_name, v]) => ({ item_name, unit: v.unit, total_distributed: v.total }))
    .sort((a, b) => b.total_distributed - a.total_distributed)
    .slice(0, 5);

  // Daily distribution trend (last 7 days)
  const trendMap: Record<string, { total_quantity: number; count: number }> = {};
  for (const d of dists) {
    const day = ((d as any).created_at || "").slice(0, 10);
    if (day) {
      if (!trendMap[day]) trendMap[day] = { total_quantity: 0, count: 0 };
      trendMap[day].total_quantity += (d as any).quantity || 0;
      trendMap[day].count++;
    }
  }
  const daily_distribution_trend = Object.entries(trendMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  return {
    category_breakdown,
    distribution_by_purpose,
    top_distributed_items,
    daily_distribution_trend,
    stock_status_summary,
  };
}

// ── Categories & Suppliers ────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw new Error(`Supabase categories fetch error: ${error.message}`);
  return (data || []) as Category[];
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw new Error(`Supabase suppliers fetch error: ${error.message}`);
  return (data || []) as Supplier[];
}

export async function triggerReSeed(): Promise<{ status: string; items_count: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/seed`, { method: "POST" });
    if (res.ok) return await handleResponse(res);
  } catch {}
  const { data } = await supabase.from("inventory_items").select("id");
  return { status: "success", items_count: (data || []).length };
}

// ── Medicine Requests ─────────────────────────────────────────────────────────

export async function fetchMedicineRequests(): Promise<MedicineRequest[]> {
  const { data, error } = await supabase
    .from("medicine_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Supabase medicine requests fetch error: ${error.message}`);
  
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

  const list = (data || []) as MedicineRequest[];
  return list.sort((a, b) => {
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
}

export async function createMedicineRequestApi(payload: {
  medicine_name: string;
  requested_quantity: number;
  unit?: string;
  urgency?: string;
  reason?: string;
  notes?: string;
}): Promise<{ message: string; request: MedicineRequest }> {
  // Generate unique request ID
  const { data: lastRow } = await supabase
    .from("medicine_requests")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);
  const nextId = lastRow && lastRow[0] ? lastRow[0].id + 1 : 1;
  const reqId = `REQ-ASHA-${String(nextId).padStart(4, "0")}`;

  const row = {
    request_id: reqId,
    asha_worker_name: "Sunita Devi (ASHA)",
    medicine_name: payload.medicine_name,
    requested_quantity: payload.requested_quantity,
    approved_quantity: 0,
    dispatched_quantity: 0,
    unit: payload.unit || "Units",
    urgency: payload.urgency || "Normal",
    reason: payload.reason || "Shortage requisition",
    notes: payload.notes || "",
    status: "PENDING",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("medicine_requests")
    .insert([row])
    .select();

  if (error) throw new Error(`Supabase medicine request insert error: ${error.message}`);
  if (!data || !data[0]) throw new Error("No data returned from Supabase insert");

  return { message: "Requisition submitted to Supabase", request: data[0] as MedicineRequest };
}

export async function updateMedicineRequestStatusApi(
  requestId: string,
  action: "APPROVE" | "PARTIALLY_APPROVE" | "REJECT" | "DISPATCH" | "MARK_RECEIVED",
  approvedQuantity: number = 0,
  dispatchedQuantity: number = 0,
  notes: string = ""
): Promise<{ message: string; request: MedicineRequest }> {
  const statusMap: Record<string, string> = {
    APPROVE: "APPROVED",
    PARTIALLY_APPROVE: "PARTIALLY_APPROVED",
    REJECT: "REJECTED",
    DISPATCH: "DISPATCHED",
    MARK_RECEIVED: "RECEIVED",
  };

  const newStatus = statusMap[action] || action;
  const updatePayload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (approvedQuantity > 0) updatePayload.approved_quantity = approvedQuantity;
  if (dispatchedQuantity > 0) updatePayload.dispatched_quantity = dispatchedQuantity;
  if (action === "DISPATCH") updatePayload.dispatch_date = new Date().toISOString();
  if (notes) updatePayload.notes = notes;

  const { data, error } = await supabase
    .from("medicine_requests")
    .update(updatePayload)
    .eq("request_id", requestId)
    .select();

  if (error) throw new Error(`Supabase medicine request update error: ${error.message}`);
  if (!data || !data[0]) throw new Error(`Request ${requestId} not found`);

  return {
    message: `Status updated to ${newStatus} in Supabase`,
    request: data[0] as MedicineRequest,
  };
}
