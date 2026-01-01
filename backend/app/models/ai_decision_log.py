"""
AI Decision Log Model
Logs all AI model interactions for auditability and future training.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.fix import Fix


class AIDecisionLog(Base):
    """
    AI Decision Log model - tracks AI model interactions.
    
    Essential for:
    - Auditability
    - Cost tracking
    - Future model fine-tuning
    - Debugging AI responses
    """
    __tablename__ = "ai_decision_logs"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    # Foreign key
    fix_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("fixes.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Model info
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    
    # Usage stats
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Full response (for debugging/training)
    response_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    fix: Mapped["Fix"] = relationship(
        "Fix",
        back_populates="ai_logs"
    )
    
    def __repr__(self) -> str:
        return f"<AIDecisionLog(id={self.id}, model={self.model_name})>"
