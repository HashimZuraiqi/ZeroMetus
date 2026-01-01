"""
Project Routes
API endpoints for managing projects and code files.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import Project, CodeFile, Scan
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    FilesUpload,
    FilesUploadResponse,
    FileResponse
)
from app.services.scanner.language_detector import detect_language

router = APIRouter()


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new project.
    
    A project is a container for code files that will be scanned.
    """
    project = Project(
        name=project_data.name,
        description=project_data.description,
        source_type=project_data.source_type
    )
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        source_type=project.source_type,
        files_count=0,
        scans_count=0,
        created_at=project.created_at,
        updated_at=project.updated_at
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get project details by ID.
    """
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found"
        )
    
    # Get counts
    files_count = await db.scalar(
        select(func.count(CodeFile.id)).where(CodeFile.project_id == project_id)
    )
    scans_count = await db.scalar(
        select(func.count(Scan.id)).where(Scan.project_id == project_id)
    )
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        source_type=project.source_type,
        files_count=files_count or 0,
        scans_count=scans_count or 0,
        created_at=project.created_at,
        updated_at=project.updated_at
    )


@router.post(
    "/projects/{project_id}/files",
    response_model=FilesUploadResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_files(
    project_id: str,
    files_data: FilesUpload,
    db: AsyncSession = Depends(get_db)
):
    """
    Upload code files to a project.
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found"
        )
    
    # Create file records
    created_files: List[FileResponse] = []
    
    for file_data in files_data.files:
        # Detect language from filename
        language = detect_language(file_data.filename)
        
        code_file = CodeFile(
            project_id=project_id,
            filename=file_data.filename,
            filepath=file_data.filepath,
            content=file_data.content,
            language=language
        )
        
        db.add(code_file)
        await db.flush()  # Get the ID
        
        created_files.append(FileResponse(
            id=code_file.id,
            filename=code_file.filename,
            filepath=code_file.filepath,
            language=code_file.language
        ))
    
    await db.commit()
    
    return FilesUploadResponse(
        project_id=project_id,
        files_added=len(created_files),
        files=created_files
    )


@router.get("/projects/{project_id}/files", response_model=List[FileResponse])
async def list_files(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    List all files in a project.
    """
    # Verify project exists
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found"
        )
    
    # Get files
    result = await db.execute(
        select(CodeFile).where(CodeFile.project_id == project_id)
    )
    files = result.scalars().all()
    
    return [
        FileResponse(
            id=f.id,
            filename=f.filename,
            filepath=f.filepath,
            language=f.language
        )
        for f in files
    ]
