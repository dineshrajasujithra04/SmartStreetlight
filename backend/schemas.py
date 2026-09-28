from pydantic import BaseModel


class StreetlightCreate(BaseModel):
    location: str
    status: str
    brightness: int
    power_usage: float
    motion_detected: bool
    fault: bool


class StreetlightUpdate(BaseModel):
    status: str
    brightness: int