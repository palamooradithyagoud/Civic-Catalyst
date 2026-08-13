from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import sqlite3

from db import get_db_connection, row_to_dict
from seed_data import seed_database
from schemas.inventory import (
    ItemCreate, ItemUpdate, ItemResponse,
    StockInRequest, DistributeRequest, AdjustRequest,
    TransactionResponse, DistributionRecordResponse,
    AlertResponse, DashboardKPIs, AnalyticsResponse,
    CategoryResponse, SupplierResponse
)

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


# ── Helper Functions ─────────────────────────────────────────────────────────

def calculate_item_status(quantity: int, min_q: int, expiry_date_str: Optional[str]) -> str:
    now = datetime.now()

    if quantity == 0:
        return "Out of Stock"

    if expiry_date_str:
        try:
            exp_dt = datetime.strptime(expiry_date_str, "%Y-%m-%d")
            days_left = (exp_dt - now).days
            if days_left < 0:
                return "Expired"
            elif days_left <= 30:
                return "Expiring Soon"
        except ValueError:
            pass

    if quantity <= min_q:
        return "Low Stock"

    return "Healthy"


def check_and_update_alerts(cursor: sqlite3.Cursor, item_id: int):
    """Re-evaluate and generate/resolve alerts for an item based on its status."""
    cursor.execute("SELECT id, item_name, current_quantity, min_quantity, expiry_date FROM inventory_items WHERE id = ?;", (item_id,))
    item = cursor.fetchone()
    if not item:
        return

    i_id = item["id"]
    i_name = item["item_name"]
    qty = item["current_quantity"]
    min_q = item["min_quantity"]
    exp_date_str = item["expiry_date"]
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Clear existing unresolved alerts for this item to regenerate fresh ones
    cursor.execute("DELETE FROM alerts WHERE item_id = ? AND resolved = 0;", (i_id,))

    if qty == 0:
        cursor.execute("""
        INSERT INTO alerts (item_id, alert_type, severity, message, created_at)
        VALUES (?, 'OUT_OF_STOCK', 'CRITICAL', ?, ?);
        """, (i_id, f"⚠️ CRITICAL: {i_name} is completely out of stock! Immediate PHC refill required.", now_str))
    elif qty <= min_q:
        cursor.execute("""
        INSERT INTO alerts (item_id, alert_type, severity, message, created_at)
        VALUES (?, 'LOW_STOCK', 'WARNING', ?, ?);
        """, (i_id, f"⚠️ LOW STOCK: {i_name} balance ({qty} remaining) is at or below minimum threshold ({min_q}).", now_str))

    if exp_date_str:
        try:
            exp_dt = datetime.strptime(exp_date_str, "%Y-%m-%d")
            days_left = (exp_dt - datetime.now()).days
            if days_left < 0:
                cursor.execute("""
                INSERT INTO alerts (item_id, alert_type, severity, message, created_at)
                VALUES (?, 'EXPIRED', 'CRITICAL', ?, ?);
                """, (i_id, f"🚨 EXPIRED: {i_name} (Batch expired on {exp_date_str}). DO NOT DISTRIBUTE!", now_str))
            elif days_left <= 30:
                cursor.execute("""
                INSERT INTO alerts (item_id, alert_type, severity, message, created_at)
                VALUES (?, 'EXPIRING_SOON', 'WARNING', ?, ?);
                """, (i_id, f"⏳ EXPIRING SOON: {i_name} expires in {days_left} days ({exp_date_str}).", now_str))
        except ValueError:
            pass


