"""
Security Rules Definition
Rule-based pattern detection for common vulnerabilities.

This is INTENTIONAL - we start with deterministic, explainable rules
that produce structured labels. AI reasoning comes AFTER this.
"""

import re
from typing import Dict, List, Any

# Severity levels
CRITICAL = "critical"
HIGH = "high"
MEDIUM = "medium"
LOW = "low"
INFO = "info"


class SecurityRule:
    """Represents a security detection rule."""
    
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        vuln_type: str,
        severity: str,
        languages: List[str],
        pattern: str,
        confidence: float = 1.0,
        cwe_id: str = None
    ):
        self.id = id
        self.name = name
        self.description = description
        self.vuln_type = vuln_type
        self.severity = severity
        self.languages = languages
        self.pattern = re.compile(pattern, re.MULTILINE | re.IGNORECASE)
        self.confidence = confidence
        self.cwe_id = cwe_id


# ============================================
# SECURITY RULES DATABASE
# ============================================

SECURITY_RULES: List[SecurityRule] = [
    
    # ==========================================
    # SQL INJECTION
    # ==========================================
    
    SecurityRule(
        id="SQL_INJECTION_FSTRING_001",
        name="SQL Injection via f-string",
        description="User input directly interpolated into SQL query using f-string",
        vuln_type="SQL_INJECTION",
        severity=CRITICAL,
        languages=["python"],
        pattern=r'f["\'].*(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER).*\{.*\}.*["\']',
        cwe_id="CWE-89"
    ),
    
    SecurityRule(
        id="SQL_INJECTION_FORMAT_002",
        name="SQL Injection via .format()",
        description="User input directly interpolated into SQL query using .format()",
        vuln_type="SQL_INJECTION",
        severity=CRITICAL,
        languages=["python"],
        pattern=r'["\'].*(?:SELECT|INSERT|UPDATE|DELETE).*\{\}.*["\']\.format\s*\(',
        cwe_id="CWE-89"
    ),
    
    SecurityRule(
        id="SQL_INJECTION_PERCENT_003",
        name="SQL Injection via % formatting",
        description="User input directly interpolated into SQL query using % operator",
        vuln_type="SQL_INJECTION",
        severity=CRITICAL,
        languages=["python"],
        pattern=r'["\'].*(?:SELECT|INSERT|UPDATE|DELETE).*%s.*["\'].*%',
        cwe_id="CWE-89"
    ),
    
    SecurityRule(
        id="SQL_INJECTION_CONCAT_004",
        name="SQL Injection via string concatenation",
        description="SQL query built using string concatenation with variables",
        vuln_type="SQL_INJECTION",
        severity=CRITICAL,
        languages=["python", "javascript", "java", "php", "ruby"],
        pattern=r'(?:SELECT|INSERT|UPDATE|DELETE|DROP).*["\'].*\+.*(?:req\.|request\.|params\.|input|user)',
        cwe_id="CWE-89"
    ),
    
    SecurityRule(
        id="SQL_INJECTION_JS_005",
        name="SQL Injection in JavaScript",
        description="SQL query built with template literals or concatenation",
        vuln_type="SQL_INJECTION",
        severity=CRITICAL,
        languages=["javascript", "typescript"],
        pattern=r'`.*(?:SELECT|INSERT|UPDATE|DELETE).*\$\{.*\}.*`',
        cwe_id="CWE-89"
    ),
    
    # ==========================================
    # CROSS-SITE SCRIPTING (XSS)
    # ==========================================
    
    SecurityRule(
        id="XSS_INNERHTML_001",
        name="XSS via innerHTML",
        description="Direct assignment to innerHTML can lead to XSS",
        vuln_type="XSS",
        severity=HIGH,
        languages=["javascript", "typescript"],
        pattern=r'\.innerHTML\s*=',
        cwe_id="CWE-79"
    ),
    
    SecurityRule(
        id="XSS_DOCUMENT_WRITE_002",
        name="XSS via document.write",
        description="document.write() can execute arbitrary scripts",
        vuln_type="XSS",
        severity=HIGH,
        languages=["javascript", "typescript"],
        pattern=r'document\.write\s*\(',
        cwe_id="CWE-79"
    ),
    
    SecurityRule(
        id="XSS_OUTERHTML_003",
        name="XSS via outerHTML",
        description="Direct assignment to outerHTML can lead to XSS",
        vuln_type="XSS",
        severity=HIGH,
        languages=["javascript", "typescript"],
        pattern=r'\.outerHTML\s*=',
        cwe_id="CWE-79"
    ),
    
    SecurityRule(
        id="XSS_DANGEROUSLY_SET_004",
        name="XSS via dangerouslySetInnerHTML",
        description="React dangerouslySetInnerHTML can lead to XSS if not sanitized",
        vuln_type="XSS",
        severity=MEDIUM,
        languages=["javascript", "typescript"],
        pattern=r'dangerouslySetInnerHTML',
        confidence=0.8,
        cwe_id="CWE-79"
    ),
    
    # ==========================================
    # COMMAND INJECTION
    # ==========================================
    
    SecurityRule(
        id="CMD_INJECTION_EVAL_001",
        name="Command Injection via eval()",
        description="eval() executes arbitrary code - extremely dangerous",
        vuln_type="COMMAND_INJECTION",
        severity=CRITICAL,
        languages=["python", "javascript", "typescript"],
        pattern=r'\beval\s*\(',
        cwe_id="CWE-94"
    ),
    
    SecurityRule(
        id="CMD_INJECTION_EXEC_002",
        name="Command Injection via exec()",
        description="exec() executes arbitrary code",
        vuln_type="COMMAND_INJECTION",
        severity=CRITICAL,
        languages=["python"],
        pattern=r'\bexec\s*\(',
        cwe_id="CWE-94"
    ),
    
    SecurityRule(
        id="CMD_INJECTION_OS_SYSTEM_003",
        name="Command Injection via os.system()",
        description="os.system() executes shell commands",
        vuln_type="COMMAND_INJECTION",
        severity=CRITICAL,
        languages=["python"],
        pattern=r'os\.system\s*\(',
        cwe_id="CWE-78"
    ),
    
    SecurityRule(
        id="CMD_INJECTION_SUBPROCESS_004",
        name="Command Injection via subprocess with shell=True",
        description="subprocess with shell=True is vulnerable to injection",
        vuln_type="COMMAND_INJECTION",
        severity=HIGH,
        languages=["python"],
        pattern=r'subprocess\.\w+\s*\([^)]*shell\s*=\s*True',
        cwe_id="CWE-78"
    ),
    
    SecurityRule(
        id="CMD_INJECTION_CHILD_PROCESS_005",
        name="Command Injection via child_process.exec",
        description="child_process.exec can execute arbitrary commands",
        vuln_type="COMMAND_INJECTION",
        severity=HIGH,
        languages=["javascript", "typescript"],
        pattern=r'child_process\.exec\s*\(',
        cwe_id="CWE-78"
    ),
    
    # ==========================================
    # HARDCODED SECRETS
    # ==========================================
    
    SecurityRule(
        id="SECRET_API_KEY_001",
        name="Hardcoded API Key",
        description="API key appears to be hardcoded in source code",
        vuln_type="HARDCODED_SECRET",
        severity=HIGH,
        languages=["python", "javascript", "typescript", "java", "go", "ruby", "php"],
        pattern=r'(?:api[_-]?key|apikey)\s*[=:]\s*["\'][a-zA-Z0-9_\-]{16,}["\']',
        confidence=0.85,
        cwe_id="CWE-798"
    ),
    
    SecurityRule(
        id="SECRET_PASSWORD_002",
        name="Hardcoded Password",
        description="Password appears to be hardcoded in source code",
        vuln_type="HARDCODED_SECRET",
        severity=CRITICAL,
        languages=["python", "javascript", "typescript", "java", "go", "ruby", "php"],
        pattern=r'(?:password|passwd|pwd)\s*[=:]\s*["\'][^"\']{4,}["\']',
        confidence=0.8,
        cwe_id="CWE-798"
    ),
    
    SecurityRule(
        id="SECRET_AWS_KEY_003",
        name="AWS Access Key",
        description="AWS access key ID found in source code",
        vuln_type="HARDCODED_SECRET",
        severity=CRITICAL,
        languages=["python", "javascript", "typescript", "java", "go", "ruby", "php"],
        pattern=r'AKIA[0-9A-Z]{16}',
        cwe_id="CWE-798"
    ),
    
    SecurityRule(
        id="SECRET_PRIVATE_KEY_004",
        name="Private Key Detected",
        description="Private key found in source code",
        vuln_type="HARDCODED_SECRET",
        severity=CRITICAL,
        languages=["python", "javascript", "typescript", "java", "go", "ruby", "php"],
        pattern=r'-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----',
        cwe_id="CWE-798"
    ),
    
    SecurityRule(
        id="SECRET_JWT_005",
        name="Hardcoded JWT Secret",
        description="JWT secret appears to be hardcoded",
        vuln_type="HARDCODED_SECRET",
        severity=HIGH,
        languages=["python", "javascript", "typescript", "java", "go", "ruby", "php"],
        pattern=r'(?:jwt[_-]?secret|secret[_-]?key)\s*[=:]\s*["\'][^"\']{8,}["\']',
        confidence=0.8,
        cwe_id="CWE-798"
    ),
    
    # ==========================================
    # INSECURE DESERIALIZATION
    # ==========================================
    
    SecurityRule(
        id="DESERIAL_PICKLE_001",
        name="Insecure Pickle Deserialization",
        description="pickle.loads() can execute arbitrary code",
        vuln_type="INSECURE_DESERIALIZATION",
        severity=CRITICAL,
        languages=["python"],
        pattern=r'pickle\.loads?\s*\(',
        cwe_id="CWE-502"
    ),
    
    SecurityRule(
        id="DESERIAL_YAML_002",
        name="Insecure YAML Load",
        description="yaml.load() without SafeLoader can execute arbitrary code",
        vuln_type="INSECURE_DESERIALIZATION",
        severity=HIGH,
        languages=["python"],
        pattern=r'yaml\.load\s*\([^)]*(?!Loader\s*=\s*(?:Safe|Base)Loader)',
        confidence=0.9,
        cwe_id="CWE-502"
    ),
    
    # ==========================================
    # INSECURE CONFIGURATION
    # ==========================================
    
    SecurityRule(
        id="CONFIG_DEBUG_001",
        name="Debug Mode Enabled",
        description="Debug mode should be disabled in production",
        vuln_type="INSECURE_CONFIG",
        severity=MEDIUM,
        languages=["python", "javascript", "typescript"],
        pattern=r'(?:DEBUG|debug)\s*[=:]\s*(?:True|true|1)',
        confidence=0.7,
        cwe_id="CWE-489"
    ),
    
    SecurityRule(
        id="CONFIG_CORS_ALL_002",
        name="CORS Allow All Origins",
        description="CORS configured to allow all origins (*)",
        vuln_type="INSECURE_CONFIG",
        severity=MEDIUM,
        languages=["python", "javascript", "typescript", "java"],
        pattern=r'(?:cors|access-control-allow-origin)\s*[=:]\s*["\']?\*["\']?',
        cwe_id="CWE-942"
    ),
    
    SecurityRule(
        id="CONFIG_SECRET_KEY_003",
        name="Insecure Secret Key",
        description="Secret key appears to be a weak/default value",
        vuln_type="INSECURE_CONFIG",
        severity=HIGH,
        languages=["python", "javascript", "typescript"],
        pattern=r'secret[_-]?key\s*[=:]\s*["\'](?:secret|changeme|password|default|dev|test)["\']',
        cwe_id="CWE-798"
    ),
    
    # ==========================================
    # WEAK CRYPTOGRAPHY
    # ==========================================
    
    SecurityRule(
        id="CRYPTO_MD5_001",
        name="Weak Hash Algorithm (MD5)",
        description="MD5 is cryptographically broken",
        vuln_type="WEAK_CRYPTO",
        severity=MEDIUM,
        languages=["python", "javascript", "typescript", "java", "php"],
        pattern=r'(?:md5|MD5)\s*\(',
        cwe_id="CWE-328"
    ),
    
    SecurityRule(
        id="CRYPTO_SHA1_002",
        name="Weak Hash Algorithm (SHA1)",
        description="SHA1 is deprecated for security purposes",
        vuln_type="WEAK_CRYPTO",
        severity=LOW,
        languages=["python", "javascript", "typescript", "java", "php"],
        pattern=r'(?:sha1|SHA1)\s*\(',
        confidence=0.8,
        cwe_id="CWE-328"
    ),
    
    # ==========================================
    # PATH TRAVERSAL
    # ==========================================
    
    SecurityRule(
        id="PATH_TRAVERSAL_001",
        name="Path Traversal Risk",
        description="File path constructed from user input without validation",
        vuln_type="PATH_TRAVERSAL",
        severity=HIGH,
        languages=["python", "javascript", "typescript"],
        pattern=r'(?:open|readFile|readFileSync)\s*\([^)]*(?:req\.|request\.|params\.|input)',
        confidence=0.75,
        cwe_id="CWE-22"
    ),
    
    # ==========================================
    # MISSING AUTHENTICATION
    # ==========================================
    
    SecurityRule(
        id="AUTH_BYPASS_001",
        name="Hardcoded Authentication Bypass",
        description="Hardcoded credentials or authentication bypass detected",
        vuln_type="MISSING_AUTH",
        severity=CRITICAL,
        languages=["python", "javascript", "typescript", "java", "php"],
        pattern=r'(?:if|when).*(?:password|user|admin)\s*[=!]=\s*["\'][^"\']+["\']',
        confidence=0.7,
        cwe_id="CWE-798"
    ),
]


