from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import random

from database import engine, Base, SessionLocal
import models
from schemas import StreetlightCreate, StreetlightUpdate


app = FastAPI(
    title="Smart Streetlight Energy Conservation System"
)


# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Database
# -----------------------------

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Home
# -----------------------------

@app.get("/")
def home():
    return {
        "message": "Smart Streetlight Energy Conservation System API is running"
    }


# -----------------------------
# Add Streetlight
# -----------------------------

@app.post("/streetlights")
def add_streetlight(
    streetlight: StreetlightCreate,
    db: Session = Depends(get_db)
):

    new_streetlight = models.Streetlight(
        location=streetlight.location,
        status=streetlight.status,
        brightness=streetlight.brightness,
        power_usage=streetlight.power_usage,
        motion_detected=streetlight.motion_detected,
        fault=streetlight.fault
    )

    db.add(new_streetlight)
    db.commit()
    db.refresh(new_streetlight)

    return new_streetlight


# -----------------------------
# Get Streetlights
# -----------------------------

@app.get("/streetlights")
def get_streetlights(
    db: Session = Depends(get_db)
):

    return db.query(models.Streetlight).all()


# -----------------------------
# Manual Update
# -----------------------------

@app.put("/streetlights/{streetlight_id}")
def update_streetlight(
    streetlight_id: int,
    data: StreetlightUpdate,
    db: Session = Depends(get_db)
):

    streetlight = db.query(models.Streetlight).filter(
        models.Streetlight.id == streetlight_id
    ).first()

    if streetlight is None:
        return {
            "message": "Streetlight not found"
        }

    streetlight.status = data.status
    streetlight.brightness = data.brightness

    if data.status == "OFF":
        streetlight.power_usage = 0
    else:
        streetlight.power_usage = data.brightness * 0.45

    db.commit()
    db.refresh(streetlight)

    return streetlight


# -----------------------------
# Automatic Energy Saving
# -----------------------------

@app.put("/streetlights/{streetlight_id}/auto")
def automatic_energy_saving(
    streetlight_id: int,
    db: Session = Depends(get_db)
):

    streetlight = db.query(models.Streetlight).filter(
        models.Streetlight.id == streetlight_id
    ).first()

    if streetlight is None:
        return {
            "message": "Streetlight not found"
        }

    if streetlight.fault:

        streetlight.status = "OFF"
        streetlight.brightness = 0
        streetlight.power_usage = 0

    elif streetlight.motion_detected:

        streetlight.status = "ON"
        streetlight.brightness = 100
        streetlight.power_usage = 45

    else:

        streetlight.status = "ON"
        streetlight.brightness = 30
        streetlight.power_usage = 13.5

    db.commit()
    db.refresh(streetlight)

    return streetlight


# -----------------------------
# Traffic and Motion Simulation
# -----------------------------

@app.put("/streetlights/{streetlight_id}/simulate")
def simulate_traffic_and_motion(
    streetlight_id: int,
    db: Session = Depends(get_db)
):

    streetlight = db.query(models.Streetlight).filter(
        models.Streetlight.id == streetlight_id
    ).first()

    if streetlight is None:
        return {
            "message": "Streetlight not found"
        }

    # If the light is faulty,
    # keep it OFF during simulation.

    if streetlight.fault:

        streetlight.motion_detected = False
        streetlight.status = "OFF"
        streetlight.brightness = 0
        streetlight.power_usage = 0

        db.commit()
        db.refresh(streetlight)

        return {
            "id": streetlight.id,
            "location": streetlight.location,
            "traffic_level": "FAULT",
            "motion_detected": False,
            "status": "OFF",
            "brightness": 0,
            "power_usage": 0,
            "fault": True
        }


    traffic_levels = [
        "LOW",
        "MEDIUM",
        "HIGH"
    ]

    traffic = random.choice(traffic_levels)


    if traffic == "HIGH":

        motion = True
        brightness = 100

    elif traffic == "MEDIUM":

        motion = True
        brightness = 60

    else:

        motion = False
        brightness = 30


    streetlight.motion_detected = motion
    streetlight.status = "ON"
    streetlight.brightness = brightness
    streetlight.power_usage = brightness * 0.45


    db.commit()
    db.refresh(streetlight)


    return {
        "id": streetlight.id,
        "location": streetlight.location,
        "traffic_level": traffic,
        "motion_detected": streetlight.motion_detected,
        "status": streetlight.status,
        "brightness": streetlight.brightness,
        "power_usage": streetlight.power_usage,
        "fault": streetlight.fault
    }


# -----------------------------
# Simulate Fault
# -----------------------------

@app.put("/streetlights/{streetlight_id}/fault")
def simulate_fault(
    streetlight_id: int,
    db: Session = Depends(get_db)
):

    streetlight = db.query(models.Streetlight).filter(
        models.Streetlight.id == streetlight_id
    ).first()

    if streetlight is None:
        return {
            "message": "Streetlight not found"
        }


    streetlight.fault = True

    streetlight.status = "OFF"

    streetlight.brightness = 0

    streetlight.power_usage = 0


    db.commit()
    db.refresh(streetlight)


    return streetlight


# -----------------------------
# Repair Streetlight
# -----------------------------

@app.put("/streetlights/{streetlight_id}/repair")
def repair_streetlight(
    streetlight_id: int,
    db: Session = Depends(get_db)
):

    streetlight = db.query(models.Streetlight).filter(
        models.Streetlight.id == streetlight_id
    ).first()

    if streetlight is None:
        return {
            "message": "Streetlight not found"
        }


    streetlight.fault = False

    streetlight.status = "ON"

    streetlight.brightness = 100

    streetlight.power_usage = 45


    db.commit()
    db.refresh(streetlight)


    return streetlight