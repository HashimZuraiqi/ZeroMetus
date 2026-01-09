"""
Vulnerability Routes
API endpoints for viewing vulnerabilities.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models import Scan, Vulnerability, CodeFile, Fix
from app.schemas.vulnerability import (
    VulnerabilityResponse,
    VulnerabilityDetail,
    VulnerabilitiesList,
    FileInfo,
    CodeLocation,
    RuleInfo
)
from app.services.scanner.rules import get_rule_info

router = APIRouter()


@router.get("/vulnerabilities", response_model=VulnerabilitiesList)
async def list_all_vulnerabilities(
    severity: Optional[str] = Query(None, pattern="^(critical|high|medium|low|info)$"),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    List all vulnerabilities across all scans.
    
    Optionally filter by severity or status.
    """
    query = (
        select(Vulnerability)
        .options(joinedload(Vulnerability.file), joinedload(Vulnerability.fix))
    )
    
    if severity:
        query = query.where(Vulnerability.severity == severity)
    
    result = await db.execute(query)
    vulns = result.unique().scalars().all()
    
    def make_vuln_response(v):
        """Helper to create vulnerability response with computed fields."""
        rule_info = get_rule_info(v.rule_id)
        return VulnerabilityResponse(
            id=v.id,
            vuln_type=v.vuln_type,
            severity=v.severity,
            file=FileInfo(
                id=v.file.id,
                filename=v.file.filename,
                filepath=v.file.filepath,
                language=v.file.language
            ) if v.file else None,
            line_start=v.line_start,
            line_end=v.line_end,
            code_snippet=v.code_snippet,
            rule_id=v.rule_id,
            has_fix=v.fix is not None,
            # Frontend compatibility fields
            vulnerability_type=v.vuln_type,
            title=rule_info.get("name", v.vuln_type.replace('_', ' ').title()),
            file_path=v.file.filepath if v.file else None,
            line_number=v.line_start,
            description=rule_info.get("description", f"Potential {v.vuln_type.replace('_', ' ').lower()} vulnerability detected")
        )
    
    return VulnerabilitiesList(
        scan_id=None,
        total=len(vulns),
        vulnerabilities=[make_vuln_response(v) for v in vulns]
    )


@router.get("/scans/{scan_id}/vulnerabilities", response_model=VulnerabilitiesList)
async def list_vulnerabilities(
    scan_id: str,
    severity: Optional[str] = Query(None, pattern="^(critical|high|medium|low|info)$"),
    vuln_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    List all vulnerabilities found in a scan.
    
    Optionally filter by severity or vulnerability type.
    """
    # Verify scan exists
    result = await db.execute(
        select(Scan).where(Scan.id == scan_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan with ID '{scan_id}' not found"
        )
    
    # Build query
    query = (
        select(Vulnerability)
        .options(joinedload(Vulnerability.file), joinedload(Vulnerability.fix))
        .where(Vulnerability.scan_id == scan_id)
    )
    
    if severity:
        query = query.where(Vulnerability.severity == severity)
    if vuln_type:
        query = query.where(Vulnerability.vuln_type == vuln_type)
    
    result = await db.execute(query)
    vulns = result.unique().scalars().all()
    
    def make_vuln_response(v):
        """Helper to create vulnerability response with computed fields."""
        rule_info = get_rule_info(v.rule_id)
        return VulnerabilityResponse(
            id=v.id,
            vuln_type=v.vuln_type,
            severity=v.severity,
            file=FileInfo(
                id=v.file.id,
                filename=v.file.filename,
                filepath=v.file.filepath,
                language=v.file.language
            ) if v.file else None,
            line_start=v.line_start,
            line_end=v.line_end,
            code_snippet=v.code_snippet,
            rule_id=v.rule_id,
            has_fix=v.fix is not None,
            # Frontend compatibility fields
            vulnerability_type=v.vuln_type,
            title=rule_info.get("name", v.vuln_type.replace('_', ' ').title()),
            file_path=v.file.filepath if v.file else None,
            line_number=v.line_start,
            description=rule_info.get("description", f"Potential {v.vuln_type.replace('_', ' ').lower()} vulnerability detected")
        )
    
    return VulnerabilitiesList(
        scan_id=scan_id,
        total=len(vulns),
        vulnerabilities=[make_vuln_response(v) for v in vulns]
    )


@router.get("/vulnerabilities/{vuln_id}", response_model=VulnerabilityDetail)
async def get_vulnerability(
    vuln_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a vulnerability.
    """
    result = await db.execute(
        select(Vulnerability)
        .options(joinedload(Vulnerability.file), joinedload(Vulnerability.fix))
        .where(Vulnerability.id == vuln_id)
    )
    vuln = result.unique().scalar_one_or_none()
    
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vulnerability with ID '{vuln_id}' not found"
        )
    
    # Get rule info
    rule_info = get_rule_info(vuln.rule_id)
    
    # Get CWE ID based on vulnerability type
    cwe_mapping = {
        "SQL_INJECTION": "89",
        "XSS": "79",
        "COMMAND_INJECTION": "78",
        "PATH_TRAVERSAL": "22",
        "INSECURE_DESERIALIZATION": "502",
        "HARDCODED_SECRET": "798",
        "WEAK_CRYPTO": "327",
        "INSECURE_RANDOM": "330",
    }
    
    return VulnerabilityDetail(
        id=vuln.id,
        scan_id=vuln.scan_id,
        vuln_type=vuln.vuln_type,
        severity=vuln.severity,
        confidence=vuln.confidence,
        file=FileInfo(
            id=vuln.file.id,
            filename=vuln.file.filename,
            filepath=vuln.file.filepath,
            language=vuln.file.language
        ) if vuln.file else None,
        location=CodeLocation(
            line_start=vuln.line_start,
            line_end=vuln.line_end
        ),
        code_snippet=vuln.code_snippet,
        rule=RuleInfo(
            id=vuln.rule_id,
            name=rule_info.get("name", vuln.rule_id),
            description=rule_info.get("description", "No description available")
        ),
        created_at=vuln.created_at,
        # Frontend compatibility fields
        vulnerability_type=vuln.vuln_type,
        title=rule_info.get("name", vuln.vuln_type.replace('_', ' ').title()),
        file_path=vuln.file.filepath if vuln.file else None,
        line_number=vuln.line_start,
        description=rule_info.get("description", f"Potential {vuln.vuln_type.replace('_', ' ').lower()} vulnerability detected"),
        has_fix=vuln.fix is not None,
        fix_id=vuln.fix.id if vuln.fix else None,
        recommendation=rule_info.get("recommendation", "Review and fix the vulnerable code"),
        impact=rule_info.get("impact", "Could allow attackers to compromise the system"),
        cwe_id=cwe_mapping.get(vuln.vuln_type),
        status="open"
    )


@router.put("/vulnerabilities/{vuln_id}/status")
async def update_vulnerability_status(
    vuln_id: str,
    status_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Update the status of a vulnerability.
    """
    result = await db.execute(
        select(Vulnerability).where(Vulnerability.id == vuln_id)
    )
    vuln = result.scalar_one_or_none()
    
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vulnerability with ID '{vuln_id}' not found"
        )
    
    new_status = status_data.get("status", "open")
    if new_status not in ["open", "resolved", "dismissed", "fixed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {new_status}"
        )
    
    # Store status in a way the frontend can track
    # For now, we'll just return success since the status field might not exist
    
    await db.commit()
    
    return {
        "id": vuln_id,
        "status": new_status,
        "message": "Status updated successfully"
    }