def get_rules_for_language(language: str) -> List[SecurityRule]:
    """Get all rules applicable to a specific language."""
    return [
        rule for rule in SECURITY_RULES
        if language.lower() in rule.languages
    ]


# Vulnerability type metadata for recommendations and impact
VULN_TYPE_META = {
    "SQL_INJECTION": {
        "recommendation": "Use parameterized queries or prepared statements. Never concatenate user input directly into SQL queries.",
        "impact": "Attackers could read, modify, or delete database contents. May lead to full system compromise."
    },
    "XSS": {
        "recommendation": "Sanitize and encode all user-provided content before rendering. Use Content Security Policy headers.",
        "impact": "Attackers could steal user sessions, credentials, or perform actions on behalf of users."
    },
    "COMMAND_INJECTION": {
        "recommendation": "Avoid shell commands with user input. Use language-native functions or strict input validation.",
        "impact": "Attackers could execute arbitrary commands on the server, leading to full system compromise."
    },
    "PATH_TRAVERSAL": {
        "recommendation": "Validate file paths against an allowlist. Use secure path joining functions and sanitize user input.",
        "impact": "Attackers could read sensitive files or write malicious files to the system."
    },
    "INSECURE_DESERIALIZATION": {
        "recommendation": "Never deserialize untrusted data. Use safe serialization formats like JSON with strict schemas.",
        "impact": "Attackers could execute arbitrary code or manipulate application logic."
    },
    "HARDCODED_SECRET": {
        "recommendation": "Store secrets in environment variables or secret management systems. Never commit secrets to code.",
        "impact": "Exposed credentials could lead to unauthorized access to systems and data breaches."
    },
    "WEAK_CRYPTO": {
        "recommendation": "Use modern cryptographic algorithms (AES-256, SHA-256 or better). Avoid deprecated algorithms.",
        "impact": "Attackers could decrypt sensitive data or forge authentication tokens."
    },
    "INSECURE_RANDOM": {
        "recommendation": "Use cryptographically secure random number generators for security-sensitive operations.",
        "impact": "Attackers could predict tokens, session IDs, or other security-critical values."
    },
    "OPEN_REDIRECT": {
        "recommendation": "Validate redirect URLs against an allowlist of trusted domains.",
        "impact": "Attackers could redirect users to malicious sites for phishing or malware."
    },
    "SSRF": {
        "recommendation": "Validate and sanitize URLs. Use allowlists for permitted hosts and protocols.",
        "impact": "Attackers could access internal services or exfiltrate data from internal networks."
    },
    "XXE": {
        "recommendation": "Disable external entity processing in XML parsers. Use defused XML libraries.",
        "impact": "Attackers could read files, perform SSRF, or cause denial of service."
    },
    "LDAP_INJECTION": {
        "recommendation": "Use parameterized LDAP queries. Properly escape special characters in user input.",
        "impact": "Attackers could bypass authentication or access unauthorized directory information."
    },
    "HEADER_INJECTION": {
        "recommendation": "Validate and sanitize header values. Remove newline characters from user input.",
        "impact": "Attackers could inject malicious headers, leading to cache poisoning or XSS."
    },
    "PROTOTYPE_POLLUTION": {
        "recommendation": "Freeze Object.prototype. Avoid recursive merging of untrusted objects.",
        "impact": "Attackers could modify application behavior or bypass security controls."
    },
    "EVAL_INJECTION": {
        "recommendation": "Never use eval() with user input. Use safe alternatives like JSON.parse().",
        "impact": "Attackers could execute arbitrary code in the application context."
    },
}


def get_rule_info(rule_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific rule."""
    for rule in SECURITY_RULES:
        if rule.id == rule_id:
            vuln_meta = VULN_TYPE_META.get(rule.vuln_type, {})
            return {
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "vuln_type": rule.vuln_type,
                "severity": rule.severity,
                "cwe_id": rule.cwe_id,
                "languages": rule.languages,
                "recommendation": vuln_meta.get("recommendation", "Review and fix the vulnerable code."),
                "impact": vuln_meta.get("impact", "Could allow attackers to compromise the system.")
            }
    return {
        "id": rule_id,
        "name": rule_id,
        "description": "Unknown rule",
        "recommendation": "Review and fix the vulnerable code.",
        "impact": "Could allow attackers to compromise the system."
    }


def get_all_vuln_types() -> List[str]:
    """Get list of all vulnerability types."""
    return list(set(rule.vuln_type for rule in SECURITY_RULES))
