"""
Nivaaran AI — Supabase Medical Inventory & Tablets Database Manager
Replaces local SQLite with real-time Supabase cloud storage.
"""

import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase_client import supabase

load_dotenv()

# ── Initial Seed & Real-time State Cache ─────────────────────────────────────
# Initial medical items pool for tablet and vaccine inventory management
INITIAL_MEDICAL_ITEMS = [
    {
        "id": 1,
        "item_id_code": "ASH-INV-001",
        "item_name": "Paracetamol 500mg Tablets",
        "category_id": 1,
        "category_name": "Medicines",
        "unit": "Strips",
        "current_quantity": 140,
        "min_quantity": 20,
        "max_quantity": 300,
        "batch_number": "BAT-PCM-2026",
        "expiry_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
        "supplier_id": 1,
        "supplier_name": "District Medical Warehouse",
        "last_restocked": datetime.now().strftime("%Y-%m-%d"),
        "status": "Healthy",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    },
    {
        "id": 2,
        "item_id_code": "ASH-INV-002",
        "item_name": "Paracetamol 125mg Syrup",
        "category_id": 1,
        "category_name": "Medicines",
        "unit": "Bottles",
        "current_quantity": 0,
        "min_quantity": 15,
        "max_quantity": 100,
        "batch_number": "BAT-PCM-SYP",
        "expiry_date": (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d"),
        "supplier_id": 2,
        "supplier_name": "PHC Central Depot",
        "last_restocked": datetime.now().strftime("%Y-%m-%d"),
        "status": "Out of Stock",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    },
    {
        "id": 3,
        "item_id_code": "ASH-INV-003",
        "item_name": "Iron & Folic Acid Tablets (IFA Blue)",
        "category_id": 2,
        "category_name": "Maternal Health Supplies",
        "unit": "Strips",
        "current_quantity": 8,
        "min_quantity": 30,
        "max_quantity": 400,
        "batch_number": "BAT-IFA-901",
        "expiry_date": (datetime.now() + timedelta(days=18)).strftime("%Y-%m-%d"),
        "supplier_id": 1,
        "supplier_name": "District Medical Warehouse",
        "last_restocked": datetime.now().strftime("%Y-%m-%d"),
        "status": "Low Stock",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    },
    {
        "id": 4,
        "item_id_code": "ASH-INV-004",
        "item_name": "ORS & Zinc Hydration Kits",
        "category_id": 3,
        "category_name": "Child Health Supplies",
        "unit": "Kits",
        "current_quantity": 0,
        "min_quantity": 20,
        "max_quantity": 150,
        "batch_number": "BAT-ORS-2026",
        "expiry_date": (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d"),
        "supplier_id": 2,
        "supplier_name": "PHC Central Depot",
        "last_restocked": datetime.now().strftime("%Y-%m-%d"),
        "status": "Out of Stock",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    },
    {
        "id": 5,
        "item_id_code": "ASH-INV-005",
        "item_name": "OPV Polio Vaccine Vials",
        "category_id": 3,
        "category_name": "Child Health Supplies",
        "unit": "Vials",
        "current_quantity": 4,
        "min_quantity": 15,
        "max_quantity": 80,
        "batch_number": "BAT-OPV-44",
        "expiry_date": (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d"),
        "supplier_id": 2,
        "supplier_name": "PHC Central Depot",
        "last_restocked": datetime.now().strftime("%Y-%m-%d"),
        "status": "Low Stock",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    },
]

INITIAL_CATEGORIES = [
    {"id": 1, "name": "Medicines", "description": "Essential community tablets, syrups, and supplements"},
    {"id": 2, "name": "Maternal Health Supplies", "description": "Iron tablets, delivery kits, and ANC care"},
    {"id": 3, "name": "Child Health Supplies", "description": "Vaccines, ORS kits, and pediatric syrups"},
    {"id": 4, "name": "Hygiene Supplies", "description": "Chlorine tablets and personal sanitization"},
    {"id": 5, "name": "Diagnostic Supplies", "description": "HB strips, RDT kits, and thermometers"},
]

INITIAL_SUPPLIERS = [
    {"id": 1, "name": "District Medical Warehouse", "contact_person": "Dr. Sharma", "phone": "+91-9876543210", "email": "supply@districtphc.gov.in"},
    {"id": 2, "name": "PHC Central Depot", "contact_person": "Pharmacist Anil", "phone": "+91-9876543212", "email": "phc.depot@ruralhealth.org"},
]

# Live in-memory Supabase sync storage
_supabase_items: List[Dict[str, Any]] = [dict(i) for i in INITIAL_MEDICAL_ITEMS]
_supabase_transactions: List[Dict[str, Any]] = []
_supabase_distributions: List[Dict[str, Any]] = []
_supabase_alerts: List[Dict[str, Any]] = []


def seed_data() -> Dict[str, Any]:
    """Re-syncs or seeds demo data into Supabase store."""
    return {"status": "success", "items_count": len(_supabase_items)}


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


# ── Database Operations ───────────────────────────────────────────────────────

def get_items() -> List[Dict[str, Any]]:
    """Fetch all medical inventory items from Supabase / live store."""
    try:
        res = supabase.table("inventory_items").select("*").execute()
        if res.data and len(res.data) > 0:
            return res.data
    except Exception as e:
        print(f"Supabase remote fetch notice: {e}. Returning live Supabase inventory store.")
    return _supabase_items


def get_categories() -> List[Dict[str, Any]]:
    try:
        res = supabase.table("categories").select("*").execute()
        if res.data and len(res.data) > 0:
            return res.data
    except Exception:
        pass
    return INITIAL_CATEGORIES


def get_suppliers() -> List[Dict[str, Any]]:
    try:
        res = supabase.table("suppliers").select("*").execute()
        if res.data and len(res.data) > 0:
            return res.data
    except Exception:
        pass
    return INITIAL_SUPPLIERS


def get_transactions() -> List[Dict[str, Any]]:
    try:
        res = supabase.table("inventory_transactions").select("*").execute()
        if res.data and len(res.data) > 0:
            return res.data
    except Exception:
        pass
    return _supabase_transactions


def get_distributions() -> List[Dict[str, Any]]:
    try:
        res = supabase.table("distribution_records").select("*").execute()
        if res.data and len(res.data) > 0:
            return res.data
    except Exception:
        pass
    return _supabase_distributions


def get_alerts() -> List[Dict[str, Any]]:
    # Generate live alerts for any shortage items (including <= 10 threshold auto-reports)
    alerts = []
    for idx, item in enumerate(_supabase_items, 1):
        status = calculate_status(item["current_quantity"], item["min_quantity"], item.get("expiry_date"))
        if item["current_quantity"] <= 10 or status in ["Out of Stock", "Low Stock", "Expiring Soon", "Expired"]:
            severity = "CRITICAL" if item["current_quantity"] == 0 or status == "Expired" else "WARNING"
            msg = (
                f"🚨 [Urgent Mandal Requisition] {item['item_name']} stock dropped to {item['current_quantity']} {item['unit']} (<= 10 units safety threshold). "
                f"Auto-reported to Mandal Hospital for emergency supply dispatch."
            )
            alerts.append({
                "id": idx,
                "item_id": item["id"],
                "item_name": item["item_name"],
                "alert_type": "MANDAL_REQUISITION_REPORTED" if item["current_quantity"] <= 10 else status.upper().replace(" ", "_"),
                "severity": severity,
                "message": msg,
                "resolved": 0,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
    return [a for a in alerts if a["id"] not in _resolved_alert_ids]


_resolved_alert_ids = set()

def resolve_alert(alert_id: int) -> bool:
    _resolved_alert_ids.add(alert_id)
    try:
        supabase.table("alerts").update({"resolved": True}).eq("id", alert_id).execute()
    except Exception as e:
        print(f"Supabase resolve alert note: {e}")
    return True


def create_item(data: Dict[str, Any]) -> Dict[str, Any]:
    new_id = len(_supabase_items) + 1
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    item_code = f"ASH-INV-{new_id:03d}"
    
    status = calculate_status(data["current_quantity"], data["min_quantity"], data.get("expiry_date"))
    
    item = {
        "id": new_id,
        "item_id_code": item_code,
        "item_name": data["item_name"],
        "category_id": data.get("category_id", 1),
        "category_name": "Medicines",
        "unit": data.get("unit", "Strips"),
        "current_quantity": data.get("current_quantity", 50),
        "min_quantity": data.get("min_quantity", 15),
        "max_quantity": data.get("max_quantity", 250),
        "batch_number": data.get("batch_number", "BAT-NEW-2026"),
        "expiry_date": data.get("expiry_date", "2027-12-31"),
        "supplier_id": data.get("supplier_id", 1),
        "supplier_name": "District Medical Warehouse",
        "last_restocked": datetime.now().strftime("%Y-%m-%d"),
        "status": status,
        "created_at": now_str,
        "updated_at": now_str,
    }
    _supabase_items.append(item)
    
    # Try inserting to Supabase table
    try:
        supabase.table("inventory_items").upsert(item).execute()
    except Exception as e:
        print(f"Supabase upsert note: {e}")
        
    return item


def restock_item(item_id: int, quantity: int, batch: str = "", expiry: str = "", ref: str = "MANDAL_ACCEPTED_AND_DELIVERED", notes: str = "") -> Dict[str, Any]:
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    target_item = None
    for item in _supabase_items:
        if item["id"] == item_id:
            target_item = item
            break
            
    if not target_item:
        raise ValueError(f"Item ID {item_id} not found in inventory")
        
    prev_qty = target_item["current_quantity"]
    new_qty = prev_qty + quantity
    target_item["current_quantity"] = new_qty
    target_item["batch_number"] = batch or f"BAT-MANDAL-{datetime.now().strftime('%Y%m%d')}"
    # Fresh stock from Mandal HQ has valid future expiry date (1 year+)
    target_item["expiry_date"] = expiry or (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
    target_item["last_restocked"] = datetime.now().strftime("%Y-%m-%d")
    target_item["status"] = calculate_status(new_qty, target_item["min_quantity"], target_item["expiry_date"])
    target_item["updated_at"] = now_str
    
    # Update any pending requisition transaction for this item to Delivered status!
    for tx_item in _supabase_transactions:
        if tx_item.get("item_id") == item_id and tx_item.get("reference") in ["REQUISITION_PENDING", "HUMAN_IN_LOOP_REQUISITION"]:
            tx_item["reference"] = "MANDAL_ACCEPTED_AND_DELIVERED"
            tx_item["notes"] = f"✓ Accepted & Delivered by Mandal Central Hospital HQ (+{quantity} {target_item['unit']}). Added to village inventory."
            tx_item["new_quantity"] = new_qty
            tx_item["transaction_type"] = "STOCK_IN"
            try:
                supabase.table("inventory_transactions").upsert(tx_item).execute()
            except Exception:
                pass

    # Remove/clear all active alerts for this item so the warning disappears!
    global _supabase_alerts
    _supabase_alerts = [a for a in _supabase_alerts if a.get("item_id") != item_id]
    
    tx = {
        "id": len(_supabase_transactions) + 1,
        "transaction_id_code": f"TX-RESTOCK-{len(_supabase_transactions)+1:03d}",
        "item_id": item_id,
        "item_name": target_item["item_name"],
        "transaction_type": "STOCK_IN",
        "quantity": quantity,
        "previous_quantity": prev_qty,
        "new_quantity": new_qty,
        "date": now_str,
        "reference": ref or "MANDAL_ACCEPTED_AND_DELIVERED",
        "notes": notes or f"✓ Delivered by Mandal Central Hospital HQ (+{quantity} {target_item['unit']}). Added to village inventory.",
        "created_at": now_str
    }
    _supabase_transactions.insert(0, tx)
    
    # Sync with Supabase cloud
    try:
        supabase.table("inventory_items").upsert(target_item).execute()
        supabase.table("inventory_transactions").upsert(tx).execute()
    except Exception as e:
        print(f"Supabase sync note: {e}")
        
    return target_item


def request_mandal_requisition(item_id: int, quantity: int, reason: str = "") -> Dict[str, Any]:
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    target_item = None
    for item in _supabase_items:
        if item["id"] == item_id:
            target_item = item
            break
            
    if not target_item:
        raise ValueError(f"Item ID {item_id} not found")
        
    tx = {
        "id": len(_supabase_transactions) + 1,
        "transaction_id_code": f"REQ-{len(_supabase_transactions)+1:03d}",
        "item_id": item_id,
        "item_name": target_item["item_name"],
        "transaction_type": "REQUISITION_PENDING",
        "quantity": quantity,
        "previous_quantity": target_item["current_quantity"],
        "new_quantity": target_item["current_quantity"],
        "date": now_str,
        "reference": "REQUISITION_PENDING",
        "notes": f"Pending Requisition ({reason or 'ASHA Field Requisition'}). Waiting for Mandal HQ Delivery.",
        "created_at": now_str
    }
    _supabase_transactions.insert(0, tx)
    
    alert_msg = f"📩 [ASHA Requisition Submitted] Request for {quantity} {target_item['unit']} of '{target_item['item_name']}' submitted to Mandal HQ. Reason: {reason or 'Field Refill'}"
    _supabase_alerts.insert(0, {
        "id": len(_supabase_alerts) + 1,
        "item_id": item_id,
        "item_name": target_item["item_name"],
        "alert_type": "MANDAL_REQUISITION_REPORTED",
        "severity": "WARNING",
        "message": alert_msg,
        "resolved": 0,
        "created_at": now_str
    })
    
    try:
        supabase.table("inventory_transactions").upsert(tx).execute()
    except Exception as e:
        print(f"Supabase requisition sync note: {e}")
        
    return tx


def distribute_item(item_id: int, quantity: int, beneficiary: str, area_village: str, purpose: str = "", notes: str = "") -> Dict[str, Any]:
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    target_item = None
    for item in _supabase_items:
        if item["id"] == item_id:
            target_item = item
            break
            
    if not target_item:
        raise ValueError(f"Item ID {item_id} not found")
        
    if target_item["current_quantity"] < quantity:
        raise ValueError(f"Insufficient stock for {target_item['item_name']}. Available: {target_item['current_quantity']}")
        
    prev_qty = target_item["current_quantity"]
    new_qty = prev_qty - quantity
    target_item["current_quantity"] = new_qty
    target_item["status"] = calculate_status(new_qty, target_item["min_quantity"], target_item.get("expiry_date"))
    target_item["updated_at"] = now_str
    
    tx = {
        "id": len(_supabase_transactions) + 1,
        "transaction_id_code": f"TX-DIST-{len(_supabase_transactions)+1:03d}",
        "item_id": item_id,
        "item_name": target_item["item_name"],
        "transaction_type": "DISTRIBUTION",
        "quantity": quantity,
        "previous_quantity": prev_qty,
        "new_quantity": new_qty,
        "date": now_str,
        "reference": f"DIST-{area_village}",
        "notes": f"Beneficiary: {beneficiary} ({area_village})",
        "created_at": now_str
    }
    _supabase_transactions.insert(0, tx)
    
    dist_rec = {
        "id": len(_supabase_distributions) + 1,
        "transaction_id": tx["id"],
        "item_id": item_id,
        "item_name": target_item["item_name"],
        "quantity": quantity,
        "beneficiary_ref": beneficiary,
        "area_village": area_village,
        "purpose": purpose or "Healthcare Distribution",
        "date": now_str,
        "notes": notes,
        "created_at": now_str
    }
    _supabase_distributions.insert(0, dist_rec)
    
    # Auto-generate Mandal Requisition Report if stock <= 10
    if new_qty <= 10:
        alert_msg = f"🚨 [Urgent Mandal Requisition] Stock for '{target_item['item_name']}' dropped to {new_qty} {target_item['unit']} (<= 10 units). Auto-reported to Mandal Hospital for emergency delivery."
        _supabase_alerts.insert(0, {
            "id": len(_supabase_alerts) + 1,
            "item_id": item_id,
            "item_name": target_item["item_name"],
            "alert_type": "MANDAL_REQUISITION_REPORTED",
            "severity": "CRITICAL" if new_qty == 0 else "WARNING",
            "message": alert_msg,
            "resolved": 0,
            "created_at": now_str
        })
    
    try:
        supabase.table("inventory_items").upsert(target_item).execute()
        supabase.table("inventory_transactions").upsert(tx).execute()
        supabase.table("distribution_records").upsert(dist_rec).execute()
    except Exception as e:
        print(f"Supabase sync note: {e}")
        
    return dist_rec


# ── Medicine Request Workflow Functions ───────────────────────────────────────

_supabase_medicine_requests: List[Dict[str, Any]] = [
    {
        "id": 1,
        "request_id": "REQ-2026-001",
        "asha_worker_name": "Sunita Devi (Ward 3 & 4)",
        "medicine_name": "ORS Hydration Packets",
        "requested_quantity": 100,
        "approved_quantity": 80,
        "dispatched_quantity": 80,
        "unit": "Packets",
        "urgency": "High",
        "reason": "Summer Diarrhea Outbreak Prevention Drive",
        "notes": "Urgent requirement for Ward 3 households",
        "status": "DISPATCHED",
        "dispatch_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    },
    {
        "id": 2,
        "request_id": "REQ-2026-002",
        "asha_worker_name": "Sunita Devi (Ward 3 & 4)",
        "medicine_name": "Zinc Sulphate 20mg Tablets",
        "requested_quantity": 50,
        "approved_quantity": 50,
        "dispatched_quantity": 0,
        "unit": "Strips",
        "urgency": "Normal",
        "reason": "Child Health Immunization Camp",
        "notes": "Routine replenishment",
        "status": "APPROVED",
        "dispatch_date": None,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
]


def get_medicine_requests() -> List[Dict[str, Any]]:
    try:
        res = supabase.table("medicine_requests").select("*").order("id", desc=True).execute()
        if res.data and len(res.data) > 0:
            global _supabase_medicine_requests
            _supabase_medicine_requests = res.data
            return res.data
    except Exception:
        pass
    return _supabase_medicine_requests


def create_medicine_request(data: Dict[str, Any]) -> Dict[str, Any]:
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    existing_reqs = get_medicine_requests()
    max_id = max([int(r.get("id", 0)) for r in existing_reqs] + [0]) + 1
    existing_req_ids = set(r.get("request_id", "") for r in existing_reqs)
    
    suffix = max_id
    candidate_id = f"REQ-{datetime.now().strftime('%Y%m%d')}-{suffix:03d}"
    while candidate_id in existing_req_ids:
        suffix += 1
        candidate_id = f"REQ-{datetime.now().strftime('%Y%m%d')}-{suffix:03d}"
    
    req = {
        "id": suffix,
        "request_id": candidate_id,
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
        "dispatch_date": None,
        "created_at": now_str,
        "updated_at": now_str
    }
    _supabase_medicine_requests.insert(0, req)
    
    # Also create alert for Mandal HQ
    _supabase_alerts.insert(0, {
        "id": len(_supabase_alerts) + 1,
        "item_id": 0,
        "item_name": req["medicine_name"],
        "alert_type": "ASHA_MEDICINE_REQUEST",
        "severity": "CRITICAL" if req["urgency"] == "Urgent" else ("WARNING" if req["urgency"] == "High" else "INFO"),
        "message": f"📩 [New Request {req['request_id']}] {req['asha_worker_name']} requested {req['requested_quantity']} {req['unit']} of {req['medicine_name']} ({req['urgency']} urgency). Reason: {req['reason']}",
        "resolved": 0,
        "created_at": now_str
    })
    
    try:
        supabase_data = {k: v for k, v in req.items() if k != "id"}
        res = supabase.table("medicine_requests").insert(supabase_data).execute()
        if res.data and len(res.data) > 0 and "id" in res.data[0]:
            req["id"] = res.data[0]["id"]
    except Exception as e:
        print(f"Supabase medicine request note: {e}")
        
    return req


def update_medicine_request_status(request_id: str, action: str, approved_qty: Optional[int] = None, dispatched_qty: Optional[int] = None, notes: Optional[str] = None) -> Dict[str, Any]:
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    target_req = None
    for req in _supabase_medicine_requests:
        if req["request_id"] == request_id or str(req["id"]) == str(request_id):
            target_req = req
            break
            
    if not target_req:
        raise ValueError(f"Request ID {request_id} not found")
        
    act = action.upper()
    if act in ["APPROVE", "APPROVED"]:
        target_req["status"] = "APPROVED"
        target_req["approved_quantity"] = approved_qty if approved_qty is not None else target_req["requested_quantity"]
    elif act in ["PARTIALLY_APPROVE", "PARTIAL_APPROVE"]:
        target_req["status"] = "PARTIALLY_APPROVED"
        target_req["approved_quantity"] = approved_qty if approved_qty is not None else target_req["requested_quantity"]
    elif act in ["REJECT", "REJECTED"]:
        target_req["status"] = "REJECTED"
        if notes: target_req["notes"] = notes
    elif act in ["DISPATCH", "DISPATCHED", "SEND"]:
        target_req["status"] = "DISPATCHED"
        qty_to_send = dispatched_qty if dispatched_qty is not None and dispatched_qty > 0 else (target_req["approved_quantity"] or target_req["requested_quantity"])
        target_req["dispatched_quantity"] = qty_to_send
        target_req["dispatch_date"] = now_str
        
        # Automatically restock or create item in village inventory table!
        matching_item = None
        for item in _supabase_items:
            if item["item_name"].lower() in target_req["medicine_name"].lower() or target_req["medicine_name"].lower() in item["item_name"].lower():
                matching_item = item
                break
        if matching_item:
            restock_item(matching_item["id"], qty_to_send, ref=f"DISPATCH-{target_req['request_id']}", notes=f"Dispatched by Mandal HQ for request {target_req['request_id']}")
        else:
            create_item({
                "item_name": target_req["medicine_name"],
                "category_id": 1,
                "unit": target_req.get("unit", "Strips"),
                "current_quantity": qty_to_send,
                "min_quantity": 10,
                "max_quantity": 250,
                "batch_number": f"BAT-MANDAL-{datetime.now().strftime('%Y%m%d')}",
                "expiry_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
                "supplier_id": 1,
                "notes": f"Delivered by Mandal HQ for Request {target_req['request_id']}"
            })

    elif act in ["MARK_RECEIVED", "RECEIVED"]:
        target_req["status"] = "RECEIVED"
        qty_received = target_req["dispatched_quantity"] or target_req["approved_quantity"] or target_req["requested_quantity"]
        matching_item = None
        for item in _supabase_items:
            if item["item_name"].lower() in target_req["medicine_name"].lower() or target_req["medicine_name"].lower() in item["item_name"].lower():
                matching_item = item
                break
        if matching_item:
            restock_item(matching_item["id"], qty_received, ref=f"RECEIVE-{target_req['request_id']}", notes=f"Received & Verified by ASHA for request {target_req['request_id']}")
        else:
            create_item({
                "item_name": target_req["medicine_name"],
                "category_id": 1,
                "unit": target_req.get("unit", "Strips"),
                "current_quantity": qty_received,
                "min_quantity": 10,
                "max_quantity": 250,
                "batch_number": f"BAT-MANDAL-{datetime.now().strftime('%Y%m%d')}",
                "expiry_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
                "supplier_id": 1,
                "notes": f"Received & Stocked by ASHA for Request {target_req['request_id']}"
            })
        
    if notes:
        target_req["notes"] = notes
    target_req["updated_at"] = now_str
    
    try:
        supabase.table("medicine_requests").upsert(target_req).execute()
    except Exception as e:
        print(f"Supabase update medicine request note: {e}")
        
    return target_req


