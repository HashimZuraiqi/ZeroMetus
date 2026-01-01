"""
ZeroMetus FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, close_db
from app.routes import projects, scans, vulnerabilities, fixes, health, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs on startup and shutdown.
    """
    # Startup
    print(f"🛡️  Starting {settings.app_name}...")
    await init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print(f"👋 Shutting down {settings.app_name}...")
    await close_db()
    print("✅ Database connections closed")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Security & Vulnerability Detection Agent",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix=settings.api_prefix, tags=["Authentication"])
app.include_router(projects.router, prefix=settings.api_prefix, tags=["Projects"])
app.include_router(scans.router, prefix=settings.api_prefix, tags=["Scans"])
app.include_router(vulnerabilities.router, prefix=settings.api_prefix, tags=["Vulnerabilities"])
app.include_router(fixes.router, prefix=settings.api_prefix, tags=["Fixes"])


@app.get("/")
async def root():
    """Root endpoint - basic info."""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs" if settings.debug else "disabled"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.is_development
    )
