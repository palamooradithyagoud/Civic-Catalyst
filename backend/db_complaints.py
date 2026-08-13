"""
Civic Catalyst — Complaints Database Manager (Supabase with Resilient Local Cache)
"""
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from supabase_client import supabase

# Local persistent in-memory / cache store
COMPLAINTS_CACHE_FILE = os.path.join(os.path.dirname(__file__), "complaints_cache.json")

INITIAL_COMPLAINTS: List[Dict[str, Any]] = [
    {
        "id": "C-001",
        "complaint_id_code": "C-001",
        "title": "Broken road near main market",
        "description": "Deep pothole and asphalt damage obstructing traffic near central market entrance.",
        "status": "pending",
        "category": "Roads & Infrastructure",
        "date": "Today, 9:15 AM",
        "location": "Market Road, Ward 4",
        "avatarBg": "#064e3b",
        "urgency": "High",
        "villager_name": "Ramesh Kumar",
        "villager_id": "vil_001",
        "village": "Shyampet",
        "ai_generated": True,
        "image_url": None,
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": "C-002",
        "complaint_id_code": "C-002",
        "title": "Water supply disruption in Ward 2",
        "description": "Burst main pipeline causing clean water leak and low pressure across residential houses.",
        "status": "in_progress",
        "category": "Water Supply",
        "date": "Yesterday, 6:00 PM",
        "location": "Ward 2 Residential Area",
        "avatarBg": "#059669",
        "urgency": "High",
        "villager_name": "Suresh Reddy",
        "villager_id": "vil_002",
        "village": "Shyampet",
        "ai_generated": True,
        "image_url": None,
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": "C-003",
        "complaint_id_code": "C-003",
        "title": "Garbage clearance near primary school",
        "description": "Unsegregated garbage accumulation creating unhygienic conditions near school entrance.",
        "status": "resolved",
        "category": "Sanitation",
        "date": "12 Aug, 2:45 PM",
        "location": "Primary School Lane",
        "avatarBg": "#0f5132",
        "urgency": "Medium",
        "villager_name": "Meena Patel",
        "villager_id": "vil_003",
        "village": "Shyampet",
        "ai_generated": False,
        "image_url": None,
        "created_at": datetime.now().isoformat(),
    },
]

