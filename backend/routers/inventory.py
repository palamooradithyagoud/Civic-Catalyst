from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel

import db_supabase
from schemas.inventory import (
    ItemCreate, ItemUpdate, ItemResponse,
    StockInRequest, DistributeRequest, AdjustRequest,
    TransactionResponse, DistributionRecordResponse,
    AlertResponse, DashboardKPIs, AnalyticsResponse,
    CategoryResponse, SupplierResponse
)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


# ── 1. Inventory Items & Dashboard ───────────────────────────────────────────

@router.get("", response_model=List[ItemResponse])
def list_inventory(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status")
):
    items = db_supabase.get_items()
    filtered = items

    if q:
        q_lower = q.lower()
        filtered = [
            i for i in filtered
            if q_lower in i["item_name"].lower() or q_lower in i["item_id_code"].lower()
        ]

    if category_id:
        filtered = [i for i in filtered if i.get("category_id") == category_id]

    if status_filter and status_filter.upper() != "ALL":
        filtered = [i for i in filtered if i["status"].replace(" ", "_").upper() == status_filter.replace(" ", "_").upper()]

    return filtered


@router.get("/dashboard", response_model=DashboardKPIs)
def get_dashboard_kpis():
    items = db_supabase.get_items()
    alerts = db_supabase.get_alerts()
    dists = db_supabase.get_distributions()

    total_units = sum(i["current_quantity"] for i in items)
    low_stock = sum(1 for i in items if i["status"] == "Low Stock")
    out_stock = sum(1 for i in items if i["status"] == "Out of Stock")
    expiring = sum(1 for i in items if i["status"] == "Expiring Soon")
    expired = sum(1 for i in items if i["status"] == "Expired")

    return DashboardKPIs(
        total_items=len(items),
        total_stock_units=total_units,
        low_stock_count=low_stock,
        out_of_stock_count=out_stock,
        expiring_soon_count=expiring,
        expired_count=expired,
        total_distributed_30days=sum(d["quantity"] for d in dists),
        today_distribution_count=len(dists),
        recent_alerts=alerts[:5],
        top_critical_items=[i for i in items if i["status"] in ["Out of Stock", "Low Stock"]]
    )


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ItemCreate):
    try:
        return db_supabase.create_item(item_in.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 2. Restock / Stock In ───────────────────────────────────────────────────

@router.post("/restock")
def restock_item(req: StockInRequest):
    try:
        updated = db_supabase.restock_item(
            item_id=req.item_id,
            quantity=req.quantity,
            batch_number=req.batch_number,
            expiry_date=req.expiry_date,
            supplier_id=req.supplier_id,
            ref=req.reference,
            notes=req.notes
        )
        return {"message": f"Successfully restocked {req.quantity} units.", "item": updated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 3. Distribute Item ───────────────────────────────────────────────────────

@router.post("/distribute")
def distribute_item(req: DistributeRequest):
    try:
        res = db_supabase.distribute_item(
            item_id=req.item_id,
            quantity=req.quantity,
            beneficiary_ref=req.beneficiary_ref,
            area_village=req.area_village,
            purpose=req.purpose,
            notes=req.notes
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 4. Transactions & Distributions ──────────────────────────────────────────

@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions():
    return db_supabase.get_transactions()


@router.get("/distributions", response_model=List[DistributionRecordResponse])
def get_distributions():
    return db_supabase.get_distributions()


# ── 5. Alerts & Resolution ──────────────────────────────────────────────────

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts():
    return db_supabase.get_alerts()


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    try:
        return db_supabase.resolve_alert(alert_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 6. Analytics & Reports ──────────────────────────────────────────────────

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics():
    items = db_supabase.get_items()
    dists = db_supabase.get_distributions()

    cat_map: Dict[str, Dict[str, Any]] = {}
    for item in items:
        cat = item.get("category_name", "General")
        if cat not in cat_map:
            cat_map[cat] = {"category": cat, "item_count": 0, "total_quantity": 0}
        cat_map[cat]["item_count"] += 1
        cat_map[cat]["total_quantity"] += item.get("current_quantity", 0)

    status_counts: Dict[str, int] = {}
    for item in items:
        st = item.get("status", "Healthy")
        status_counts[st] = status_counts.get(st, 0) + 1

    purpose_map: Dict[str, Dict[str, Any]] = {}
    for d in dists:
        p = d.get("purpose", "Other")
        if p not in purpose_map:
            purpose_map[p] = {"purpose": p, "record_count": 0, "total_quantity": 0}
        purpose_map[p]["record_count"] += 1
        purpose_map[p]["total_quantity"] += d.get("quantity", 0)

    item_dist_map: Dict[str, Dict[str, Any]] = {}
    for d in dists:
        name = d.get("item_name", "Unknown")
        if name not in item_dist_map:
            item_dist_map[name] = {"item_name": name, "unit": d.get("unit", "Units"), "total_distributed": 0}
        item_dist_map[name]["total_distributed"] += d.get("quantity", 0)

    top_distributed = sorted(list(item_dist_map.values()), key=lambda x: x["total_distributed"], reverse=True)[:5]

    trend_map: Dict[str, Dict[str, Any]] = {}
    for d in dists:
        day = str(d.get("created_at") or d.get("date") or "")[:10]
        if day:
            if day not in trend_map:
                trend_map[day] = {"date": day, "total_quantity": 0, "count": 0}
            trend_map[day]["total_quantity"] += d.get("quantity", 0)
            trend_map[day]["count"] += 1

    daily_trend = sorted(list(trend_map.values()), key=lambda x: x["date"])[-7:]

    return AnalyticsResponse(
        category_breakdown=list(cat_map.values()),
        distribution_by_purpose=list(purpose_map.values()),
        top_distributed_items=top_distributed,
        daily_distribution_trend=daily_trend,
        stock_status_summary=status_counts
    )


# ── 7. Categories & Suppliers ────────────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories():
    return db_supabase.get_categories()


@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers():
    return db_supabase.get_suppliers()


# ── 8. ASHA → Mandal Medicine Requests ──────────────────────────────────────

class MedicineRequestCreate(BaseModel):
    medicine_name: str
    requested_quantity: int
    unit: str = "Units"
    urgency: str = "Normal"
    reason: str
    notes: Optional[str] = None
    asha_worker_name: Optional[str] = "Sunita Devi (Ward 3 & 4)"


class MedicineRequestStatusUpdate(BaseModel):
    action: str  # APPROVE, PARTIALLY_APPROVE, REJECT, DISPATCH, MARK_RECEIVED
    approved_quantity: Optional[int] = None
    dispatched_quantity: Optional[int] = None
    notes: Optional[str] = None


@router.get("/medicine-requests")
def get_medicine_requests():
    return db_supabase.get_medicine_requests()


@router.post("/medicine-requests")
def create_medicine_request(req: MedicineRequestCreate):
    try:
        data = db_supabase.create_medicine_request(req.dict())
        return {"message": "Medicine request created successfully.", "request": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/medicine-requests/{request_id}/status")
def update_medicine_request_status(request_id: str, body: MedicineRequestStatusUpdate):
    try:
        updated = db_supabase.update_medicine_request_status(
            request_id=request_id,
            action=body.action,
            approved_qty=body.approved_quantity,
            dispatched_qty=body.dispatched_quantity,
            notes=body.notes
        )
        return {"message": f"Request {request_id} updated to {updated['status']}.", "request": updated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 9. Seed / Reseed Endpoint ────────────────────────────────────────────────
@router.post("/seed")
def seed_inventory_data():
    return db_supabase.seed_data()
