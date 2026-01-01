# ZeroMetus API Contracts

## 🌐 Base URL
```
Development: http://localhost:8000/api/v1
```

---

## 📋 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /projects | Create new project |
| GET | /projects/{id} | Get project details |
| POST | /projects/{id}/files | Upload files to project |
| POST | /scans | Start a new scan |
| GET | /scans/{id} | Get scan status & results |
| GET | /scans/{id}/vulnerabilities | Get vulnerabilities for scan |
| GET | /vulnerabilities/{id} | Get vulnerability details |
| GET | /vulnerabilities/{id}/fix | Get fix for vulnerability |
| POST | /fixes/{id}/decision | Submit user decision on fix |

---

## 📁 Projects

### Create Project
```http
POST /api/v1/projects
Content-Type: application/json
```

**Request:**
```json
{
    "name": "my-web-app",
    "description": "E-commerce backend API",
    "source_type": "paste"
}
```

**Response (201 Created):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "my-web-app",
    "description": "E-commerce backend API",
    "source_type": "paste",
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
}
```

---

### Get Project
```http
GET /api/v1/projects/{project_id}
```

**Response (200 OK):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "my-web-app",
    "description": "E-commerce backend API",
    "source_type": "paste",
    "files_count": 5,
    "scans_count": 2,
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
}
```

---

### Upload Files to Project
```http
POST /api/v1/projects/{project_id}/files
Content-Type: application/json
```

**Request:**
```json
{
    "files": [
        {
            "filename": "app.py",
            "filepath": "src/app.py",
            "content": "from flask import Flask\nimport os\n\nquery = f\"SELECT * FROM users WHERE id = {user_id}\"\n..."
        },
        {
            "filename": "utils.js",
            "filepath": "public/js/utils.js",
            "content": "function render(data) {\n  document.innerHTML = data;\n}"
        }
    ]
}
```

**Response (201 Created):**
```json
{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "files_added": 2,
    "files": [
        {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "filename": "app.py",
            "filepath": "src/app.py",
            "language": "python"
        },
        {
            "id": "660e8400-e29b-41d4-a716-446655440002",
            "filename": "utils.js",
            "filepath": "public/js/utils.js",
            "language": "javascript"
        }
    ]
}
```

---

## 🔍 Scans

### Start Scan
```http
POST /api/v1/scans
Content-Type: application/json
```

**Request:**
```json
{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "scan_options": {
        "include_ai_fixes": true,
        "severity_threshold": "low"
    }
}
```

**Response (202 Accepted):**
```json
{
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "started_at": null,
    "message": "Scan queued successfully"
}
```

---

### Get Scan Status & Results
```http
GET /api/v1/scans/{scan_id}
```

**Response (200 OK) - In Progress:**
```json
{
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "running",
    "started_at": "2026-01-01T10:01:00Z",
    "completed_at": null,
    "progress": {
        "files_scanned": 3,
        "total_files": 5,
        "percentage": 60
    }
}
```

**Response (200 OK) - Completed:**
```json
{
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "started_at": "2026-01-01T10:01:00Z",
    "completed_at": "2026-01-01T10:01:15Z",
    "summary": {
        "total_files": 5,
        "total_vulnerabilities": 8,
        "by_severity": {
            "critical": 1,
            "high": 3,
            "medium": 2,
            "low": 2,
            "info": 0
        }
    }
}
```

---

### Get Vulnerabilities for Scan
```http
GET /api/v1/scans/{scan_id}/vulnerabilities
```

**Query Parameters:**
- `severity` (optional): Filter by severity (critical, high, medium, low, info)
- `type` (optional): Filter by vulnerability type

