"""
AI Agent Prompts
Carefully crafted prompts for the AI reasoning layer.

These prompts are CRITICAL for system quality.
"""

from typing import List, Optional


SYSTEM_PROMPT = """You are a senior security engineer and code reviewer. Your role is to:

1. EXPLAIN security vulnerabilities in clear, educational language
2. PROPOSE secure code fixes that follow best practices
3. Be SPECIFIC about why the code is vulnerable
4. Be PRACTICAL in your fix recommendations

Rules:
- Always explain the vulnerability in terms a developer can understand
- Always provide working code fixes, not pseudocode
- Always maintain the original code's functionality
- Never introduce new vulnerabilities in your fixes
- Be concise but thorough

Output Format:
You MUST respond with valid JSON in this exact structure:
{
    "explanation": "Clear explanation of the vulnerability and its impact",
    "fixed_code": "The corrected code that fixes the vulnerability",
    "additional_notes": "Any extra security recommendations (optional)"
}"""


def get_fix_prompt(
    vuln_type: str,
    severity: str,
    code_snippet: str,
    context_before: Optional[List[str]] = None,
    context_after: Optional[List[str]] = None,
    rule_id: str = None
) -> str:
    """
    Generate a prompt for fixing a specific vulnerability.
    
    Args:
        vuln_type: Type of vulnerability (SQL_INJECTION, XSS, etc.)
        severity: Severity level (critical, high, medium, low)
        code_snippet: The vulnerable code
        context_before: Lines of code before the vulnerable section
        context_after: Lines of code after the vulnerable section
        rule_id: The ID of the rule that detected this vulnerability
        
    Returns:
        Formatted prompt string
    """
    context_section = ""
    if context_before or context_after:
        context_section = "\n\n## Code Context\n"
        if context_before:
            context_section += "**Before:**\n```\n" + "\n".join(context_before) + "\n```\n"
        if context_after:
            context_section += "**After:**\n```\n" + "\n".join(context_after) + "\n```\n"
    
    # Vulnerability-specific guidance
    vuln_guidance = get_vulnerability_guidance(vuln_type)
    
    prompt = f"""## Security Vulnerability Detected

**Type:** {vuln_type}
**Severity:** {severity.upper()}
**Rule ID:** {rule_id or "N/A"}

## Vulnerable Code
```
{code_snippet}
```
{context_section}
## Vulnerability Information
{vuln_guidance}

## Your Task
1. Explain why this code is vulnerable (be specific about attack vectors)
2. Provide a corrected version of the code that:
   - Fixes the vulnerability completely
   - Maintains the original functionality
   - Follows security best practices
3. Include any additional security recommendations

Remember: Respond ONLY with valid JSON in the specified format."""

    return prompt


def get_vulnerability_guidance(vuln_type: str) -> str:
    """Get specific guidance for each vulnerability type."""
    
    guidance = {
        "SQL_INJECTION": """
SQL Injection occurs when user input is directly concatenated into SQL queries.
Attackers can modify query logic to:
- Bypass authentication
- Extract sensitive data
- Modify or delete data
- Execute administrative operations

**Fix approach:** Use parameterized queries / prepared statements.""",

        "XSS": """
Cross-Site Scripting (XSS) occurs when untrusted data is included in web pages without validation.
Attackers can:
- Steal session cookies
- Redirect users to malicious sites
- Modify page content
- Capture user input

**Fix approach:** Sanitize/escape output, use safe DOM APIs.""",

        "COMMAND_INJECTION": """
Command Injection occurs when user input is passed to system commands.
Attackers can:
- Execute arbitrary commands
- Access/modify system files
- Establish reverse shells
- Pivot to other systems

**Fix approach:** Avoid shell commands, use libraries, validate input strictly.""",

        "HARDCODED_SECRET": """
Hardcoded secrets expose sensitive credentials in source code.
Risks include:
- Credential theft from version control
- Unauthorized access to services
- API abuse and quota theft
- Lateral movement in systems

**Fix approach:** Use environment variables or secret management systems.""",

        "INSECURE_DESERIALIZATION": """
Insecure deserialization allows attackers to manipulate serialized objects.
This can lead to:
- Remote code execution
- Privilege escalation
- Data tampering
- Denial of service

**Fix approach:** Use safe serialization formats, validate input, use allowlists.""",

        "INSECURE_CONFIG": """
Insecure configuration exposes applications to various attacks.
Common issues:
- Debug mode in production
- Overly permissive CORS
- Weak or default credentials
- Verbose error messages

**Fix approach:** Follow security hardening guides, use secure defaults.""",

        "WEAK_CRYPTO": """
Weak cryptographic algorithms can be broken by attackers.
Issues include:
- MD5/SHA1 collisions
- Weak encryption modes
- Insufficient key lengths
- Predictable random numbers

**Fix approach:** Use modern algorithms (SHA-256+, AES-256, etc.).""",

        "PATH_TRAVERSAL": """
Path traversal allows attackers to access files outside intended directories.
Attackers can:
- Read sensitive configuration files
- Access source code
- Read system files (/etc/passwd)
- Overwrite critical files

**Fix approach:** Validate paths, use allowlists, chroot where possible.""",

        "MISSING_AUTH": """
Missing or broken authentication allows unauthorized access.
Risks include:
- Unauthorized data access
- Account takeover
- Privilege escalation
- Data manipulation

**Fix approach:** Implement proper authentication, avoid hardcoded credentials."""
    }
    
    return guidance.get(vuln_type, "Analyze this security vulnerability and provide appropriate fixes.")
