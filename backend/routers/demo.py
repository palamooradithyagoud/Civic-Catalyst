from fastapi import APIRouter
from models.schemas import DemoVillager, DemoPanchayat, SessionResponse, UserRole

router = APIRouter(prefix="/api/demo", tags=["demo"])

# ── Demo data constants ──────────────────────────────────────────────────────

DEMO_VILLAGER = DemoVillager(
    id="demo-villager-001",
    name="Ramesh Kumar",
    role=UserRole.villager,
    village="Demo Village",
)

DEMO_PANCHAYAT = DemoPanchayat(
    id="demo-panchayat-001",
    name="Demo Gram Panchayat",
    village="Demo Village",
    role=UserRole.panchayat_official,
)

# ── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/villager", response_model=SessionResponse)
async def get_demo_villager():
    """Return demo villager session data."""
    return SessionResponse(
        success=True,
        role=UserRole.villager,
        data=DEMO_VILLAGER.model_dump(),
    )


@router.get("/panchayat", response_model=SessionResponse)
async def get_demo_panchayat():
    """Return demo panchayat session data."""
    return SessionResponse(
        success=True,
        role=UserRole.panchayat_official,
        data=DEMO_PANCHAYAT.model_dump(),
    )


@router.get("/stats/panchayat/{panchayat_id}")
async def get_panchayat_stats(panchayat_id: str):
    """
    Return complaint statistics for a panchayat.
    Phase 1: returns zeroes. Phase 2 will query Supabase.
    """
    return {
        "panchayat_id": panchayat_id,
        "total": 0,
        "pending": 0,
        "in_progress": 0,
        "resolved": 0,
    }


@router.get("/complaints/villager/{villager_id}")
async def get_villager_complaints(villager_id: str):
    """
    Return complaints for a villager.
    Phase 1: returns empty list. Phase 2 will query Supabase.
    """
    return {
        "villager_id": villager_id,
        "complaints": [],
        "total": 0,
    }
