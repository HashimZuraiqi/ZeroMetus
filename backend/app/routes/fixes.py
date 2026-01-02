"""
Fix Routes
API endpoints for viewing and deciding on fixes.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models import Vulnerability, Fix, AIDecisionLog
from app.schemas.fix import (
    FixResponse,
    FixDecision,
    FixDecisionResponse
)

router = APIRouter()


@router.get("/vulnerabilities/{vuln_id}/fix", response_model=FixResponse)
async def get_fix(
    vuln_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the AI-generated fix for a vulnerability.
    """
    # Verify vulnerability exists
    result = await db.execute(
        select(Vulnerability).where(Vulnerability.id == vuln_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vulnerability with ID '{vuln_id}' not found"
        )
    
    # Get fix
    result = await db.execute(
        select(Fix)
        .options(joinedload(Fix.ai_logs))
        .where(Fix.vuln_id == vuln_id)
    )
    fix = result.unique().scalar_one_or_none()
    
    if not fix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No fix available for vulnerability '{vuln_id}'"
        )
    
    # Get AI model from logs
    ai_model = None
    if fix.ai_logs:
        ai_model = fix.ai_logs[0].model_name
    
    return FixResponse(
        id=fix.id,
        vulnerability_id=fix.vuln_id,
        status=fix.status,
        explanation=fix.explanation,
        original_code=fix.original_code,
        fixed_code=fix.fixed_code,
        ai_model=ai_model,
        created_at=fix.created_at
    )


@router.post("/fixes/{fix_id}/decision", response_model=FixDecisionResponse)
async def submit_decision(
    fix_id: str,
    decision_data: FixDecision,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a decision (accept/reject/modify) for a fix.
    
    This data is stored for future AI training.
    """
    result = await db.execute(
        select(Fix).where(Fix.id == fix_id)
    )
    fix = result.scalar_one_or_none()
    
    if not fix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fix with ID '{fix_id}' not found"
        )
    
    # Update fix with decision
    decision_time = datetime.utcnow()
    
    fix.user_decision = decision_data.decision
    fix.decision_reason = decision_data.reason
    fix.decided_at = decision_time
    
    # Update status based on decision
    if decision_data.decision == "accept":
        fix.status = "approved"
    elif decision_data.decision == "reject":
        fix.status = "rejected"
    else:
        fix.status = "modified"
    
    await db.commit()
    await db.refresh(fix)
    
    return FixDecisionResponse(
        id=fix.id,
        status=fix.status,
        user_decision=fix.user_decision,
        decision_reason=fix.decision_reason,
        decided_at=fix.decided_at,
        message="Decision recorded successfully"
    )


@router.post("/fixes/{fix_id}/accept", response_model=FixDecisionResponse)
async def accept_fix(
    fix_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Accept a fix.
    """
    result = await db.execute(
        select(Fix).where(Fix.id == fix_id)
    )
    fix = result.scalar_one_or_none()
    
    if not fix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fix with ID '{fix_id}' not found"
        )
    
    fix.user_decision = "accept"
    fix.status = "approved"
    fix.decided_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(fix)
    
    return FixDecisionResponse(
        id=fix.id,
        status=fix.status,
        user_decision=fix.user_decision,
        decision_reason=None,
        decided_at=fix.decided_at,
        message="Fix accepted successfully"
    )


@router.post("/fixes/{fix_id}/reject")
async def reject_fix(
    fix_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Reject a fix with optional feedback.
    """
    result = await db.execute(
        select(Fix).where(Fix.id == fix_id)
    )
    fix = result.scalar_one_or_none()
    
    if not fix:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fix with ID '{fix_id}' not found"
        )
    
    fix.user_decision = "reject"
    fix.status = "rejected"
    fix.decided_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(fix)
    
    return {
        "id": fix.id,
        "status": fix.status,
        "message": "Fix rejected successfully"
    }
