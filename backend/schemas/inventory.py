from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── Category & Supplier Schemas ──────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: Optional[str] = None


class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: Optional[str] = None


# ── Inventory Item Schemas ───────────────────────────────────────────────────

class ItemCreate(BaseModel):
    item_name: str
    category_id: int
    unit: str  # e.g., Strips, Bottles, Kits, Vials, Packs, Rolls
    current_quantity: int = Field(default=0, ge=0)
    min_quantity: int = Field(default=10, ge=0)
    max_quantity: int = Field(default=200, ge=1)
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None  # YYYY-MM-DD
    supplier_id: Optional[int] = None
    notes: Optional[str] = None


class ItemUpdate(BaseModel):
    item_name: Optional[str] = None
    category_id: Optional[int] = None
    unit: Optional[str] = None
    min_quantity: Optional[int] = None
    max_quantity: Optional[int] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    supplier_id: Optional[int] = None


class ItemResponse(BaseModel):
    id: int
    item_id_code: str
    item_name: str
    category_id: int
    category_name: Optional[str] = None
    unit: str
    current_quantity: int
    min_quantity: int
    max_quantity: int
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    last_restocked: Optional[str] = None
    status: str  # Healthy, Low Stock, Out of Stock, Expiring Soon, Expired
    created_at: str
    updated_at: str


# ── Inventory Movement Workflows ─────────────────────────────────────────────

class StockInRequest(BaseModel):
    item_id: int
    quantity: int = Field(..., gt=0, description="Quantity to restock/add")
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    supplier_id: Optional[int] = None
    reference: Optional[str] = Field(default="PHC_REFILL", description="Ref/Invoice number")
    notes: Optional[str] = None


class DistributeRequest(BaseModel):
    item_id: int
    quantity: int = Field(..., gt=0, description="Quantity to distribute")
    beneficiary_ref: str = Field(..., description="Household ID / Beneficiary Name")
    area_village: str = Field(..., description="Ward/Village location")
    purpose: str = Field(..., description="Reason/Campaign e.g., Maternal ANC, Polio Drive")
    notes: Optional[str] = None


class AdjustRequest(BaseModel):
    item_id: int
    new_quantity: int = Field(..., ge=0)
    reason: str
    notes: Optional[str] = None


# ── Transaction & Distribution Records Schemas ──────────────────────────────

class TransactionResponse(BaseModel):
    id: int
    transaction_id_code: str
    item_id: int
    item_name: str
    transaction_type: str  # STOCK_IN, STOCK_OUT, DISTRIBUTION, ADJUSTMENT
    quantity: int
    previous_quantity: int
    new_quantity: int
    date: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


class DistributionRecordResponse(BaseModel):
    id: int
    transaction_id: int
    item_id: int
    item_name: str
    unit: str
    quantity: int
    beneficiary_ref: str
    area_village: str
    purpose: str
    date: str
    notes: Optional[str] = None
    created_at: str


# ── Alert & Dashboard Schemas ────────────────────────────────────────────────

class AlertResponse(BaseModel):
    id: int
    item_id: int
    item_name: str
    alert_type: str  # OUT_OF_STOCK, LOW_STOCK, EXPIRING_SOON, EXPIRED
    severity: str    # CRITICAL, WARNING, INFO
    message: str
    resolved: bool
    created_at: str


class DashboardKPIs(BaseModel):
    total_items: int = 0
    total_stock_units: int = 0
    low_stock_count: int = 0
    out_of_stock_count: int = 0
    expiring_soon_count: int = 0
    expired_count: int = 0
    total_distributed_30days: int = 0
    today_distribution_count: int = 0
    recent_alerts: List[AlertResponse] = []
    top_critical_items: List[ItemResponse] = []


class AnalyticsResponse(BaseModel):
    category_breakdown: List[Dict[str, Any]] = []
    distribution_by_purpose: List[Dict[str, Any]] = []
    top_distributed_items: List[Dict[str, Any]] = []
    daily_distribution_trend: List[Dict[str, Any]] = []
    stock_status_summary: Dict[str, int] = {}