**Response (200 OK):**
```json
{
    "scan_id": "770e8400-e29b-41d4-a716-446655440000",
    "total": 8,
    "vulnerabilities": [
        {
            "id": "880e8400-e29b-41d4-a716-446655440001",
            "vuln_type": "SQL_INJECTION",
            "severity": "critical",
            "file": {
                "id": "660e8400-e29b-41d4-a716-446655440001",
                "filename": "app.py",
                "filepath": "src/app.py"
            },
            "line_start": 15,
            "line_end": 15,
            "code_snippet": "query = f\"SELECT * FROM users WHERE id = {user_id}\"",
            "rule_id": "PYTHON_SQL_INJECTION_001",
            "has_fix": true
        },
        {
            "id": "880e8400-e29b-41d4-a716-446655440002",
            "vuln_type": "XSS",
            "severity": "high",
            "file": {
                "id": "660e8400-e29b-41d4-a716-446655440002",
                "filename": "utils.js",
                "filepath": "public/js/utils.js"
            },
            "line_start": 2,
            "line_end": 2,
            "code_snippet": "document.innerHTML = data;",
            "rule_id": "JS_XSS_INNERHTML_001",
            "has_fix": true
        }
    ]
}
```

---

## 🐛 Vulnerabilities

### Get Vulnerability Details
```http
GET /api/v1/vulnerabilities/{vuln_id}
```

**Response (200 OK):**
```json
{
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "scan_id": "770e8400-e29b-41d4-a716-446655440000",
    "vuln_type": "SQL_INJECTION",
    "severity": "critical",
    "confidence": 0.95,
    "file": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "filename": "app.py",
        "filepath": "src/app.py",
        "language": "python"
    },
    "location": {
        "line_start": 15,
        "line_end": 15,
        "column_start": 1,
        "column_end": 55
    },
    "code_snippet": "query = f\"SELECT * FROM users WHERE id = {user_id}\"",
    "context": {
        "before": ["def get_user(user_id):", "    conn = get_db()"],
        "after": ["    cursor.execute(query)", "    return cursor.fetchone()"]
    },
    "rule": {
        "id": "PYTHON_SQL_INJECTION_001",
        "name": "SQL Injection via f-string",
        "description": "User input directly interpolated into SQL query"
    },
    "created_at": "2026-01-01T10:01:10Z"
}
```

---

### Get Fix for Vulnerability
```http
GET /api/v1/vulnerabilities/{vuln_id}/fix
```

**Response (200 OK):**
```json
{
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "vulnerability_id": "880e8400-e29b-41d4-a716-446655440001",
    "status": "pending",
    "explanation": "This code is vulnerable to SQL injection because user input is directly interpolated into the SQL query using an f-string. An attacker could input something like `1 OR 1=1` to bypass authentication or `1; DROP TABLE users;--` to delete data.\n\n**Why this is dangerous:**\n- Allows unauthorized data access\n- Can lead to data modification or deletion\n- May enable privilege escalation\n\n**The fix:**\nUse parameterized queries instead of string interpolation. This ensures user input is treated as data, not as part of the SQL command.",
    "original_code": "query = f\"SELECT * FROM users WHERE id = {user_id}\"",
    "fixed_code": "query = \"SELECT * FROM users WHERE id = %s\"\ncursor.execute(query, (user_id,))",
    "ai_model": "gpt-4",
    "created_at": "2026-01-01T10:01:12Z"
}
```

---

## ✅ Fixes

### Submit Decision on Fix
```http
POST /api/v1/fixes/{fix_id}/decision
Content-Type: application/json
```

**Request:**
```json
{
    "decision": "accept",
    "reason": "Fix looks correct and follows best practices"
}
```

**Allowed decisions:** `accept`, `reject`, `modify`

**Response (200 OK):**
```json
{
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "status": "approved",
    "user_decision": "accept",
    "decision_reason": "Fix looks correct and follows best practices",
    "decided_at": "2026-01-01T10:05:00Z",
    "message": "Decision recorded successfully"
}
```

---

## ❌ Error Responses

### Standard Error Format
```json
{
    "error": {
        "code": "RESOURCE_NOT_FOUND",
        "message": "Scan with ID '123' not found",
        "details": null
    }
}
```

### Error Codes
| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 404 | RESOURCE_NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Resource already exists |
| 422 | UNPROCESSABLE_ENTITY | Valid JSON but invalid data |
| 500 | INTERNAL_ERROR | Server error |

---

## 🔐 Authentication (Future)

MVP has no authentication. Future implementation:

```http
Authorization: Bearer <jwt_token>
```

---

## 📊 Rate Limiting (Future)

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```
