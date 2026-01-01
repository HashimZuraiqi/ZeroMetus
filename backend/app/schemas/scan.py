"""
Scan Schemas
Pydantic models for scan-related requests and responses.
"""

from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field


class ScanOptions(BaseModel):
    """Options for configuring a scan."""
    include_ai_fixes: bool = True
    severity_threshold: str = Field("low", pattern="^(critical|high|medium|low|info)$")


class ScanCreate(BaseModel):
    """Schema for creating a new scan."""
    project_id: str
    scan_options: Optional[ScanOptions] = None


class ScanProgress(BaseModel):
    """Schema for scan progress."""
    files_scanned: int
    total_files: int
    percentage: int


class SeverityCounts(BaseModel):
    """Schema for vulnerability counts by severity."""
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class ScanSummary(BaseModel):
    """Schema for scan summary."""
    total_files: int
    total_vulnerabilities: int
    by_severity: SeverityCounts


class ScanResponse(BaseModel):
    """Schema for scan response."""
    id: str
    project_id: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    message: Optional[str] = None
    progress: Optional[ScanProgress] = None
    summary: Optional[ScanSummary] = None
    
    class Config:
        from_attributes = True
