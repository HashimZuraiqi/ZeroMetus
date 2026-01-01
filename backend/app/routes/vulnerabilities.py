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
    
    return VulnerabilitiesList(
        scan_id=scan_id,
        total=len(vulns),
        vulnerabilities=[
            VulnerabilityResponse(
                id=v.id,
                vuln_type=v.vuln_type,
                severity=v.severity,
                file=FileInfo(
                    id=v.file.id,
                    filename=v.file.filename,
                    filepath=v.file.filepath,
                    language=v.file.language
                ),
                line_start=v.line_start,
                line_end=v.line_end,
                code_snippet=v.code_snippet,
                rule_id=v.rule_id,
                has_fix=v.fix is not None
            )
            for v in vulns
        ]
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
        .options(joinedload(Vulnerability.file))
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
        ),
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
        created_at=vuln.created_at
    )
