"""
Civic Catalyst — Complaints Database Manager (Supabase Only)
All complaints are stored in and read from Supabase cloud — no local/file cache fallbacks.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from supabase_client import supabase


def get_all_complaints(
    village: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve complaints from Supabase with optional filters."""
    query = supabase.table("complaints").select("*").order("created_at", desc=True)

    if village and village != "ALL":
        query = query.eq("village", village)
    if status and status != "ALL":
        query = query.eq("status", status)
    if category and category != "ALL":
        query = query.eq("category", category)

    res = query.execute()
    rows = res.data or []

    # Client-side search filter (Supabase free tier lacks full-text search)
    if search:
        s = search.lower()
        rows = [
            r for r in rows
            if s in (r.get("title") or "").lower()
            or s in (r.get("description") or "").lower()
            or s in (r.get("location") or "").lower()
            or s in (r.get("villager_name") or "").lower()
        ]

    # Normalize rows to a standard complaint shape
    return [_map_row(row) for row in rows]


def create_complaint(data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a new civic complaint into Supabase."""
    now = datetime.now()

    # Generate a unique complaint ID code
    count_res = supabase.table("complaints").select("id").order("id", desc=True).limit(1).execute()
    next_num = (count_res.data[0]["id"] + 1) if count_res.data else 1
    complaint_id = data.get("complaint_id_code") or data.get("id") or f"C-{next_num:03d}"
    date_label = data.get("date") or data.get("date_label") or "Today, " + now.strftime("%I:%M %p").lstrip("0")

    row = {
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
        "date_label": date_label,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    res = supabase.table("complaints").insert(row).execute()
    if not res.data:
        raise ValueError("Failed to insert complaint into Supabase")

    return _map_row(res.data[0])


def update_complaint_status(complaint_id: str, new_status: str) -> Optional[Dict[str, Any]]:
    """Update status of a complaint in Supabase."""
    res = (
        supabase.table("complaints")
        .update({"status": new_status, "updated_at": datetime.now().isoformat()})
        .eq("complaint_id_code", complaint_id)
        .execute()
    )

    if not res.data:
        return None

    return _map_row(res.data[0])


def delete_complaint(complaint_id: str) -> bool:
    """Delete a complaint from Supabase."""
    supabase.table("complaints").delete().eq("complaint_id_code", complaint_id).execute()
    return True


def get_complaint_stats() -> Dict[str, Any]:
    """Compute aggregate KPI stats from Supabase."""
    complaints = get_all_complaints()
    total = len(complaints)
    pending = sum(1 for c in complaints if c.get("status") == "pending")
    in_progress = sum(1 for c in complaints if c.get("status") == "in_progress")
    resolved = sum(1 for c in complaints if c.get("status") == "resolved")
    high_urgency = sum(1 for c in complaints if c.get("urgency") == "High" and c.get("status") != "resolved")

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


# ── Internal helpers ──────────────────────────────────────────────────────────

def _map_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a Supabase complaint row to the standard frontend shape."""
    status = row.get("status", "pending")
    avatar_bg = (
        "#0f5132" if status == "resolved"
        else "#059669" if status == "in_progress"
        else "#064e3b"
    )
    return {
        "id": row.get("complaint_id_code") or str(row.get("id")),
        "complaint_id_code": row.get("complaint_id_code") or str(row.get("id")),
        "title": row.get("title", ""),
        "description": row.get("description", ""),
        "category": row.get("category", "Roads & Infrastructure"),
        "location": row.get("location", ""),
        "urgency": row.get("urgency", "High"),
        "status": status,
        "villager_name": row.get("villager_name", "Citizen"),
        "villager_id": row.get("villager_id", "vil_001"),
        "village": row.get("village", "Shyampet"),
        "image_url": row.get("image_url"),
        "ai_generated": bool(row.get("ai_generated", False)),
        "date": row.get("date_label") or (row.get("created_at", "")[:10] if row.get("created_at") else "Today"),
        "date_label": row.get("date_label", ""),
        "avatarBg": avatar_bg,
        "created_at": row.get("created_at") or datetime.now().isoformat(),
        "updated_at": row.get("updated_at") or datetime.now().isoformat(),
    }
