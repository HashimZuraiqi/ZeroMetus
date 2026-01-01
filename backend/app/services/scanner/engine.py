"""
Security Scanner Engine
Core scanning logic that analyzes code for vulnerabilities.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from app.services.scanner.rules import SecurityRule, get_rules_for_language


@dataclass
class Finding:
    """Represents a security finding from the scanner."""
    rule_id: str
    vuln_type: str
    severity: str
    line_start: int
    line_end: int
    code_snippet: str
    confidence: float
    context_before: List[str]
    context_after: List[str]


class SecurityScanner:
    """
    Security Scanner Engine.
    
    Performs rule-based static analysis on source code.
    This is deterministic and explainable - AI reasoning comes later.
    """
    
    def __init__(self):
        self.findings: List[Finding] = []
    
    def scan_file(
        self,
        content: str,
        language: str,
        filename: str = "unknown"
    ) -> List[Finding]:
        """
        Scan a single file for vulnerabilities.
        
        Args:
            content: The source code content
            language: Programming language
            filename: Name of the file (for reporting)
            
        Returns:
            List of findings
        """
        findings: List[Finding] = []
        
        if not language:
            return findings
        
        # Get rules for this language
        rules = get_rules_for_language(language)
        
        if not rules:
            return findings
        
        # Split content into lines for context extraction
        lines = content.split('\n')
        
        # Apply each rule
        for rule in rules:
            rule_findings = self._apply_rule(rule, content, lines)
            findings.extend(rule_findings)
        
        return findings
    
    def _apply_rule(
        self,
        rule: SecurityRule,
        content: str,
        lines: List[str]
    ) -> List[Finding]:
        """Apply a single rule to the content."""
        findings: List[Finding] = []
        
        # Find all matches
        for match in rule.pattern.finditer(content):
            # Calculate line number
            line_start = content[:match.start()].count('\n') + 1
            line_end = content[:match.end()].count('\n') + 1
            
            # Extract code snippet (the matched line(s))
            snippet_lines = lines[line_start - 1:line_end]
            code_snippet = '\n'.join(snippet_lines)
            
            # Get context (3 lines before and after)
            context_start = max(0, line_start - 4)
            context_end = min(len(lines), line_end + 3)
            
            context_before = lines[context_start:line_start - 1]
            context_after = lines[line_end:context_end]
            
            findings.append(Finding(
                rule_id=rule.id,
                vuln_type=rule.vuln_type,
                severity=rule.severity,
                line_start=line_start,
                line_end=line_end,
                code_snippet=code_snippet.strip(),
                confidence=rule.confidence,
                context_before=context_before,
                context_after=context_after
            ))
        
        return findings
    
    def scan_multiple_files(
        self,
        files: List[Dict[str, Any]]
    ) -> Dict[str, List[Finding]]:
        """
        Scan multiple files.
        
        Args:
            files: List of dicts with 'content', 'language', 'filename' keys
            
        Returns:
            Dict mapping filename to findings
        """
        results: Dict[str, List[Finding]] = {}
        
        for file_data in files:
            content = file_data.get("content", "")
            language = file_data.get("language", "")
            filename = file_data.get("filename", "unknown")
            
            findings = self.scan_file(content, language, filename)
            results[filename] = findings
        
        return results
    
    @staticmethod
    def get_severity_priority(severity: str) -> int:
        """Get numeric priority for severity (for sorting)."""
        priorities = {
            "critical": 0,
            "high": 1,
            "medium": 2,
            "low": 3,
            "info": 4
        }
        return priorities.get(severity.lower(), 5)
    
    @staticmethod
    def sort_findings_by_severity(findings: List[Finding]) -> List[Finding]:
        """Sort findings by severity (critical first)."""
        return sorted(
            findings,
            key=lambda f: SecurityScanner.get_severity_priority(f.severity)
        )
