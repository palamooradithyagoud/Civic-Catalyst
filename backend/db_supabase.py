"""
Civic Catalyst — Supabase Medical Inventory & Database Manager
All data is stored in and read from Supabase cloud — no local/in-memory fallbacks.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from supabase_client import supabase


# ── Helper Status Calculator ──────────────────────────────────────────────────

def calculate_status(qty: int, min_q: int, expiry_str: Optional[str]) -> str:
    if qty == 0:
        return "Out of Stock"
    if expiry_str:
        try:
            exp = datetime.strptime(expiry_str, "%Y-%m-%d")
            if (exp - datetime.now()).days < 0:
                return "Expired"
            elif (exp - datetime.now()).days <= 30:
                return "Expiring Soon"
        except ValueError:
            pass
    if qty <= min_q:
        return "Low Stock"
    return "Healthy"


def seed_data() -> Dict[str, Any]:
    """Returns current item count from Supabase."""
    res = supabase.table("inventory_items").select("id", count="exact").execute()
    count = res.count if res.count is not None else 0
    return {"status": "success", "items_count": count}


# ── Database Read Operations ──────────────────────────────────────────────────

def get_items() -> List[Dict[str, Any]]:
    """Fetch all medical inventory items from Supabase."""
    res = supabase.table("inventory_items").select("*").order("id", desc=False).execute()
    return res.data or []


def get_categories() -> List[Dict[str, Any]]:
    res = supabase.table("categories").select("*").order("id", desc=False).execute()
    return res.data or []


def get_suppliers() -> List[Dict[str, Any]]:
    res = supabase.table("suppliers").select("*").order("id", desc=False).execute()
    return res.data or []


def get_transactions() -> List[Dict[str, Any]]:
    res = supabase.table("inventory_transactions").select("*").order("id", desc=True).execute()
    return res.data or []


def get_distributions() -> List[Dict[str, Any]]:
    res = supabase.table("distribution_records").select("*").order("id", desc=True).execute()
    return res.data or []


def get_alerts() -> List[Dict[str, Any]]:
    """Fetch unresolved alerts from Supabase and auto-generate for critical stock levels."""
    # Fetch existing alerts from DB
    res = supabase.table("alerts").select("*").eq("resolved", False).order("id", desc=True).execute()
    db_alerts = res.data or []

    # Auto-generate live alerts for critical items not already alerted
    items_res = supabase.table("inventory_items").select("*").execute()
    items = items_res.data or []

    alerted_item_ids = {a["item_id"] for a in db_alerts}
    generated_alerts = []

    for item in items:
        status = calculate_status(item["current_quantity"], item["min_quantity"], item.get("expiry_date"))
        if item["current_quantity"] <= 10 or status in ["Out of Stock", "Low Stock", "Expiring Soon", "Expired"]:
            if item["id"] in alerted_item_ids:
                continue  # Already have an alert for this item
            severity = "CRITICAL" if item["current_quantity"] == 0 or status == "Expired" else "WARNING"
            msg = (
                f"🚨 [Urgent Mandal Requisition] {item['item_name']} stock dropped to "
                f"{item['current_quantity']} {item['unit']} (<= 10 units safety threshold). "
                f"Auto-reported to Mandal Hospital for emergency supply dispatch."
            )
            generated_alerts.append({
                "id": -(item["id"]),  # Negative ID for auto-generated (not persisted)
                "item_id": item["id"],
                "item_name": item["item_name"],
                "alert_type": "MANDAL_REQUISITION_REPORTED",
                "severity": severity,
                "message": msg,
                "resolved": False,
                "created_at": datetime.now().isoformat(),
            })

    return db_alerts + generated_alerts


def resolve_alert(alert_id: int) -> bool:
    if alert_id < 0:
        return True  # Auto-generated alert, nothing to persist
    supabase.table("alerts").update({"resolved": True}).eq("id", alert_id).execute()
    return True


# ── Create / Update Operations ────────────────────────────────────────────────

def create_item(data: Dict[str, Any]) -> Dict[str, Any]:
    now_str = datetime.now().isoformat()
    status = calculate_status(
        data.get("current_quantity", 50),
        data.get("min_quantity", 15),
        data.get("expiry_date"),
    )

    # Get next item code
    res = supabase.table("inventory_items").select("id").order("id", desc=True).limit(1).execute()
    next_id = (res.data[0]["id"] + 1) if res.data else 1
    item_code = f"ASH-INV-{next_id:03d}"

    row = {
        "item_id_code": item_code,
        "item_name": data["item_name"],
        "category_id": data.get("category_id", 1),
        "category_name": data.get("category_name", "Medicines"),
        "unit": data.get("unit", "Strips"),
        "current_quantity": data.get("current_quantity", 50),
        "min_quantity": data.get("min_quantity", 15),
        "max_quantity": data.get("max_quantity", 250),
        "batch_number": data.get("batch_number", f"BAT-NEW-{datetime.now().strftime('%Y%m%d')}"),
        "expiry_date": data.get("expiry_date", "2027-12-31"),
        "supplier_id": data.get("supplier_id", 1),
        "supplier_name": data.get("supplier_name", "District Medical Warehouse"),
        "last_restocked": datetime.now().strftime("%Y-%m-%d"),
        "status": status,
        "created_at": now_str,
        "updated_at": now_str,
    }

    result = supabase.table("inventory_items").insert(row).execute()
    if not result.data:
        raise ValueError("Failed to create inventory item in Supabase")
    return result.data[0]


def restock_item(
    item_id: int,
    quantity: int,
    batch_number: Optional[str] = None,
    expiry_date: Optional[str] = None,
    supplier_id: Optional[int] = None,
    ref: str = "MANDAL_ACCEPTED_AND_DELIVERED",
    notes: str = "",
) -> Dict[str, Any]:
    now_str = datetime.now().isoformat()

    # Fetch current item from Supabase
    res = supabase.table("inventory_items").select("*").eq("id", item_id).single().execute()
    if not res.data:
        raise ValueError(f"Item ID {item_id} not found in Supabase")

    item = res.data
    prev_qty = item["current_quantity"]
    new_qty = prev_qty + quantity
    new_expiry = expiry_date or (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
    new_status = calculate_status(new_qty, item["min_quantity"], new_expiry)

    # Update item in Supabase
    updated_res = supabase.table("inventory_items").update({
        "current_quantity": new_qty,
        "status": new_status,
        "batch_number": batch_number or f"BAT-MANDAL-{datetime.now().strftime('%Y%m%d')}",
        "expiry_date": new_expiry,
        "last_restocked": datetime.now().strftime("%Y-%m-%d"),
        "updated_at": now_str,
    }).eq("id", item_id).execute()

    # Get next transaction code
    tx_res = supabase.table("inventory_transactions").select("id").order("id", desc=True).limit(1).execute()
    tx_next = (tx_res.data[0]["id"] + 1) if tx_res.data else 1

    # Log transaction
    tx = {
        "transaction_id_code": f"TX-RESTOCK-{tx_next:03d}",
        "item_id": item_id,
        "item_name": item["item_name"],
        "transaction_type": "STOCK_IN",
        "quantity": quantity,
        "previous_quantity": prev_qty,
        "new_quantity": new_qty,
        "date": now_str,
        "reference": ref or "MANDAL_ACCEPTED_AND_DELIVERED",
        "notes": notes or f"✓ Delivered by Mandal Central Hospital HQ (+{quantity} {item['unit']}). Added to village inventory.",
        "created_at": now_str,
    }
    supabase.table("inventory_transactions").insert(tx).execute()

    # Clear resolved alerts for this item
    supabase.table("alerts").update({"resolved": True}).eq("item_id", item_id).execute()

    return updated_res.data[0] if updated_res.data else item


def request_mandal_requisition(item_id: int, quantity: int, reason: str = "") -> Dict[str, Any]:
    now_str = datetime.now().isoformat()

    res = supabase.table("inventory_items").select("*").eq("id", item_id).single().execute()
    if not res.data:
        raise ValueError(f"Item ID {item_id} not found")
    item = res.data

    tx_res = supabase.table("inventory_transactions").select("id").order("id", desc=True).limit(1).execute()
    tx_next = (tx_res.data[0]["id"] + 1) if tx_res.data else 1

    tx = {
        "transaction_id_code": f"REQ-{tx_next:03d}",
        "item_id": item_id,
        "item_name": item["item_name"],
        "transaction_type": "REQUISITION_PENDING",
        "quantity": quantity,
        "previous_quantity": item["current_quantity"],
        "new_quantity": item["current_quantity"],
        "date": now_str,
        "reference": "REQUISITION_PENDING",
        "notes": f"Pending Requisition ({reason or 'ASHA Field Requisition'}). Waiting for Mandal HQ Delivery.",
        "created_at": now_str,
    }
    tx_result = supabase.table("inventory_transactions").insert(tx).execute()

    # Create alert for the requisition
    alert_msg = f"📩 [ASHA Requisition Submitted] Request for {quantity} {item['unit']} of '{item['item_name']}' submitted to Mandal HQ. Reason: {reason or 'Field Refill'}"
    supabase.table("alerts").insert({
        "item_id": item_id,
        "item_name": item["item_name"],
        "alert_type": "MANDAL_REQUISITION_REPORTED",
        "severity": "WARNING",
        "message": alert_msg,
        "resolved": False,
        "created_at": now_str,
    }).execute()

    return tx_result.data[0] if tx_result.data else tx


def distribute_item(
    item_id: int,
    quantity: int,
    beneficiary: str,
    area_village: str,
    purpose: str = "",
    notes: str = "",
) -> Dict[str, Any]:
    now_str = datetime.now().isoformat()

    res = supabase.table("inventory_items").select("*").eq("id", item_id).single().execute()
    if not res.data:
        raise ValueError(f"Item ID {item_id} not found")
    item = res.data

    if item["current_quantity"] < quantity:
        raise ValueError(f"Insufficient stock for {item['item_name']}. Available: {item['current_quantity']}")

    prev_qty = item["current_quantity"]
    new_qty = prev_qty - quantity
    new_status = calculate_status(new_qty, item["min_quantity"], item.get("expiry_date"))

    # Update inventory
    supabase.table("inventory_items").update({
        "current_quantity": new_qty,
        "status": new_status,
        "updated_at": now_str,
    }).eq("id", item_id).execute()

    # Log transaction
    tx_res = supabase.table("inventory_transactions").select("id").order("id", desc=True).limit(1).execute()
    tx_next = (tx_res.data[0]["id"] + 1) if tx_res.data else 1
    tx_code = f"TX-DIST-{tx_next:03d}"

    tx = {
        "transaction_id_code": tx_code,
        "item_id": item_id,
        "item_name": item["item_name"],
        "transaction_type": "DISTRIBUTION",
        "quantity": quantity,
        "previous_quantity": prev_qty,
        "new_quantity": new_qty,
        "date": now_str,
        "reference": f"DIST-{area_village}",
        "notes": f"Beneficiary: {beneficiary} ({area_village})",
        "created_at": now_str,
    }
    tx_result = supabase.table("inventory_transactions").insert(tx).execute()
    tx_id = tx_result.data[0]["id"] if tx_result.data else 1

    # Log distribution record
    dist = {
        "transaction_id": tx_id,
        "item_id": item_id,
        "item_name": item["item_name"],
        "unit": item.get("unit", "Units"),
        "quantity": quantity,
        "beneficiary_ref": beneficiary,
        "area_village": area_village,
        "purpose": purpose or "Healthcare Distribution",
        "date": now_str,
        "notes": notes,
        "created_at": now_str,
    }
    dist_result = supabase.table("distribution_records").insert(dist).execute()
    dist_id = dist_result.data[0]["id"] if dist_result.data else 1

    # Auto-generate alert if stock <= 10
    if new_qty <= 10:
        alert_msg = (
            f"🚨 [Urgent Mandal Requisition] Stock for '{item['item_name']}' dropped to "
            f"{new_qty} {item['unit']} (<= 10 units). Auto-reported to Mandal Hospital for emergency delivery."
        )
        supabase.table("alerts").insert({
            "item_id": item_id,
            "item_name": item["item_name"],
            "alert_type": "MANDAL_REQUISITION_REPORTED",
            "severity": "CRITICAL" if new_qty == 0 else "WARNING",
            "message": alert_msg,
            "resolved": False,
            "created_at": now_str,
        }).execute()

    return {
        "status": "success",
        "message": f"Distributed {quantity} {item['unit']} to {beneficiary}",
        "distribution_id": dist_id,
        "remaining_quantity": new_qty,
        "item": {**item, "current_quantity": new_qty, "status": new_status},
    }


# ── Medicine Request Workflow ──────────────────────────────────────────────────

def get_medicine_requests() -> List[Dict[str, Any]]:
    res = supabase.table("medicine_requests").select("*").order("created_at", desc=True).execute()
    return res.data or []


def create_medicine_request(data: Dict[str, Any]) -> Dict[str, Any]:
    now_str = datetime.now().isoformat()

    # Generate unique request ID
    count_res = supabase.table("medicine_requests").select("id").order("id", desc=True).limit(1).execute()
    next_id = (count_res.data[0]["id"] + 1) if count_res.data else 1
    request_id = f"REQ-{datetime.now().strftime('%Y%m%d')}-{next_id:03d}"

    row = {
        "request_id": request_id,
        "asha_worker_name": data.get("asha_worker_name", "Sunita Devi (Ward 3 & 4)"),
        "medicine_name": data["medicine_name"],
        "requested_quantity": int(data["requested_quantity"]),
        "approved_quantity": 0,
        "dispatched_quantity": 0,
        "unit": data.get("unit", "Units"),
        "urgency": data.get("urgency", "Normal"),
        "reason": data.get("reason", "ASHA Field Requisition"),
        "notes": data.get("notes", ""),
        "status": "PENDING",
        "created_at": now_str,
        "updated_at": now_str,
    }

    result = supabase.table("medicine_requests").insert(row).execute()
    if not result.data:
        raise ValueError("Failed to create medicine request in Supabase")

    saved = result.data[0]

    # Create alert for Mandal HQ
    urgency = row["urgency"]
    severity = "CRITICAL" if urgency == "Urgent" else ("WARNING" if urgency == "High" else "INFO")
    supabase.table("alerts").insert({
        "item_id": 0,
        "item_name": row["medicine_name"],
        "alert_type": "ASHA_MEDICINE_REQUEST",
        "severity": severity,
        "message": (
            f"📩 [New Request {request_id}] {row['asha_worker_name']} requested "
            f"{row['requested_quantity']} {row['unit']} of {row['medicine_name']} "
            f"({urgency} urgency). Reason: {row['reason']}"
        ),
        "resolved": False,
        "created_at": now_str,
    }).execute()

    return saved


def update_medicine_request_status(
    request_id: str,
    action: str,
    approved_qty: Optional[int] = None,
    dispatched_qty: Optional[int] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    now_str = datetime.now().isoformat()

    # Fetch the request from Supabase
    res = supabase.table("medicine_requests").select("*").eq("request_id", request_id).single().execute()
    if not res.data:
        raise ValueError(f"Request ID {request_id} not found in Supabase")

    req = res.data
    act = action.upper()
    update_payload: Dict[str, Any] = {"updated_at": now_str}

    if act in ["APPROVE", "APPROVED"]:
        update_payload["status"] = "APPROVED"
        update_payload["approved_quantity"] = approved_qty if approved_qty is not None else req["requested_quantity"]

    elif act in ["PARTIALLY_APPROVE", "PARTIAL_APPROVE"]:
        update_payload["status"] = "PARTIALLY_APPROVED"
        update_payload["approved_quantity"] = approved_qty if approved_qty is not None else req["requested_quantity"]

    elif act in ["REJECT", "REJECTED"]:
        update_payload["status"] = "REJECTED"
        if notes:
            update_payload["notes"] = notes

    elif act in ["DISPATCH", "DISPATCHED", "SEND"]:
        update_payload["status"] = "DISPATCHED"
        qty_to_send = dispatched_qty if (dispatched_qty is not None and dispatched_qty > 0) else (req["approved_quantity"] or req["requested_quantity"])
        update_payload["dispatched_quantity"] = qty_to_send
        update_payload["dispatch_date"] = now_str

        # Auto-restock matching inventory item
        items_res = supabase.table("inventory_items").select("*").execute()
        items = items_res.data or []
        matching_item = next(
            (i for i in items if i["item_name"].lower() in req["medicine_name"].lower() or req["medicine_name"].lower() in i["item_name"].lower()),
            None,
        )
        if matching_item:
            restock_item(matching_item["id"], qty_to_send, ref=f"DISPATCH-{request_id}", notes=f"Dispatched by Mandal HQ for request {request_id}")
        else:
            create_item({
                "item_name": req["medicine_name"],
                "category_id": 1,
                "unit": req.get("unit", "Strips"),
                "current_quantity": qty_to_send,
                "min_quantity": 10,
                "max_quantity": 250,
                "batch_number": f"BAT-MANDAL-{datetime.now().strftime('%Y%m%d')}",
                "expiry_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
                "supplier_id": 1,
            })

    elif act in ["MARK_RECEIVED", "RECEIVED"]:
        update_payload["status"] = "RECEIVED"
        qty_received = req["dispatched_quantity"] or req["approved_quantity"] or req["requested_quantity"]
        items_res = supabase.table("inventory_items").select("*").execute()
        items = items_res.data or []
        matching_item = next(
            (i for i in items if i["item_name"].lower() in req["medicine_name"].lower() or req["medicine_name"].lower() in i["item_name"].lower()),
            None,
        )
        if matching_item:
            restock_item(matching_item["id"], qty_received, ref=f"RECEIVE-{request_id}", notes=f"Received & Verified by ASHA for request {request_id}")
        else:
            create_item({
                "item_name": req["medicine_name"],
                "category_id": 1,
                "unit": req.get("unit", "Strips"),
                "current_quantity": qty_received,
                "min_quantity": 10,
                "max_quantity": 250,
            })

    if notes and "notes" not in update_payload:
        update_payload["notes"] = notes

    result = supabase.table("medicine_requests").update(update_payload).eq("request_id", request_id).execute()
    if not result.data:
        raise ValueError(f"Failed to update medicine request {request_id} in Supabase")

    return result.data[0]
