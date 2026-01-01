"""
Fix Model
Represents an AI-generated fix for a vulnerability.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.vulnerability import Vulnerability
    from app.models.ai_decision_log import AIDecisionLog


class Fix(Base):
    """
    Fix model - represents an AI-generated fix.
    
    Contains the explanation, original code, fixed code,
    and tracks user decisions for future training data.
    """
    __tablename__ = "fixes"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    # Foreign key
    vuln_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vulnerabilities.id", ondelete="CASCADE"),
        nullable=False,
        unique=True  # One fix per vulnerability
    )
    
    # AI-generated content
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    original_code: Mapped[str] = mapped_column(Text, nullable=False)
    fixed_code: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Status tracking
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending"  # pending, approved, rejected
    )
    
    # User decision (for training data)
    user_decision: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True  # accept, reject, modify
    )
    decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    vulnerability: Mapped["Vulnerability"] = relationship(
        "Vulnerability",
        back_populates="fix"
    )
    ai_logs: Mapped[List["AIDecisionLog"]] = relationship(
        "AIDecisionLog",
        back_populates="fix",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Fix(id={self.id}, status={self.status})>"
