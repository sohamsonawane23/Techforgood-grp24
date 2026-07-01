import math
import os
import shutil
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from image_classifier import classify_complaint_with_image
from auth import require_admin, get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Two complaints are considered possible duplicates if they're the same
# category and within this distance of each other. ~75m is roughly
# "same block/intersection" - close enough that it's plausibly the same
# pothole/streetlight/etc, not just the same street.
DUPLICATE_RADIUS_METERS = 75
EARTH_RADIUS_METERS = 6371000


def haversine_distance(lat1, lon1, lat2, lon2) -> float:
    """Great-circle distance between two lat/lng points, in meters."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * EARTH_RADIUS_METERS * math.asin(math.sqrt(a))


def _to_response(c: models.Complaint) -> schemas.ComplaintResponse:
    return schemas.ComplaintResponse(
        id=c.id,
        title=c.title,
        description=c.description,
        category=c.category,
        priority=c.priority,
        status=c.status,
        image_url=c.image_url,
        created_at=c.created_at,
        latitude=c.latitude,
        longitude=c.longitude,
        address=c.address,
        owner_id=c.owner_id,
        owner_name=c.owner.name if c.owner else None,
        upvote_count=len(c.upvotes),
        duplicate_of_id=c.duplicate_of_id,
    )


@router.get("/nearby-duplicates", response_model=List[schemas.DuplicateCandidate])
def find_nearby_duplicates(
    latitude: float,
    longitude: float,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Look for existing open complaints near a location, optionally
    filtered by category, so the frontend can show 'is this the same
    issue?' before a citizen files a new report.

    This runs as a separate lookup (rather than blocking submission)
    because we don't want to silently merge two different real issues
    that happen to be close together - the citizen decides."""
    candidates = (
        db.query(models.Complaint)
        .filter(models.Complaint.status != "Resolved")
        .filter(models.Complaint.latitude.isnot(None))
        .filter(models.Complaint.duplicate_of_id.is_(None))
        .all()
    )

    results = []
    for c in candidates:
        if category and c.category.lower() != category.lower():
            continue
        dist = haversine_distance(latitude, longitude, c.latitude, c.longitude)
        if dist <= DUPLICATE_RADIUS_METERS:
            results.append(
                schemas.DuplicateCandidate(
                    id=c.id,
                    title=c.title,
                    category=c.category,
                    status=c.status,
                    distance_meters=round(dist, 1),
                    upvote_count=len(c.upvotes),
                )
            )

    results.sort(key=lambda r: r.distance_meters)
    return results[:5]


@router.post("/", response_model=schemas.ComplaintResponse)
async def create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    image_url = None
    image_path = None

    if image:
        ext = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        image_path = os.path.join(UPLOAD_DIR, filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/uploads/{filename}"

    category, priority = classify_complaint_with_image(title, description, image_path)

    db_complaint = models.Complaint(
        title=title,
        description=description,
        category=category,
        priority=priority,
        image_url=image_url,
        latitude=latitude,
        longitude=longitude,
        address=address,
        owner_id=current_user.id if current_user else None,
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)

    db.add(
        models.StatusHistory(
            complaint_id=db_complaint.id,
            status="Pending",
            note="Report filed",
            changed_by=current_user.name if current_user else "Anonymous",
        )
    )
    db.commit()
    db.refresh(db_complaint)

    return _to_response(db_complaint)


@router.get("/", response_model=List[schemas.ComplaintResponse])
def get_complaints(
    skip: int = 0,
    limit: int = 100,
    mine: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    query = db.query(models.Complaint)
    if mine:
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required to view your own complaints")
        query = query.filter(models.Complaint.owner_id == current_user.id)

    complaints = query.order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return [_to_response(c) for c in complaints]


@router.get("/{complaint_id}", response_model=schemas.ComplaintDetailResponse)
def get_complaint_detail(complaint_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    base = _to_response(c)
    history = sorted(c.status_history, key=lambda h: h.created_at)
    return schemas.ComplaintDetailResponse(**base.model_dump(), status_history=history)


@router.post("/{complaint_id}/upvote", response_model=schemas.ComplaintResponse)
def upvote_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Citizen confirms they're affected by an existing complaint, instead
    of filing a duplicate. One upvote per user per complaint."""
    c = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    existing = (
        db.query(models.ComplaintUpvote)
        .filter(
            models.ComplaintUpvote.complaint_id == complaint_id,
            models.ComplaintUpvote.user_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You've already confirmed this issue")

    db.add(models.ComplaintUpvote(complaint_id=complaint_id, user_id=current_user.id))
    db.commit()
    db.refresh(c)
    return _to_response(c)


@router.patch("/{complaint_id}/status", response_model=schemas.ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    status_update: schemas.ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    db_complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not db_complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    db_complaint.status = status_update.status
    db.add(
        models.StatusHistory(
            complaint_id=complaint_id,
            status=status_update.status,
            note=status_update.note,
            changed_by=admin.name,
        )
    )
    db.commit()
    db.refresh(db_complaint)
    return _to_response(db_complaint)
