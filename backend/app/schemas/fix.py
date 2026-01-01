"""
Fix Schemas
Pydantic models for fix-related requests and responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FixResponse(BaseModel):
    """Schema for fix response."""
    id: str
    vulnerability_id: str
    status: str
    explanation: str
    original_code: str
    fixed_code: str
    ai_model: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class FixDecision(BaseModel):
    """Schema for submitting a fix decision."""
    decision: str = Field(..., pattern="^(accept|reject|modify)$")
    reason: Optional[str] = Field(None, max_length=1000)


class FixDecisionResponse(BaseModel):
    """Schema for fix decision response."""
    id: str
    status: str
    user_decision: str
    decision_reason: Optional[str] = None
    decided_at: datetime
    message: str
    
    class Config:
        from_attributes = True
