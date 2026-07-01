from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
from routers import complaints, admin, auth_router
import os

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Civic Complaint API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(complaints.router)
app.include_router(admin.router)
app.include_router(auth_router.router)

@app.get("/")
def root():
    return {"message": "Welcome to Civic Complaint API"}
