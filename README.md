# ZeroMetus 🛡️

> AI-Powered Security & Vulnerability Detection Agent

## 🎯 Project Overview

ZeroMetus is an intelligent security agent that automatically analyzes codebases to identify security vulnerabilities, explains issues in plain language, and proposes actionable fixes.

---

## 📋 MVP Scope (What We're Building)

### ✅ In Scope
- Upload / paste code for analysis
- Scan for security vulnerabilities
- Display findings with severity levels
- Show AI-generated explanations & fixes
- User approval/rejection workflow

### ❌ Out of Scope (For Now)
- CI/CD Integration
- Cloud scaling / Kubernetes
- Custom model training
- Complex frontend / dashboards

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    (Simple HTML/JS UI)                          │
│         [Code Upload] [Scan Button] [Results View]              │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Routes    │  │  Services   │  │      Data Models        │  │
│  │ /projects   │  │ ScanService │  │  Project, Scan, Vuln    │  │
│  │ /scans      │  │ AIService   │  │  Fix, AIDecisionLog     │  │
│  │ /fixes      │  │ FixService  │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌───────────┐ ┌─────────────────┐
│  SCAN ENGINE    │ │ AI AGENT  │ │   DATABASE      │
│ (Rule-Based +   │ │ (OpenAI/  │ │  (PostgreSQL)   │
│  Static Tools)  │ │  Local)   │ │                 │
│                 │ │           │ │ - Projects      │
│ - Pattern Match │ │ - Explain │ │ - Scans         │
│ - Semgrep       │ │ - Fix Gen │ │ - Vulnerabilities│
│ - Bandit        │ │ - Reason  │ │ - Fixes         │
└─────────────────┘ └───────────┘ │ - AI Logs       │
                                  └─────────────────┘
```

---

## 📁 Project Structure

```
ZeroMetus/
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   └── DATABASE_DESIGN.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment config
│   │   ├── database.py          # DB connection
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   │   ├── scanner/         # Security scan engine
│   │   │   └── ai_agent/        # AI reasoning layer
│   │   └── utils/
│   ├── migrations/              # Alembic migrations
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html
    ├── css/
    │   └── styles.css
    └── js/
        └── main.js
```

---

## 🔄 Data Flow

1. **User uploads code** → Frontend sends to Backend
2. **Backend creates Scan** → Triggers Scanner Engine
3. **Scanner finds vulnerabilities** → Rule-based detection
4. **AI Agent processes findings** → Generates explanations & fixes
5. **Results stored in DB** → With full audit trail
6. **User reviews fixes** → Approves or rejects
7. **Decision logged** → Training data for future models

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Node.js 18+ (optional, for frontend dev)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env   # Configure your environment
alembic upgrade head   # Run migrations
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
# Just open index.html or use a simple server
python -m http.server 3000
```

---

## 📊 Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Define MVP Scope | ✅ |
| 1 | System Design & Architecture | ✅ |
| 2 | Backend Foundation | 🔄 |
| 3 | Security Scanner Engine | ⏳ |
| 4 | AI Agent Integration | ⏳ |
| 5 | Data Collection Layer | ⏳ |
| 6 | Validation & Testing | ⏳ |
| 7 | Simple Frontend | ⏳ |

---

## 📄 License

MIT License - See LICENSE file for details.
