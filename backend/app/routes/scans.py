"""
Scan Routes
API endpoints for managing security scans.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Project, Scan, Vulnerability
from app.schemas.scan import (
    ScanCreate,
    ScanResponse,
    ScanSummary,
    ScanProgress,
    SeverityCounts
)
from app.services.scan_service import run_scan

router = APIRouter()


@router.post("/scans", response_model=ScanResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_scan(
    scan_data: ScanCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Start a new security scan for a project.
    
    The scan runs asynchronously. Use GET /scans/{id} to check status.
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == scan_data.project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{scan_data.project_id}' not found"
        )
    
    # Create scan record
    scan = Scan(
        project_id=scan_data.project_id,
        status="pending",
        scan_metadata={
            "options": scan_data.scan_options.model_dump() if scan_data.scan_options else {}
        }
    )
    
    db.add(scan)
    await db.commit()
    await db.refresh(scan)
    
    # Trigger background scan
    background_tasks.add_task(
        run_scan,
        scan_id=scan.id,
        project_id=scan_data.project_id,
        include_ai_fixes=scan_data.scan_options.include_ai_fixes if scan_data.scan_options else True
    )
    
    return ScanResponse(
        id=scan.id,
        project_id=scan.project_id,
        status=scan.status,
        started_at=scan.started_at,
        completed_at=scan.completed_at,
        message="Scan queued successfully"
    )


@router.get("/scans/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get scan status and results.
    """
    result = await db.execute(
        select(Scan).where(Scan.id == scan_id)
    )
    scan = result.scalar_one_or_none()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID '{scan_id}' not found"
        )
    
    # Build response based on status
    response = ScanResponse(
        id=scan.id,
        project_id=scan.project_id,
        status=scan.status,
        started_at=scan.started_at,
        completed_at=scan.completed_at
    )
    
    if scan.status == "running":
        # Add progress info
        response.progress = ScanProgress(
            files_scanned=scan.scan_metadata.get("files_scanned", 0) if scan.scan_metadata else 0,
            total_files=scan.total_files,
            percentage=int((scan.scan_metadata.get("files_scanned", 0) / max(scan.total_files, 1)) * 100) if scan.scan_metadata else 0
        )
    
    if scan.status == "completed":
        # Get vulnerability counts by severity
        vulns_result = await db.execute(
            select(Vulnerability).where(Vulnerability.scan_id == scan_id)
        )
        vulns = vulns_result.scalars().all()
        
        severity_counts = SeverityCounts()
        for vuln in vulns:
            if vuln.severity == "critical":
                severity_counts.critical += 1
            elif vuln.severity == "high":
                severity_counts.high += 1
            elif vuln.severity == "medium":
                severity_counts.medium += 1
            elif vuln.severity == "low":
                severity_counts.low += 1
            else:
                severity_counts.info += 1
        
        response.summary = ScanSummary(
            total_files=scan.total_files,
            total_vulnerabilities=scan.total_vulns,
            by_severity=severity_counts
        )
    
    return response


@router.delete("/scans/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(
    scan_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a scan and all associated data.
    """
    result = await db.execute(
        select(Scan).where(Scan.id == scan_id)
    )
    scan = result.scalar_one_or_none()
    
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID '{scan_id}' not found"
        )
    
    await db.delete(scan)
    await db.commit()
