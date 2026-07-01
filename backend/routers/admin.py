import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import hash_password, require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

# One-time setup key used only to create the very first admin account
# (there's no admin yet to grant that role, so this bootstraps it).
# Set ADMIN_SETUP_KEY in the environment, call /api/admin/bootstrap once,
# then treat that key as compromised/rotate it - it's not meant for
# ongoing use.
ADMIN_SETUP_KEY = os.environ.get("ADMIN_SETUP_KEY", "")


class BootstrapAdminRequest(schemas.UserCreate):
    setup_key: str


@router.post("/bootstrap", response_model=schemas.UserResponse)
def bootstrap_admin(payload: BootstrapAdminRequest, db: Session = Depends(get_db)):
    """Create the first admin account. Requires ADMIN_SETUP_KEY to be set
    in the environment and passed in the request - this is a one-time
    bootstrap mechanism, not a general-purpose admin creation endpoint."""
    if not ADMIN_SETUP_KEY:
        raise HTTPException(
            status_code=403,
            detail="Admin bootstrap is disabled (ADMIN_SETUP_KEY not set on the server)",
        )
    if payload.setup_key != ADMIN_SETUP_KEY:
        raise HTTPException(status_code=403, detail="Invalid setup key")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[schemas.UserResponse])
def list_users(db: Session = Depends(get_db), _admin: models.User = Depends(require_admin)):
    """List all registered users. Admin-only - useful for promoting a
    citizen to admin (see /api/admin/users/{id}/promote)."""
    return db.query(models.User).all()


@router.post("/users/{user_id}/promote", response_model=schemas.UserResponse)
def promote_to_admin(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    """Promote an existing citizen account to admin. Only existing admins
    can do this, which is why bootstrap_admin above exists separately to
    create the very first one."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "admin"
    db.commit()
    db.refresh(user)
    return user
