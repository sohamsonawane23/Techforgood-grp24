from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# --- Auth / Users -------------------------------------------------------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Status history -------------------------------------------------------

class StatusHistoryResponse(BaseModel):
    id: int
    status: str
    note: Optional[str] = None
    changed_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Complaints -------------------------------------------------------

class ComplaintBase(BaseModel):
    title: str
    description: str


class ComplaintCreate(ComplaintBase):
    pass


class DuplicateCandidate(BaseModel):
    """A complaint that might be the same underlying issue, returned so
    the citizen can choose to upvote it instead of filing a new one."""

    id: int
    title: str
    category: str
    status: str
    distance_meters: float
    upvote_count: int

    class Config:
        from_attributes = True


class ComplaintResponse(ComplaintBase):
    id: int
    category: str
    priority: str
    status: str
    image_url: Optional[str] = None
    created_at: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    upvote_count: int = 0
    duplicate_of_id: Optional[int] = None

    class Config:
        from_attributes = True


class ComplaintDetailResponse(ComplaintResponse):
    status_history: List[StatusHistoryResponse] = []


class ComplaintStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None
