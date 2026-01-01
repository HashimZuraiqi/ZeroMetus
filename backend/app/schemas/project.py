"""
Project Schemas
Pydantic models for project-related requests and responses.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class FileCreate(BaseModel):
    """Schema for creating a new file."""
    filename: str = Field(..., min_length=1, max_length=255)
    filepath: str = Field(..., min_length=1, max_length=1000)
    content: str = Field(..., min_length=1)


class FileResponse(BaseModel):
    """Schema for file response."""
    id: str
    filename: str
    filepath: str
    language: Optional[str] = None
    
    class Config:
        from_attributes = True


class FilesUpload(BaseModel):
    """Schema for uploading multiple files."""
    files: List[FileCreate] = Field(..., min_length=1)


class FilesUploadResponse(BaseModel):
    """Schema for file upload response."""
    project_id: str
    files_added: int
    files: List[FileResponse]


class ProjectCreate(BaseModel):
    """Schema for creating a new project."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    source_type: str = Field("paste", pattern="^(paste|upload|git)$")


class ProjectResponse(BaseModel):
    """Schema for project response."""
    id: str
    name: str
    description: Optional[str] = None
    source_type: str
    files_count: int = 0
    scans_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectDetail(ProjectResponse):
    """Schema for detailed project response."""
    files: List[FileResponse] = []