# ── Categories & Suppliers Endpoints ─────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM categories ORDER BY name ASC;")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM suppliers ORDER BY name ASC;")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Dashboard KPIs Endpoint ──────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardKPIs)
def get_dashboard_kpis():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total items & stock units
    cursor.execute("SELECT COUNT(*) as total_items, SUM(current_quantity) as total_units FROM inventory_items;")
    tot_row = cursor.fetchone()
    total_items = tot_row["total_items"] if tot_row else 0
    total_stock_units = tot_row["total_units"] if tot_row and tot_row["total_units"] else 0

    # Stock status breakdown
    cursor.execute("SELECT current_quantity, min_quantity, expiry_date FROM inventory_items;")
    items = cursor.fetchall()

    low_stock_count = 0
    out_of_stock_count = 0
    expiring_soon_count = 0
    expired_count = 0

    now = datetime.now()
    for item in items:
        qty = item["current_quantity"]
        min_q = item["min_quantity"]
        exp_str = item["expiry_date"]

        if qty == 0:
            out_of_stock_count += 1
        elif qty <= min_q:
            low_stock_count += 1

        if exp_str:
            try:
                exp_dt = datetime.strptime(exp_str, "%Y-%m-%d")
                days_left = (exp_dt - now).days
                if days_left < 0:
                    expired_count += 1
                elif days_left <= 30:
                    expiring_soon_count += 1
            except ValueError:
                pass

    # Total distributed last 30 days
    date_30_days_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    cursor.execute("""
    SELECT SUM(quantity) as total_dist FROM distribution_records
    WHERE date >= ?;
    """, (date_30_days_ago,))
    dist_row = cursor.fetchone()
    total_distributed_30days = dist_row["total_dist"] if dist_row and dist_row["total_dist"] else 0

    # Today distribution
    today_str = now.strftime("%Y-%m-%d")
    cursor.execute("""
    SELECT SUM(quantity) as today_dist FROM distribution_records
    WHERE date = ?;
    """, (today_str,))
    today_row = cursor.fetchone()
    today_distribution_count = today_row["today_dist"] if today_row and today_row["today_dist"] else 0

    # Recent Alerts
    cursor.execute("""
    SELECT a.id, a.item_id, i.item_name, a.alert_type, a.severity, a.message, a.resolved, a.created_at
    FROM alerts a
    JOIN inventory_items i ON a.item_id = i.id
    WHERE a.resolved = 0
    ORDER BY a.id DESC LIMIT 6;
    """)
    alerts_rows = cursor.fetchall()
    recent_alerts = [dict(r) for r in alerts_rows]

    # Top Critical Items (Out of stock or Low stock)
    cursor.execute("""
    SELECT i.*, c.name as category_name, s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.current_quantity <= i.min_quantity
    ORDER BY i.current_quantity ASC LIMIT 6;
    """)
    critical_rows = cursor.fetchall()
    top_critical_items = []
    for r in critical_rows:
        d = dict(r)
        d["status"] = calculate_item_status(d["current_quantity"], d["min_quantity"], d["expiry_date"])
        top_critical_items.append(d)

    conn.close()

    return {
        "total_items": total_items,
        "total_stock_units": total_stock_units,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "expiring_soon_count": expiring_soon_count,
        "expired_count": expired_count,
        "total_distributed_30days": total_distributed_30days,
        "today_distribution_count": today_distribution_count,
        "recent_alerts": recent_alerts,
        "top_critical_items": top_critical_items
    }


# ── Inventory Items List & Create ────────────────────────────────────────────

