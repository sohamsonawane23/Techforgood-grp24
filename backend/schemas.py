from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ComplaintBase(BaseModel):
    title: str
    description: str

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintResponse(ComplaintBase):
    id: int
    category: str
    priority: str
    status: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class ComplaintStatusUpdate(BaseModel):
    status: str
