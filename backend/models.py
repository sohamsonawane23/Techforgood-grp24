from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    category = Column(String, default="Uncategorized")
    priority = Column(String, default="Medium")
    status = Column(String, default="Pending")
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
