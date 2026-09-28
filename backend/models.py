from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base


class Streetlight(Base):
    __tablename__ = "streetlights"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String)
    status = Column(String)
    brightness = Column(Integer)
    power_usage = Column(Float)
    motion_detected = Column(Boolean)
    fault = Column(Boolean)