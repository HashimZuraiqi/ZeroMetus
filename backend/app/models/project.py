"""
Project Model
Represents a codebase/project submitted for analysis.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.code_file import CodeFile
    from app.models.scan import Scan
    from app.models.user import User


class Project(Base):
    """
    Project model - represents a codebase submitted for analysis.
    
    A project contains multiple code files and can have multiple scans.
    """
    __tablename__ = "projects"
    
    # Primary key
    id: Mapped[str] = mapped_column(
        String(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    # Owner relationship
    owner_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Project info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_type: Mapped[str] = mapped_column(
        String(50), 
        nullable=False,
        default="paste"  # paste, upload, git, github
    )
    
    # GitHub integration
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    github_branch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    owner: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="projects"
    )
    files: Mapped[List["CodeFile"]] = relationship(
        "CodeFile",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    scans: Mapped[List["Scan"]] = relationship(
        "Scan",
        back_populates="project",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name={self.name})>"
