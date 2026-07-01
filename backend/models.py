from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="citizen")  # "citizen" or "admin"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaints = relationship("Complaint", back_populates="owner")


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

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)

    # Ownership
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("User", back_populates="complaints")

    # If this complaint was identified as a likely duplicate of an
    # existing one, this points at the "primary" complaint instead of
    # creating a second ticket.
    duplicate_of_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)

    status_history = relationship(
        "StatusHistory", back_populates="complaint", cascade="all, delete-orphan"
    )
    upvotes = relationship(
        "ComplaintUpvote", back_populates="complaint", cascade="all, delete-orphan"
    )


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    status = Column(String, nullable=False)
    note = Column(String, nullable=True)
    changed_by = Column(String, nullable=True)  # admin's name/email, or "system"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaint = relationship("Complaint", back_populates="status_history")


class ComplaintUpvote(Base):
    """A citizen confirming 'this is happening for me too' on an existing
    complaint, instead of filing a duplicate ticket."""

    __tablename__ = "complaint_upvotes"
    __table_args__ = (UniqueConstraint("complaint_id", "user_id", name="uq_upvote_once"),)

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaint = relationship("Complaint", back_populates="upvotes")
