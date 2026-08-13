from pydantic import BaseModel
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    villager = "villager"
    panchayat_official = "panchayat_official"


class DemoVillager(BaseModel):
    id: str
    name: str
    role: UserRole
    village: str


class DemoPanchayat(BaseModel):
    id: str
    name: str
    village: str
    role: UserRole


class SessionResponse(BaseModel):
    success: bool
    role: UserRole
    data: dict


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
