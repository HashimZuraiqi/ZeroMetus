/**
 * ZeroMetus Landing Page Handler
 */

// Code examples for demo
const CODE_EXAMPLES = {
    python: `def get_user(user_id):
    # Vulnerable to SQL injection
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)

def authenticate(username, password):
    # Hardcoded credentials - security risk
    admin_password = "admin123"
    if password == admin_password:
        return True
    return False`,

    javascript: `// Vulnerable to XSS
function displayUserInput(input) {
    document.getElementById('output').innerHTML = input;
}

// Command injection vulnerability
const { exec } = require('child_process');
function runCommand(userInput) {
    exec('ls ' + userInput, (err, stdout) => {
        console.log(stdout);
    });
}`,

    java: `public class UserService {
    // SQL Injection vulnerability
    public User getUser(String userId) {
        String query = "SELECT * FROM users WHERE id = '" + userId + "'";
        return database.executeQuery(query);
    }
    
    // Hardcoded password
    private static final String DB_PASSWORD = "secret123";
}`,

    sql: `-- Unsafe dynamic query
EXEC('SELECT * FROM users WHERE name = ''' + @userName + '''');

-- Granting excessive permissions
GRANT ALL PRIVILEGES ON *.* TO 'app_user'@'%';`
};

// Vulnerability patterns for client-side detection
const VULN_PATTERNS = {
    SQL_INJECTION: {
        patterns: [
            /f["'].*SELECT.*\{.*\}/gi,
            /["'].*SELECT.*\+.*["']/gi,
            /execute\s*\(\s*["'].*SELECT/gi,
            /EXEC\s*\(\s*['"].*SELECT/gi
        ],
        title: "SQL Injection",
        severity: "critical",
        description: "User input is directly concatenated into SQL query, allowing attackers to manipulate database queries.",
        fix: "Use parameterized queries or prepared statements instead of string concatenation."
    },
    XSS: {
        patterns: [
            /\.innerHTML\s*=/gi,
            /document\.write\s*\(/gi,
            /\$\(.*\)\.html\s*\(/gi
        ],
        title: "Cross-Site Scripting (XSS)",
        severity: "high",
        description: "Unsanitized user input is rendered as HTML, allowing script injection.",
        fix: "Use textContent instead of innerHTML, or sanitize HTML input before rendering."
    },
    COMMAND_INJECTION: {
        patterns: [
            /exec\s*\(\s*['"].*\+/gi,
            /system\s*\(\s*['"].*\+/gi,
            /subprocess\.\w+\s*\(\s*['"].*\+/gi
        ],
        title: "Command Injection",
        severity: "critical",
        description: "User input is passed to shell commands without proper sanitization.",
        fix: "Use safe APIs that don't invoke shell, or properly escape and validate all input."
    },
    HARDCODED_SECRET: {
        patterns: [
            /password\s*=\s*["'][^"']+["']/gi,
            /api_key\s*=\s*["'][^"']+["']/gi,
            /secret\s*=\s*["'][^"']+["']/gi,
            /DB_PASSWORD\s*=\s*["'][^"']+["']/gi
        ],
        title: "Hardcoded Secret",
        severity: "high",
        description: "Sensitive credentials are hardcoded in source code.",
        fix: "Store secrets in environment variables or a secure vault, never in source code."
    },
    EXCESSIVE_PERMISSIONS: {
        patterns: [
            /GRANT\s+ALL\s+PRIVILEGES/gi,
            /chmod\s+777/gi
        ],
        title: "Excessive Permissions",
        severity: "medium",
        description: "Overly permissive access controls that violate least privilege principle.",
        fix: "Grant only the minimum required permissions for the specific operation."
    }
};

// Detect vulnerabilities in code
function detectVulnerabilities(code, language) {
    const vulnerabilities = [];
    const lines = code.split('\n');
    
    for (const [vulnType, config] of Object.entries(VULN_PATTERNS)) {
        for (const pattern of config.patterns) {
            let match;
            const regex = new RegExp(pattern.source, pattern.flags);
            
            while ((match = regex.exec(code)) !== null) {
                // Find line number
                const beforeMatch = code.substring(0, match.index);
                const lineNumber = beforeMatch.split('\n').length;
                
                vulnerabilities.push({
                    type: vulnType,
                    title: config.title,
                    severity: config.severity,
                    description: config.description,
                    fix: config.fix,
                    line: lineNumber,
                    code: lines[lineNumber - 1]?.trim() || match[0]
                });
            }
        }
    }
    
    // Remove duplicates based on line number and type
    const seen = new Set();
    return vulnerabilities.filter(v => {
        const key = `${v.type}-${v.line}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Render scan results
function renderScanResults(vulnerabilities, container) {
    if (vulnerabilities.length === 0) {
        container.innerHTML = `
            <div class="results-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3>No vulnerabilities detected!</h3>
                <p>Your code looks secure. Sign up for deeper analysis with AI-powered explanations.</p>
                <a href="signup.html" class="btn btn-primary">Get Full Analysis</a>
            </div>
        `;
        return;
    }
    
    const severityCounts = {
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length
    };
    
    container.innerHTML = `
        <div class="results-summary">
            <h3>${vulnerabilities.length} Vulnerabilit${vulnerabilities.length === 1 ? 'y' : 'ies'} Found</h3>
            <div class="severity-badges">
                ${severityCounts.critical > 0 ? `<span class="severity-badge critical">${severityCounts.critical} Critical</span>` : ''}
                ${severityCounts.high > 0 ? `<span class="severity-badge high">${severityCounts.high} High</span>` : ''}
                ${severityCounts.medium > 0 ? `<span class="severity-badge medium">${severityCounts.medium} Medium</span>` : ''}
                ${severityCounts.low > 0 ? `<span class="severity-badge low">${severityCounts.low} Low</span>` : ''}
            </div>
        </div>
        <div class="results-list">
            ${vulnerabilities.map(v => `
                <div class="result-item">
                    <div class="result-header">
                        <span class="severity-badge ${v.severity}">${v.severity}</span>
                        <span class="result-title">${v.title}</span>
                        <span class="result-line">Line ${v.line}</span>
                    </div>
                    <p class="result-description">${v.description}</p>
                    <div class="result-code"><code>${escapeHtml(v.code)}</code></div>
                    <div class="result-fix">
                        <strong>💡 Fix:</strong> ${v.fix}
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="results-cta">
            <p>Sign up for AI-powered detailed explanations and automatic code fixes.</p>
            <a href="signup.html" class="btn btn-primary">Get AI Fixes</a>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .step, .trust-item, .pricing-card').forEach(el => {
        observer.observe(el);
    });
    
    // Code input and scanning
    const codeInput = document.getElementById('code-input');
    const lineCount = document.getElementById('line-count');
    const languageSelect = document.getElementById('language-select');
    const loadExampleBtn = document.getElementById('load-example-btn');
    const quickScanBtn = document.getElementById('quick-scan-btn');
    const quickResults = document.getElementById('quick-results');
    
    // Update line count
    if (codeInput && lineCount) {
        codeInput.addEventListener('input', () => {
            const lines = codeInput.value.split('\n').length;
            lineCount.textContent = lines;
        });
    }
    
    // Load example code
    if (loadExampleBtn && codeInput && languageSelect) {
        loadExampleBtn.addEventListener('click', () => {
            const language = languageSelect.value;
            codeInput.value = CODE_EXAMPLES[language] || CODE_EXAMPLES.python;
            // Trigger input event to update line count
            codeInput.dispatchEvent(new Event('input'));
        });
    }
    
    // Quick scan functionality
    if (quickScanBtn && codeInput && quickResults) {
        quickScanBtn.addEventListener('click', () => {
            const code = codeInput.value.trim();
            
            if (!code) {
                quickResults.innerHTML = `
                    <div class="results-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 8v4M12 16h.01"/>
                        </svg>
                        <p>Please paste some code to scan</p>
                    </div>
                `;
                return;
            }
            
            // Show loading state
            quickScanBtn.disabled = true;
            quickScanBtn.innerHTML = `
                <svg class="spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4"/>
                </svg>
                Scanning...
            `;
            
            quickResults.innerHTML = `
                <div class="results-loading">
                    <svg class="spinner" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4"/>
                    </svg>
                    <p>Analyzing code for vulnerabilities...</p>
                </div>
            `;
            
            // Simulate scan delay for UX
            setTimeout(() => {
                const language = languageSelect?.value || 'python';
                const vulnerabilities = detectVulnerabilities(code, language);
                renderScanResults(vulnerabilities, quickResults);
                
                // Reset button
                quickScanBtn.disabled = false;
                quickScanBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Scan Again
                `;
            }, 1500);
        });
    }
});

