"""
CodeFile Model
Represents a source code file within a project.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.vulnerability import Vulnerability


class CodeFile(Base):
    """
    CodeFile model - represents a source code file.
    
    Stores the actual content of uploaded/pasted code.
    """
    __tablename__ = "code_files"
    
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
    
    # File info
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(1000), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="files"
    )
    vulnerabilities: Mapped[List["Vulnerability"]] = relationship(
        "Vulnerability",
        back_populates="file",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<CodeFile(id={self.id}, filename={self.filename})>"