@router.get("", response_model=List[ItemResponse])
def list_inventory(
    q: Optional[str] = None,
    category_id: Optional[int] = None,
    status_filter: Optional[str] = Query(default=None, alias="status")
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT i.*, c.name as category_name, s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE 1=1
    """
    params = []

    if q:
        query += " AND (i.item_name LIKE ? OR i.item_id_code LIKE ? OR i.batch_number LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])

    if category_id:
        query += " AND i.category_id = ?"
        params.append(category_id)

    query += " ORDER BY i.id ASC;"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    result = []
    for r in rows:
        d = dict(r)
        item_status = calculate_item_status(d["current_quantity"], d["min_quantity"], d["expiry_date"])
        d["status"] = item_status

        # Apply client-requested status filter if present
        if status_filter:
            norm_filter = status_filter.lower().replace("_", " ")
            norm_status = item_status.lower()
            if norm_filter not in norm_status:
                continue

        result.append(d)

    conn.close()
    return result


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item_in: ItemCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check category exists
    cursor.execute("SELECT id FROM categories WHERE id = ?;", (item_in.category_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid category_id")

    # Generate item_id_code
    cursor.execute("SELECT COUNT(*) as cnt FROM inventory_items;")
    cnt = cursor.fetchone()["cnt"] + 1
    item_code = f"ASH-INV-{cnt:03d}"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today_date = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO inventory_items (
        item_id_code, item_name, category_id, unit, current_quantity,
        min_quantity, max_quantity, batch_number, expiry_date,
        supplier_id, last_restocked, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        item_code, item_in.item_name, item_in.category_id, item_in.unit, item_in.current_quantity,
        item_in.min_quantity, item_in.max_quantity, item_in.batch_number, item_in.expiry_date,
        item_in.supplier_id, today_date, now_str, now_str
    ))
    new_id = cursor.lastrowid

    # Record Initial Stock Transaction
    tx_code = f"TX-INIT-{new_id:03d}"
    cursor.execute("""
    INSERT INTO inventory_transactions (
        transaction_id_code, item_id, transaction_type, quantity,
        previous_quantity, new_quantity, date, reference, notes, created_at
    ) VALUES (?, ?, 'STOCK_IN', ?, 0, ?, ?, 'INITIAL_CREATE', ?, ?);
    """, (
        tx_code, new_id, item_in.current_quantity, item_in.current_quantity,
        today_date, item_in.notes or "Initial item creation in inventory", now_str
    ))

    # Evaluate alerts
    check_and_update_alerts(cursor, new_id)

    conn.commit()

    # Fetch created record
    cursor.execute("""
    SELECT i.*, c.name as category_name, s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.id = ?;
    """, (new_id,))
    row = cursor.fetchone()
    conn.close()

    d = dict(row)
    d["status"] = calculate_item_status(d["current_quantity"], d["min_quantity"], d["expiry_date"])
    return d


# ── Stock In / Restock Workflow ──────────────────────────────────────────────

@router.post("/restock", response_model=ItemResponse)
def restock_inventory_item(req: StockInRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM inventory_items WHERE id = ?;", (req.item_id,))
    item = cursor.fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    prev_qty = item["current_quantity"]
    new_qty = prev_qty + req.quantity
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    today_date = now.strftime("%Y-%m-%d")

    batch = req.batch_number if req.batch_number else item["batch_number"]
    expiry = req.expiry_date if req.expiry_date else item["expiry_date"]
    supplier = req.supplier_id if req.supplier_id else item["supplier_id"]

    cursor.execute("""
    UPDATE inventory_items
    SET current_quantity = ?,
        last_restocked = ?,
        batch_number = ?,
        expiry_date = ?,
        supplier_id = ?,
        updated_at = ?
    WHERE id = ?;
    """, (new_qty, today_date, batch, expiry, supplier, now_str, req.item_id))

    # Log Transaction
    tx_code = f"TX-IN-{int(now.timestamp())}-{req.item_id}"
    cursor.execute("""
    INSERT INTO inventory_transactions (
        transaction_id_code, item_id, transaction_type, quantity,
        previous_quantity, new_quantity, date, reference, notes, created_at
    ) VALUES (?, ?, 'STOCK_IN', ?, ?, ?, ?, ?, ?, ?);
    """, (
        tx_code, req.item_id, req.quantity,
        prev_qty, new_qty, today_date,
        req.reference or "PHC_REFILL", req.notes or f"Restocked +{req.quantity} units from PHC/Depot", now_str
    ))

    # Update Alerts
    check_and_update_alerts(cursor, req.item_id)

    conn.commit()

    # Fetch updated item
    cursor.execute("""
    SELECT i.*, c.name as category_name, s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.id = ?;
    """, (req.item_id,))
    updated_row = cursor.fetchone()
    conn.close()

    d = dict(updated_row)
    d["status"] = calculate_item_status(d["current_quantity"], d["min_quantity"], d["expiry_date"])
    return d


# ── Distribute Supplies Workflow ─────────────────────────────────────────────

@router.post("/distribute", response_model=Dict[str, Any])
def distribute_inventory_item(req: DistributeRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM inventory_items WHERE id = ?;", (req.item_id,))
    item = cursor.fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    cur_qty = item["current_quantity"]
    i_name = item["item_name"]
    expiry_date_str = item["expiry_date"]

    # 1. Validation: Available stock check
    if req.quantity > cur_qty:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for '{i_name}'. Requested {req.quantity} {item['unit']}, but only {cur_qty} available in stock."
        )

    # 2. Validation: Expiry status check
    if expiry_date_str:
        try:
            exp_dt = datetime.strptime(expiry_date_str, "%Y-%m-%d")
            if exp_dt < datetime.now():
                conn.close()
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot distribute expired item '{i_name}'. Batch expired on {expiry_date_str}."
                )
        except ValueError:
            pass

    new_qty = cur_qty - req.quantity
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    today_date = now.strftime("%Y-%m-%d")

    # Update stock quantity
    cursor.execute("""
    UPDATE inventory_items
    SET current_quantity = ?,
        updated_at = ?
    WHERE id = ?;
    """, (new_qty, now_str, req.item_id))

    # Log Transaction
    tx_code = f"TX-DIST-{int(now.timestamp())}-{req.item_id}"
    cursor.execute("""
    INSERT INTO inventory_transactions (
        transaction_id_code, item_id, transaction_type, quantity,
        previous_quantity, new_quantity, date, reference, notes, created_at
    ) VALUES (?, ?, 'DISTRIBUTION', ?, ?, ?, ?, ?, ?, ?);
    """, (
        tx_code, req.item_id, req.quantity,
        cur_qty, new_qty, today_date,
        req.beneficiary_ref, f"Distributed to {req.beneficiary_ref} ({req.area_village}) - {req.purpose}", now_str
    ))
    tx_id = cursor.lastrowid

    # Create Distribution Record
    cursor.execute("""
    INSERT INTO distribution_records (
        transaction_id, item_id, quantity, beneficiary_ref,
        area_village, purpose, date, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        tx_id, req.item_id, req.quantity, req.beneficiary_ref,
        req.area_village, req.purpose, today_date, req.notes or "Provided during field visit", now_str
    ))
    dist_id = cursor.lastrowid

    # Update Alerts
    check_and_update_alerts(cursor, req.item_id)

    conn.commit()

    # Fetch updated item
    cursor.execute("""
    SELECT i.*, c.name as category_name, s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.id = ?;
    """, (req.item_id,))
    updated_item = dict(cursor.fetchone())
    updated_item["status"] = calculate_item_status(updated_item["current_quantity"], updated_item["min_quantity"], updated_item["expiry_date"])

    conn.close()

    return {
        "status": "success",
        "message": f"Successfully distributed {req.quantity} {item['unit']} of '{i_name}' to {req.beneficiary_ref}.",
        "distribution_id": dist_id,
        "remaining_quantity": new_qty,
        "item": updated_item
    }


