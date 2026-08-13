/**
 * Smart Inventory Management System - API Client & Resilience Wrapper
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/inventory";

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

// ── Client Fetch Helpers ───────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText || `HTTP ${res.status}` }));
    let message = `API Request Failed (${res.status})`;

    if (errorData) {
      const detail = errorData.detail ?? errorData.message ?? errorData.error;

      if (typeof detail === "string" && detail.trim().length > 0) {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const loc = Array.isArray(item.loc) ? item.loc.filter((l: any) => l !== "body" && l !== "query").join(".") : "";
              const msg = item.msg || item.message || JSON.stringify(item);
              return loc ? `${loc}: ${msg}` : msg;
            }
            return String(item);
          })
          .join("; ");
      } else if (typeof detail === "object" && detail !== null) {
        message = detail.msg || detail.message || JSON.stringify(detail);
      } else if (typeof errorData === "string" && errorData.trim().length > 0) {
        message = errorData;
      }
    }

    throw new Error(message);
  }
  return res.json();
}

export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const res = await fetch(`${API_BASE_URL}/dashboard`, { cache: "no-store" });
  return handleResponse<DashboardKPIs>(res);
}

export async function fetchInventoryItems(
  searchQuery?: string,
  categoryId?: number,
  statusFilter?: string
): Promise<InventoryItem[]> {
  const params = new URLSearchParams();
  if (searchQuery) params.append("q", searchQuery);
  if (categoryId) params.append("category_id", categoryId.toString());
  if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);

  const res = await fetch(`${API_BASE_URL}?${params.toString()}`, { cache: "no-store" });
  return handleResponse<InventoryItem[]>(res);
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
  const res = await fetch(`${API_BASE_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<InventoryItem>(res);
}

export async function restockInventoryItem(payload: {
  item_id: number;
  quantity: number;
  batch_number?: string;
  expiry_date?: string;
  supplier_id?: number;
  reference?: string;
  notes?: string;
}): Promise<InventoryItem> {
  const res = await fetch(`${API_BASE_URL}/restock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<InventoryItem>(res);
}

export async function distributeInventoryItem(payload: {
  item_id: number;
  quantity: number;
  beneficiary_ref: string;
  area_village: string;
  purpose: string;
  notes?: string;
}): Promise<{ status: string; message: string; distribution_id: number; remaining_quantity: number; item: InventoryItem }> {
  const res = await fetch(`${API_BASE_URL}/distribute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function fetchTransactions(
  searchQuery?: string,
  itemId?: number,
  txType?: string
): Promise<InventoryTransaction[]> {
  const params = new URLSearchParams();
  if (searchQuery) params.append("q", searchQuery);
  if (itemId) params.append("item_id", itemId.toString());
  if (txType && txType !== "ALL") params.append("tx_type", txType);

  const res = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`, { cache: "no-store" });
  return handleResponse<InventoryTransaction[]>(res);
}

export async function fetchDistributions(
  searchQuery?: string,
  areaVillage?: string,
  itemId?: number
): Promise<DistributionRecord[]> {
  const params = new URLSearchParams();
  if (searchQuery) params.append("q", searchQuery);
  if (areaVillage && areaVillage !== "ALL") params.append("area_village", areaVillage);
  if (itemId) params.append("item_id", itemId.toString());

  const res = await fetch(`${API_BASE_URL}/distributions?${params.toString()}`, { cache: "no-store" });
  return handleResponse<DistributionRecord[]>(res);
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const res = await fetch(`${API_BASE_URL}/alerts`, { cache: "no-store" });
  return handleResponse<AlertItem[]>(res);
}

export async function resolveAlert(alertId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, { method: "POST" });
  return handleResponse<void>(res);
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE_URL}/analytics`, { cache: "no-store" });
  return handleResponse<AnalyticsData>(res);
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`, { cache: "no-store" });
  return handleResponse<Category[]>(res);
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch(`${API_BASE_URL}/suppliers`, { cache: "no-store" });
  return handleResponse<Supplier[]>(res);
}

export async function triggerReSeed(): Promise<{ status: string; items_count: number }> {
  const res = await fetch(`${API_BASE_URL}/seed`, { method: "POST" });
  return handleResponse(res);
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

export async function fetchMedicineRequests(): Promise<MedicineRequest[]> {
  const res = await fetch(`${API_BASE_URL}/medicine-requests`, { cache: "no-store" });
  return handleResponse<MedicineRequest[]>(res);
}

export async function createMedicineRequestApi(payload: {
  medicine_name: string;
  requested_quantity: number;
  unit?: string;
  urgency?: string;
  reason?: string;
  notes?: string;
}): Promise<{ message: string; request: MedicineRequest }> {
  const res = await fetch(`${API_BASE_URL}/medicine-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string; request: MedicineRequest }>(res);
}

export async function updateMedicineRequestStatusApi(
  requestId: string,
  action: "APPROVE" | "PARTIALLY_APPROVE" | "REJECT" | "DISPATCH" | "MARK_RECEIVED",
  approvedQuantity: number = 0,
  dispatchedQuantity: number = 0,
  notes: string = ""
): Promise<{ message: string; request: MedicineRequest }> {
  const res = await fetch(`${API_BASE_URL}/medicine-requests/${requestId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      approved_quantity: approvedQuantity,
      dispatched_quantity: dispatchedQuantity,
      notes,
    }),
  });
  return handleResponse<{ message: string; request: MedicineRequest }>(res);
}
