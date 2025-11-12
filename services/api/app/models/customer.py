import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)

    # Personal info
    name = Column(String(255), nullable=False)
    national_id = Column(String(20))
    date_of_birth = Column(Date)
    gender = Column(String(10))

    # Contact
    email = Column(String(255))
    phone = Column(String(20))
    mobile = Column(String(20))

    # Address
    address = Column(Text)
    city = Column(String(100))
    province = Column(String(100))
    postal_code = Column(String(10))

    # Loyalty program
    loyalty_points = Column(Integer, default=0)
    member_since = Column(Date)
    membership_tier = Column(String(50))  # Bronze, Silver, Gold, Platinum

    # Medical info (optional)
    allergies = Column(Text)
    chronic_conditions = Column(Text)

    # Status
    is_active = Column(Boolean, default=True)

    # Notes
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sales_orders = relationship("SalesOrder", back_populates="customer")

    def __repr__(self):
        return f"<Customer {self.code} - {self.name}>"
