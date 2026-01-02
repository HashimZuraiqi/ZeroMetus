"""
Scan Service
Orchestrates the scanning process.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings
from app.models import Scan, CodeFile, Vulnerability, Fix
from app.services.scanner.engine import SecurityScanner
from app.services.ai_agent.agent import AIAgent


# Create separate engine for background tasks
if settings.database_url.startswith("sqlite"):
    bg_engine = create_async_engine(
        settings.database_url,
        connect_args={"check_same_thread": False}
    )
else:
    bg_engine = create_async_engine(settings.database_url)

bg_session_maker = async_sessionmaker(bg_engine, class_=AsyncSession, expire_on_commit=False)


async def run_scan(
    scan_id: str,
    project_id: str,
    include_ai_fixes: bool = True
) -> None:
    """
    Execute a security scan in the background.
    
    This is the main orchestration function that:
    1. Updates scan status to running
    2. Loads all project files
    3. Runs the security scanner
    4. Stores vulnerabilities
    5. Optionally generates AI fixes
    6. Updates scan status to completed
    """
    async with bg_session_maker() as db:
        try:
            # Get scan record
            result = await db.execute(
                select(Scan).where(Scan.id == scan_id)
            )
            scan = result.scalar_one_or_none()
            
            if not scan:
                return
            
            # Update status to running
            scan.status = "running"
            scan.started_at = datetime.utcnow()
            await db.commit()
            
            # Get all files for the project
            result = await db.execute(
                select(CodeFile).where(CodeFile.project_id == project_id)
            )
            files = result.scalars().all()
            
            if not files:
                scan.status = "completed"
                scan.completed_at = datetime.utcnow()
                scan.total_files = 0
                scan.total_vulns = 0
                await db.commit()
                return
            
            # Initialize scanner
            scanner = SecurityScanner()
            
            # Scan each file
            total_vulns = 0
            
            for file in files:
                findings = scanner.scan_file(
                    content=file.content,
                    language=file.language or "",
                    filename=file.filename
                )
                
                # Store each finding as a vulnerability
                for finding in findings:
                    vuln = Vulnerability(
                        scan_id=scan_id,
                        file_id=file.id,
                        vuln_type=finding.vuln_type,
                        severity=finding.severity,
                        line_start=finding.line_start,
                        line_end=finding.line_end,
                        code_snippet=finding.code_snippet,
                        rule_id=finding.rule_id,
                        confidence=finding.confidence
                    )
                    db.add(vuln)
                    await db.flush()
                    
                    # Generate AI fix if enabled (non-blocking)
                    if include_ai_fixes:
                        try:
                            await generate_ai_fix(
                                db=db,
                                vulnerability=vuln,
                                file_content=file.content,
                                context_before=finding.context_before,
                                context_after=finding.context_after
                            )
                        except Exception as fix_error:
                            # Don't fail the scan if AI fix generation fails
                            print(f"AI fix generation skipped: {fix_error}")
                    
                    total_vulns += 1
            
            # Update scan completion
            scan.status = "completed"
            scan.completed_at = datetime.utcnow()
            scan.total_files = len(files)
            scan.total_vulns = total_vulns
            
            await db.commit()
            
        except Exception as e:
            # Update scan status to failed
            try:
                result = await db.execute(
                    select(Scan).where(Scan.id == scan_id)
                )
                scan = result.scalar_one_or_none()
                if scan:
                    scan.status = "failed"
                    scan.scan_metadata = scan.scan_metadata or {}
                    scan.scan_metadata["error"] = str(e)
                    await db.commit()
            except:
                pass
            raise


async def generate_ai_fix(
    db: AsyncSession,
    vulnerability: Vulnerability,
    file_content: str,
    context_before: list,
    context_after: list
) -> Optional[Fix]:
    """
    Generate an AI-powered fix for a vulnerability.
    """
    try:
        ai_agent = AIAgent()
        
        # Prepare context for AI
        fix_proposal = await ai_agent.generate_fix(
            vuln_type=vulnerability.vuln_type,
            severity=vulnerability.severity,
            code_snippet=vulnerability.code_snippet,
            context_before=context_before,
            context_after=context_after,
            rule_id=vulnerability.rule_id
        )
        
        if fix_proposal:
            fix = Fix(
                vuln_id=vulnerability.id,
                explanation=fix_proposal["explanation"],
                original_code=vulnerability.code_snippet,
                fixed_code=fix_proposal["fixed_code"],
                status="pending"
            )
            db.add(fix)
            await db.flush()
            
            # Log AI decision (optional - don't fail if logging fails)
            try:
                await ai_agent.log_decision(
                    db=db,
                    fix_id=fix.id,
                    response=fix_proposal
                )
            except Exception as log_error:
                print(f"AI decision logging failed (non-critical): {log_error}")
            
            return fix
    except Exception as e:
        # Don't fail the scan if AI fix generation fails
        print(f"AI fix generation failed: {e}")
        # Rollback any pending changes from this function
        try:
            await db.rollback()
        except:
            pass
        return None