def _load_cache() -> List[Dict[str, Any]]:
    if os.path.exists(COMPLAINTS_CACHE_FILE):
        try:
            with open(COMPLAINTS_CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception:
            pass
    return list(INITIAL_COMPLAINTS)

def _save_cache(data: List[Dict[str, Any]]) -> None:
    try:
        with open(COMPLAINTS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[Complaints DB] Warning saving cache: {e}")

_local_complaints: List[Dict[str, Any]] = _load_cache()

def get_all_complaints(
    village: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve complaints from Supabase or resilient cache."""
    try:
        query = supabase.table("complaints").select("*").order("created_at", desc=True)
        if village and village != "ALL":
            query = query.eq("village", village)
        if status and status != "ALL":
            query = query.eq("status", status)
        if category and category != "ALL":
            query = query.eq("category", category)
        
        res = query.execute()
        if res and res.data and len(res.data) > 0:
            # Map db rows to standard complaint shape
            items = []
            for row in res.data:
                items.append({
                    "id": row.get("complaint_id_code") or str(row.get("id")),
                    "complaint_id_code": row.get("complaint_id_code") or str(row.get("id")),
                    "title": row.get("title", ""),
                    "description": row.get("description", ""),
                    "category": row.get("category", "Roads & Infrastructure"),
                    "location": row.get("location", ""),
                    "urgency": row.get("urgency", "High"),
                    "status": row.get("status", "pending"),
                    "villager_name": row.get("villager_name", "Citizen"),
                    "villager_id": row.get("villager_id", "vil_001"),
                    "village": row.get("village", "Shyampet"),
                    "image_url": row.get("image_url"),
                    "ai_generated": bool(row.get("ai_generated", False)),
                    "date": row.get("date_label") or (row.get("created_at", "")[:10] if row.get("created_at") else "Today"),
                    "avatarBg": "#064e3b" if row.get("status") == "pending" else "#059669" if row.get("status") == "in_progress" else "#0f5132",
                    "created_at": row.get("created_at") or datetime.now().isoformat(),
                })
            return items
    except Exception as e:
        print(f"[Complaints DB] Supabase fetch fallback to local cache: {e}")

    # Local fallback
    results = list(_local_complaints)
    if village and village != "ALL":
        results = [c for c in results if c.get("village", "").lower() == village.lower()]
    if status and status != "ALL":
        results = [c for c in results if c.get("status") == status]
    if category and category != "ALL":
        results = [c for c in results if c.get("category") == category]
    if search:
        s = search.lower()
        results = [
            c for c in results
            if s in c.get("title", "").lower()
            or s in c.get("description", "").lower()
            or s in c.get("location", "").lower()
            or s in c.get("villager_name", "").lower()
        ]
    return results

def create_complaint(data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a new civic complaint into Supabase & update local cache."""
    now = datetime.now()
    complaint_id = data.get("id") or f"C-{len(_local_complaints) + 1:03d}"
    date_label = data.get("date") or "Today, " + now.strftime("%I:%M %p").lstrip("0")
    
    new_record = {
        "id": complaint_id,
        "complaint_id_code": complaint_id,
        "title": data.get("title", "Civic Issue"),
        "description": data.get("description", ""),
        "category": data.get("category", "Roads & Infrastructure"),
        "location": data.get("location", "Village Ward"),
        "urgency": data.get("urgency", "High"),
        "status": data.get("status", "pending"),
        "villager_name": data.get("villager_name", "Citizen"),
        "villager_id": data.get("villager_id", "vil_001"),
        "village": data.get("village", "Shyampet"),
        "image_url": data.get("image_url"),
        "ai_generated": bool(data.get("ai_generated", False)),
        "date": date_label,
        "date_label": date_label,
        "avatarBg": "#064e3b",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    # Try saving to Supabase
    try:
        row = {
            "complaint_id_code": new_record["complaint_id_code"],
            "title": new_record["title"],
            "description": new_record["description"],
            "category": new_record["category"],
            "location": new_record["location"],
            "urgency": new_record["urgency"],
            "status": new_record["status"],
            "villager_name": new_record["villager_name"],
            "villager_id": new_record["villager_id"],
            "village": new_record["village"],
            "image_url": new_record["image_url"],
            "ai_generated": new_record["ai_generated"],
            "date_label": new_record["date_label"],
            "created_at": new_record["created_at"],
            "updated_at": new_record["updated_at"],
        }
        res = supabase.table("complaints").insert(row).execute()
        if res and res.data:
            print(f"[Complaints DB] Supabase inserted complaint {complaint_id}")
    except Exception as e:
        print(f"[Complaints DB] Supabase insert note (using local cache): {e}")

    # Always prepend to local memory cache
    _local_complaints.insert(0, new_record)
    _save_cache(_local_complaints)
    return new_record

def update_complaint_status(complaint_id: str, new_status: str) -> Optional[Dict[str, Any]]:
    """Update status of a complaint (e.g. pending -> in_progress -> resolved)."""
    updated_record = None
    
    # Try updating in Supabase
    try:
        res = (
            supabase.table("complaints")
            .update({"status": new_status, "updated_at": datetime.now().isoformat()})
            .eq("complaint_id_code", complaint_id)
            .execute()
        )
        if res and res.data:
            print(f"[Complaints DB] Supabase updated status for {complaint_id}")
    except Exception as e:
        print(f"[Complaints DB] Supabase status update note: {e}")

    # Update in local cache
    for c in _local_complaints:
        if c.get("id") == complaint_id or c.get("complaint_id_code") == complaint_id:
            c["status"] = new_status
            c["avatarBg"] = "#0f5132" if new_status == "resolved" else "#059669" if new_status == "in_progress" else "#064e3b"
            c["updated_at"] = datetime.now().isoformat()
            updated_record = c
            break

    if updated_record:
        _save_cache(_local_complaints)
    return updated_record

def delete_complaint(complaint_id: str) -> bool:
    """Delete a complaint."""
    global _local_complaints
    try:
        supabase.table("complaints").delete().eq("complaint_id_code", complaint_id).execute()
    except Exception:
        pass

    _local_complaints = [c for c in _local_complaints if c.get("id") != complaint_id and c.get("complaint_id_code") != complaint_id]
    _save_cache(_local_complaints)
    return True

def get_complaint_stats() -> Dict[str, Any]:
    """Compute aggregate KPI stats."""
    complaints = get_all_complaints()
    total = len(complaints)
    pending = sum(1 for c in complaints if c.get("status") == "pending")
    in_progress = sum(1 for c in complaints if c.get("status") == "in_progress")
    resolved = sum(1 for c in complaints if c.get("status") == "resolved")
    high_urgency = sum(1 for c in complaints if c.get("urgency") == "High" and c.get("status") != "resolved")
    
    # Category Breakdown
    cat_counts: Dict[str, int] = {}
    for c in complaints:
        cat = c.get("category", "Other")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    return {
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "resolved": resolved,
        "high_urgency": high_urgency,
        "resolution_rate": f"{(resolved / total * 100):.1f}%" if total > 0 else "0%",
        "category_breakdown": cat_counts,
    }
