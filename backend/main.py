"""
Nivaaran AI — FastAPI Backend
Phase 1: Demo session endpoints + health check
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import demo
from models.schemas import HealthResponse

load_dotenv()

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Nivaaran AI API",
    description="AI-assisted civic issue reporting platform for rural communities.",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────

app.include_router(demo.router)

# ── Core endpoints ───────────────────────────────────────────────────────────


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check():
    """Service health check endpoint."""
    return HealthResponse(
        status="ok",
        service="Nivaaran AI API",
        version="0.1.0",
    )


@app.get("/", tags=["system"])
async def root():
    return {
        "message": "Nivaaran AI API is running.",
        "docs": "/api/docs",
        "version": "0.1.0",
    }
