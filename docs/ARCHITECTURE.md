# ZeroMetus Architecture Document

## 🎯 System Overview

ZeroMetus is designed as a modular, pluggable security analysis system where AI acts as a reasoning layer on top of deterministic security rules.

---

## 📐 Component Responsibilities

### 1. Frontend (Presentation Layer)
**Purpose:** Simple interface for code submission and result viewing

**Responsibilities:**
- Code upload (file or paste)
- Trigger scans
- Display vulnerability findings
- Show AI explanations and fixes
- Accept/reject fix proposals

**Technology:** Vanilla HTML/CSS/JavaScript (no frameworks for MVP)

---

### 2. Backend API (FastAPI)
**Purpose:** Central coordinator and business logic handler

**Responsibilities:**
- RESTful API endpoints
- Request validation
- Authentication (future)
- Orchestrate scan workflow
- Coordinate between Scanner and AI Agent
- Store results in database

**Technology:** FastAPI + Pydantic + SQLAlchemy

---

### 3. Scanner Engine (Security Analysis)
**Purpose:** Detect vulnerabilities using rules and tools

**Responsibilities:**
- Pattern-based detection (regex rules)
- Static analysis tool integration
- Produce structured vulnerability reports
- Deterministic, explainable results

**Detection Categories:**
| Category | Examples |
|----------|----------|
| Injection | SQL injection, Command injection |
| XSS | innerHTML, document.write |
| Secrets | API keys, passwords in code |
| Dangerous Functions | eval(), exec(), pickle.loads() |
| Insecure Config | Debug mode, weak crypto |

**Technology:** Custom rules + Semgrep/Bandit (optional)

---

### 4. AI Agent (Reasoning Layer)
**Purpose:** Understand context, explain issues, propose fixes

**Responsibilities:**
- Receive structured vulnerability data
- Understand code context
- Generate human-readable explanations
- Propose secure code fixes
- Output strict JSON format

**Key Principle:** AI is a PLUGIN, not the core system
- Can swap OpenAI ↔ Local model
- Can fine-tune later
- System works without AI (just no explanations/fixes)

**Technology:** OpenAI API (GPT-4) → Swappable to local models

---

### 5. Database (PostgreSQL)
**Purpose:** Persistent storage and audit trail

**Responsibilities:**
- Store all projects, scans, vulnerabilities
- Store AI decisions and user choices
- Enable future ML training
- Provide audit trail

**Why PostgreSQL:**
- JSONB for flexible metadata
- Mature, reliable
- Good for structured + semi-structured data

---

## 🔄 Request Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Upload  │────▶│  Create  │────▶│   Run    │────▶│  Store   │
│   Code   │     │  Project │     │  Scanner │     │ Findings │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                                         ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Return  │◀────│  Store   │◀────│ Generate │◀────│    AI    │
│ Results  │     │  Fixes   │     │  Fixes   │     │  Agent   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

---

## 🔌 Plugin Architecture

The AI Agent is designed as a swappable plugin:

```python
# Abstract interface
class AIAgentInterface:
    def analyze(self, vulnerability: dict) -> FixProposal:
        raise NotImplementedError

# OpenAI Implementation
class OpenAIAgent(AIAgentInterface):
    def analyze(self, vulnerability: dict) -> FixProposal:
        # Call OpenAI API
        pass

# Local Model Implementation (Future)
class LocalModelAgent(AIAgentInterface):
    def analyze(self, vulnerability: dict) -> FixProposal:
        # Call local model
        pass
```

---

## 📊 Data Storage Strategy

### What We Store & Why

| Data | Why Store It | Future Use |
|------|--------------|------------|
| Original vulnerable code | Evidence, reproducibility | Training input |
| Vulnerability type + location | Core finding | Labels for ML |
| AI explanation | User understanding | Fine-tuning data |
| Proposed fix | User decision | Training output |
| User decision (accept/reject) | Audit trail | Reward signal |
| Timestamp + metadata | Compliance | Analytics |

This enables:
1. **Auditability** - Full history of what was found and fixed
2. **Dataset Creation** - Training data for future models
3. **Analytics** - Track common vulnerability types
4. **Improvement** - Learn from rejected fixes

---

## 🔒 Security Considerations

1. **Code Isolation** - Uploaded code is analyzed, never executed
2. **Input Validation** - All inputs sanitized via Pydantic
3. **API Keys** - Stored in environment variables only
4. **Rate Limiting** - Prevent abuse (future)
5. **No PII Storage** - Code only, no user data in MVP

---

## 📈 Scalability Path (Not MVP)

For future reference only:
- **Horizontal scaling:** Multiple scanner workers
- **Queue system:** Redis/RabbitMQ for scan jobs
- **Caching:** Redis for repeated scans
- **Container:** Docker + Kubernetes

**NOT implementing these in MVP.**