# ── Stock Adjustment ─────────────────────────────────────────────────────────

@router.post("/adjust", response_model=ItemResponse)
def adjust_inventory_item(req: AdjustRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM inventory_items WHERE id = ?;", (req.item_id,))
    item = cursor.fetchone()
    if not item:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    prev_qty = item["current_quantity"]
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    today_date = now.strftime("%Y-%m-%d")

    cursor.execute("""
    UPDATE inventory_items
    SET current_quantity = ?, updated_at = ?
    WHERE id = ?;
    """, (req.new_quantity, now_str, req.item_id))

    tx_code = f"TX-ADJ-{int(now.timestamp())}-{req.item_id}"
    qty_diff = req.new_quantity - prev_qty
    cursor.execute("""
    INSERT INTO inventory_transactions (
        transaction_id_code, item_id, transaction_type, quantity,
        previous_quantity, new_quantity, date, reference, notes, created_at
    ) VALUES (?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?, ?);
    """, (
        tx_code, req.item_id, abs(qty_diff),
        prev_qty, req.new_quantity, today_date,
        "MANUAL_ADJUSTMENT", f"Reason: {req.reason}. {req.notes or ''}", now_str
    ))

    check_and_update_alerts(cursor, req.item_id)
    conn.commit()

    cursor.execute("""
    SELECT i.*, c.name as category_name, s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.id = ?;
    """, (req.item_id,))
    updated_item = dict(cursor.fetchone())
    updated_item["status"] = calculate_item_status(updated_item["current_quantity"], updated_item["min_quantity"], updated_item["expiry_date"])
    conn.close()

    return updated_item


# ── Audit Log & Distribution Records History ─────────────────────────────────

@router.get("/transactions", response_model=List[TransactionResponse])
def list_transactions(
    q: Optional[str] = None,
    item_id: Optional[int] = None,
    tx_type: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT t.*, i.item_name
    FROM inventory_transactions t
    JOIN inventory_items i ON t.item_id = i.id
    WHERE 1=1
    """
    params = []

    if q:
        query += " AND (i.item_name LIKE ? OR t.transaction_id_code LIKE ? OR t.reference LIKE ? OR t.notes LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"])

    if item_id:
        query += " AND t.item_id = ?"
        params.append(item_id)

    if tx_type:
        query += " AND t.transaction_type = ?"
        params.append(tx_type.upper())

    query += " ORDER BY t.id DESC LIMIT 100;"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


@router.get("/distributions", response_model=List[DistributionRecordResponse])
def list_distributions(
    q: Optional[str] = None,
    area_village: Optional[str] = None,
    item_id: Optional[int] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT d.*, i.item_name, i.unit
    FROM distribution_records d
    JOIN inventory_items i ON d.item_id = i.id
    WHERE 1=1
    """
    params = []

    if q:
        query += " AND (i.item_name LIKE ? OR d.beneficiary_ref LIKE ? OR d.purpose LIKE ? OR d.area_village LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"])

    if area_village:
        query += " AND d.area_village = ?"
        params.append(area_village)

    if item_id:
        query += " AND d.item_id = ?"
        params.append(item_id)

    query += " ORDER BY d.id DESC LIMIT 100;"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


