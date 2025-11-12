import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Target record
    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Action
    action = Column(String(50), nullable=False)  # INSERT, UPDATE, DELETE

    # Changes
    old_values = Column(JSONB)
    new_values = Column(JSONB)

    # User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Additional context
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    description = Column(Text)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<AuditLog {self.action} on {self.table_name}>"
