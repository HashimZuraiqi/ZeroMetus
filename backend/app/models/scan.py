"""
Scan Model
Represents a security scan of a project.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Any

from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.vulnerability import Vulnerability


class Scan(Base):
    """
    Scan model - represents a security scan.
    
    Tracks scan status and aggregates results.
    """
    __tablename__ = "scans"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    
    # Foreign key
    project_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Scan status
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending"  # pending, running, completed, failed
    )
    
    # Timestamps
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Statistics
    total_files: Mapped[int] = mapped_column(Integer, default=0)
    total_vulns: Mapped[int] = mapped_column(Integer, default=0)
    
    # Additional scan metadata (JSON)
    scan_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="scans"
    )
    vulnerabilities: Mapped[List["Vulnerability"]] = relationship(
        "Vulnerability",
        back_populates="scan",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Scan(id={self.id}, status={self.status})>"
