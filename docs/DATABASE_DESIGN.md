# ZeroMetus Database Design

## 📊 Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │  (Future - not MVP)
├─────────────────┤
│ id (PK)         │
│ email           │
│ created_at      │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│    PROJECTS     │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │──────────────────────────────────────┐
│ name            │                                      │
│ description     │                                      │
│ source_type     │  (paste/upload/git)                  │
│ created_at      │                                      │
│ updated_at      │                                      │
└────────┬────────┘                                      │
         │ 1:N                                           │
         ▼                                               │
┌─────────────────┐                                      │
│     SCANS       │                                      │
├─────────────────┤                                      │
│ id (PK)         │                                      │
│ project_id (FK) │◀─────────────────────────────────────┘
│ status          │  (pending/running/completed/failed)
│ started_at      │
│ completed_at    │
│ total_files     │
│ total_vulns     │
│ metadata (JSON) │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│ VULNERABILITIES │       │   CODE_FILES    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ scan_id (FK)    │       │ project_id (FK) │
│ file_id (FK)    │──────▶│ filename        │
│ vuln_type       │       │ filepath        │
│ severity        │       │ content         │
│ line_start      │       │ language        │
│ line_end        │       │ created_at      │
│ code_snippet    │       └─────────────────┘
│ rule_id         │
│ confidence      │
│ created_at      │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐
│      FIXES      │
├─────────────────┤
│ id (PK)         │
│ vuln_id (FK)    │
│ explanation     │  (AI-generated)
│ original_code   │
│ fixed_code      │
│ status          │  (pending/approved/rejected)
│ user_decision   │  (accept/reject/modify)
│ decision_reason │  (optional user feedback)
│ decided_at      │
│ created_at      │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│ AI_DECISION_LOG │
├─────────────────┤
│ id (PK)         │
│ fix_id (FK)     │
│ model_name      │  (gpt-4, claude, local)
│ prompt_hash     │
│ input_tokens    │
│ output_tokens   │
│ latency_ms      │
│ response_json   │  (full AI response)
│ created_at      │
└─────────────────┘
```

---

## 📋 Table Definitions

### projects
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| user_id | UUID | FK, NULLABLE | Owner (future) |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULLABLE | Project description |
| source_type | VARCHAR(50) | NOT NULL | 'paste', 'upload', 'git' |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

### code_files
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects.id | Parent project |
| filename | VARCHAR(255) | NOT NULL | File name |
| filepath | VARCHAR(1000) | NOT NULL | Relative path |
| content | TEXT | NOT NULL | File content |
| language | VARCHAR(50) | NULLABLE | Detected language |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

### scans
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects.id | Parent project |
| status | VARCHAR(50) | NOT NULL | pending/running/completed/failed |
| started_at | TIMESTAMP | NULLABLE | Scan start time |
| completed_at | TIMESTAMP | NULLABLE | Scan end time |
| total_files | INTEGER | DEFAULT 0 | Files scanned |
| total_vulns | INTEGER | DEFAULT 0 | Vulns found |
| metadata | JSONB | NULLABLE | Extra scan info |

### vulnerabilities
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| scan_id | UUID | FK → scans.id | Parent scan |
| file_id | UUID | FK → code_files.id | Source file |
| vuln_type | VARCHAR(100) | NOT NULL | SQL_INJECTION, XSS, etc |
| severity | VARCHAR(20) | NOT NULL | critical/high/medium/low/info |
| line_start | INTEGER | NOT NULL | Starting line |
| line_end | INTEGER | NOT NULL | Ending line |
| code_snippet | TEXT | NOT NULL | Vulnerable code |
| rule_id | VARCHAR(100) | NOT NULL | Rule that matched |
| confidence | FLOAT | DEFAULT 1.0 | Detection confidence |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

### fixes
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| vuln_id | UUID | FK → vulnerabilities.id | Parent vuln |
| explanation | TEXT | NOT NULL | AI explanation |
| original_code | TEXT | NOT NULL | Original vulnerable code |
| fixed_code | TEXT | NOT NULL | Proposed fix |
| status | VARCHAR(50) | DEFAULT 'pending' | pending/approved/rejected |
| user_decision | VARCHAR(50) | NULLABLE | accept/reject/modify |
| decision_reason | TEXT | NULLABLE | User feedback |
| decided_at | TIMESTAMP | NULLABLE | Decision time |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

### ai_decision_logs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| fix_id | UUID | FK → fixes.id | Parent fix |
| model_name | VARCHAR(100) | NOT NULL | Model used |
| prompt_hash | VARCHAR(64) | NOT NULL | SHA256 of prompt |
| input_tokens | INTEGER | NULLABLE | Tokens in |
| output_tokens | INTEGER | NULLABLE | Tokens out |
| latency_ms | INTEGER | NULLABLE | Response time |
| response_json | JSONB | NOT NULL | Full response |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

---

## 🏷️ Enums & Constants

### Vulnerability Types
```python
VULN_TYPES = [
    "SQL_INJECTION",
    "XSS",
    "COMMAND_INJECTION",
    "PATH_TRAVERSAL",
    "HARDCODED_SECRET",
    "INSECURE_DESERIALIZATION",
    "DANGEROUS_FUNCTION",
    "WEAK_CRYPTO",
    "INSECURE_CONFIG",
    "MISSING_AUTH",
    "SENSITIVE_DATA_EXPOSURE",
    "OTHER"
]
```

### Severity Levels
```python
SEVERITY_LEVELS = [
    "critical",  # Immediate exploitation possible
    "high",      # Serious security risk
    "medium",    # Moderate risk
    "low",       # Minor risk
    "info"       # Informational only
]
```

### Scan Status
```python
SCAN_STATUS = [
    "pending",    # Queued
    "running",    # In progress
    "completed",  # Done successfully
    "failed"      # Error occurred
]
```

---

## 📈 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_scans_project_id ON scans(project_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_vulnerabilities_scan_id ON vulnerabilities(scan_id);
CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX idx_fixes_vuln_id ON fixes(vuln_id);
CREATE INDEX idx_fixes_status ON fixes(status);
CREATE INDEX idx_code_files_project_id ON code_files(project_id);

-- For future ML training queries
CREATE INDEX idx_fixes_user_decision ON fixes(user_decision) WHERE user_decision IS NOT NULL;
```

---

## 🔄 Data Lifecycle

1. **Project Created** → User uploads code
2. **Files Stored** → code_files populated
3. **Scan Triggered** → scans row created (pending)
4. **Scanner Runs** → vulnerabilities populated
5. **AI Processes** → fixes + ai_decision_logs created
6. **User Reviews** → fixes.status updated
7. **Training Data** → Query fixes with user_decision for ML

---

## 📊 Sample Queries

### Get all approved fixes (for training)
```sql
SELECT 
    v.vuln_type,
    v.code_snippet as vulnerable_code,
    f.fixed_code,
    f.explanation
FROM fixes f
JOIN vulnerabilities v ON f.vuln_id = v.id
WHERE f.user_decision = 'accept';
```

### Get scan summary
```sql
SELECT 
    s.id,
    s.status,
    COUNT(v.id) as vuln_count,
    COUNT(CASE WHEN v.severity = 'critical' THEN 1 END) as critical_count
FROM scans s
LEFT JOIN vulnerabilities v ON s.id = v.scan_id
GROUP BY s.id;
```