# ── Alerts Center ────────────────────────────────────────────────────────────

@router.get("/alerts", response_model=List[AlertResponse])
def get_active_alerts():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT a.id, a.item_id, i.item_name, a.alert_type, a.severity, a.message, a.resolved, a.created_at
    FROM alerts a
    JOIN inventory_items i ON a.item_id = i.id
    WHERE a.resolved = 0
    ORDER BY a.id DESC;
    """)
    rows = cursor.fetchall()
    conn.close()

    return [dict(r) for r in rows]


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("UPDATE alerts SET resolved = 1 WHERE id = ?;", (alert_id,))
    conn.commit()
    conn.close()

    return {"status": "success", "message": f"Alert {alert_id} resolved."}


# ── Analytics Endpoint ───────────────────────────────────────────────────────

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Category Stock Allocation Breakdown
    cursor.execute("""
    SELECT c.name as category_name, COUNT(i.id) as item_count, SUM(i.current_quantity) as total_quantity
    FROM categories c
    LEFT JOIN inventory_items i ON c.id = i.category_id
    GROUP BY c.id;
    """)
    cat_rows = cursor.fetchall()
    category_breakdown = [{"category": r["category_name"], "item_count": r["item_count"], "total_quantity": r["total_quantity"] or 0} for r in cat_rows]

    # 2. Distribution by Purpose
    cursor.execute("""
    SELECT purpose, COUNT(*) as record_count, SUM(quantity) as total_quantity
    FROM distribution_records
    GROUP BY purpose
    ORDER BY total_quantity DESC;
    """)
    purp_rows = cursor.fetchall()
    distribution_by_purpose = [{"purpose": r["purpose"], "record_count": r["record_count"], "total_quantity": r["total_quantity"]} for r in purp_rows]

    # 3. Top Distributed Items
    cursor.execute("""
    SELECT i.item_name, i.unit, SUM(d.quantity) as total_distributed
    FROM distribution_records d
    JOIN inventory_items i ON d.item_id = i.id
    GROUP BY d.item_id
    ORDER BY total_distributed DESC LIMIT 5;
    """)
    top_rows = cursor.fetchall()
    top_distributed_items = [{"item_name": r["item_name"], "unit": r["unit"], "total_distributed": r["total_distributed"]} for r in top_rows]

    # 4. Daily Distribution Trend (last 14 days)
    fourteen_days_ago = (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")
    cursor.execute("""
    SELECT date, SUM(quantity) as total_quantity, COUNT(*) as distributions_count
    FROM distribution_records
    WHERE date >= ?
    GROUP BY date
    ORDER BY date ASC;
    """, (fourteen_days_ago,))
    trend_rows = cursor.fetchall()
    daily_distribution_trend = [{"date": r["date"], "total_quantity": r["total_quantity"], "count": r["distributions_count"]} for r in trend_rows]

    # 5. Stock Status Summary
    cursor.execute("SELECT current_quantity, min_quantity, expiry_date FROM inventory_items;")
    items = cursor.fetchall()
    status_counts = {"Healthy": 0, "Low Stock": 0, "Out of Stock": 0, "Expiring Soon": 0, "Expired": 0}
    now = datetime.now()
    for item in items:
        st = calculate_item_status(item["current_quantity"], item["min_quantity"], item["expiry_date"])
        status_counts[st] = status_counts.get(st, 0) + 1

    conn.close()

    return {
        "category_breakdown": category_breakdown,
        "distribution_by_purpose": distribution_by_purpose,
        "top_distributed_items": top_distributed_items,
        "daily_distribution_trend": daily_distribution_trend,
        "stock_status_summary": status_counts
    }


# ── Seed Endpoint ────────────────────────────────────────────────────────────

@router.post("/seed")
def trigger_reseed():
    result = seed_database(force=True)
    return result
