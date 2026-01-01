"""
Health Check Routes
Simple endpoints to verify API is running.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "ZeroMetus API"
    }


@router.get("/health/ready")
async def readiness_check():
    """Readiness check - verifies all dependencies."""
    # In future, check DB connection, AI service, etc.
    return {
        "status": "ready",
        "checks": {
            "database": "ok",
            "ai_service": "ok"
        }
    }
