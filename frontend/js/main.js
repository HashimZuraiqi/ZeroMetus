/**
 * ZeroMetus Frontend
 * Simple, functional UI for the security scanner MVP
 */

// Configuration
const API_BASE = 'http://localhost:8000/api/v1';

// State
let currentProjectId = null;
let currentScanId = null;
let vulnerabilities = [];

// DOM Elements
const elements = {
    inputSection: document.getElementById('inputSection'),
    loadingSection: document.getElementById('loadingSection'),
    resultsSection: document.getElementById('resultsSection'),
    projectName: document.getElementById('projectName'),
    fileName: document.getElementById('fileName'),
    codeInput: document.getElementById('codeInput'),
    scanBtn: document.getElementById('scanBtn'),
    clearBtn: document.getElementById('clearBtn'),
    newScanBtn: document.getElementById('newScanBtn'),
    scanSummary: document.getElementById('scanSummary'),
    vulnerabilitiesList: document.getElementById('vulnerabilitiesList'),
    fixModal: document.getElementById('fixModal'),
    modalContent: document.getElementById('modalContent'),
    modalActions: document.getElementById('modalActions'),
    closeModal: document.getElementById('closeModal')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadSampleCode();
});

function setupEventListeners() {
    elements.scanBtn.addEventListener('click', startScan);
    elements.clearBtn.addEventListener('click', clearForm);
    elements.newScanBtn.addEventListener('click', startNewScan);
    elements.closeModal.addEventListener('click', closeModal);
    elements.fixModal.addEventListener('click', (e) => {
        if (e.target === elements.fixModal) closeModal();
    });
}

function loadSampleCode() {
    // Pre-fill with vulnerable sample code for demo
    elements.codeInput.value = `# Example: Vulnerable Python Code
# This code has multiple security issues for demonstration

from flask import Flask, request
import os
import pickle

app = Flask(__name__)

# Hardcoded secret (HARDCODED_SECRET)
API_KEY = "sk-1234567890abcdef"
SECRET_KEY = "mysecretpassword123"

@app.route('/user')
def get_user():
    user_id = request.args.get('id')
    # SQL Injection vulnerability (SQL_INJECTION)
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return result

@app.route('/search')
def search():
    term = request.args.get('q')
    # Command injection via os.system (COMMAND_INJECTION)
    os.system(f"grep {term} /var/log/app.log")
    return "Search complete"

@app.route('/load')
def load_data():
    data = request.get_data()
    # Insecure deserialization (INSECURE_DESERIALIZATION)
    obj = pickle.loads(data)
    return str(obj)

# Debug mode enabled (INSECURE_CONFIG)
DEBUG = True

if __name__ == '__main__':
    app.run(debug=DEBUG)`;
    
    elements.projectName.value = 'vulnerable-flask-app';
    elements.fileName.value = 'app.py';
}

async function startScan() {
    const projectName = elements.projectName.value.trim();
    const fileName = elements.fileName.value.trim();
    const code = elements.codeInput.value.trim();

    if (!projectName || !fileName || !code) {
        alert('Please fill in all fields');
        return;
    }

    showLoading();

    try {
        // 1. Create project
        const project = await createProject(projectName);
        currentProjectId = project.id;

        // 2. Upload file
        await uploadFile(project.id, fileName, code);

        // 3. Start scan
        const scan = await createScan(project.id);
        currentScanId = scan.id;

        // 4. Poll for results
        await pollScanStatus(scan.id);

    } catch (error) {
        console.error('Scan failed:', error);
        alert(`Scan failed: ${error.message}`);
        showInput();
    }
}

async function createProject(name) {
    const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            description: 'Scanned via ZeroMetus UI',
            source_type: 'paste'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to create project');
    }

    return response.json();
}

async function uploadFile(projectId, filename, content) {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            files: [{
                filename: filename,
                filepath: filename,
                content: content
            }]
        })
    });

    if (!response.ok) {
        throw new Error('Failed to upload file');
    }

    return response.json();
}

async function createScan(projectId) {
    const response = await fetch(`${API_BASE}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            project_id: projectId,
            scan_options: {
                include_ai_fixes: true,
                severity_threshold: 'low'
            }
        })
    });

    if (!response.ok) {
        throw new Error('Failed to start scan');
    }

    return response.json();
}

async function pollScanStatus(scanId) {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const response = await fetch(`${API_BASE}/scans/${scanId}`);
        const scan = await response.json();

        if (scan.status === 'completed') {
            await loadResults(scanId, scan.summary);
            return;
        }

        if (scan.status === 'failed') {
            throw new Error('Scan failed on server');
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    throw new Error('Scan timed out');
}

async function loadResults(scanId, summary) {
    // Load vulnerabilities
    const response = await fetch(`${API_BASE}/scans/${scanId}/vulnerabilities`);
    const data = await response.json();
    vulnerabilities = data.vulnerabilities;

    // Render results
    renderSummary(summary);
    renderVulnerabilities(vulnerabilities);
    showResults();
}

function renderSummary(summary) {
    if (!summary) {
        elements.scanSummary.innerHTML = '<p>No vulnerabilities found! ✅</p>';
        return;
    }

    const { by_severity, total_vulnerabilities } = summary;

    elements.scanSummary.innerHTML = `
        <div class="summary-card">
            <div class="count">${total_vulnerabilities}</div>
            <div class="label">Total Issues</div>
        </div>
        ${by_severity.critical > 0 ? `
        <div class="summary-card critical">
            <div class="count">${by_severity.critical}</div>
            <div class="label">Critical</div>
        </div>` : ''}
        ${by_severity.high > 0 ? `
        <div class="summary-card high">
            <div class="count">${by_severity.high}</div>
            <div class="label">High</div>
        </div>` : ''}
        ${by_severity.medium > 0 ? `
        <div class="summary-card medium">
            <div class="count">${by_severity.medium}</div>
            <div class="label">Medium</div>
        </div>` : ''}
        ${by_severity.low > 0 ? `
        <div class="summary-card low">
            <div class="count">${by_severity.low}</div>
            <div class="label">Low</div>
        </div>` : ''}
    `;
}

function renderVulnerabilities(vulns) {
    if (vulns.length === 0) {
        elements.vulnerabilitiesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎉</div>
                <h3>No vulnerabilities detected!</h3>
                <p>Your code looks secure based on our current rules.</p>
            </div>
        `;
        return;
    }

    elements.vulnerabilitiesList.innerHTML = vulns.map(vuln => `
        <div class="vuln-card" data-vuln-id="${vuln.id}">
            <div class="vuln-header">
                <span class="vuln-type">${formatVulnType(vuln.vuln_type)}</span>
                <span class="severity-badge ${vuln.severity}">${vuln.severity}</span>
            </div>
            <div class="vuln-location">
                📄 ${vuln.file.filepath} : Line ${vuln.line_start}
            </div>
            <div class="vuln-code">
                <code>${escapeHtml(vuln.code_snippet)}</code>
            </div>
            <div class="vuln-actions">
                ${vuln.has_fix ? `
                <button class="btn btn-primary btn-sm" onclick="viewFix('${vuln.id}')">
                    View Fix
                </button>` : `
                <span class="fix-status pending">No AI fix available</span>
                `}
            </div>
        </div>
    `).join('');
}

async function viewFix(vulnId) {
    try {
        const response = await fetch(`${API_BASE}/vulnerabilities/${vulnId}/fix`);
        
        if (!response.ok) {
            alert('No fix available for this vulnerability');
            return;
        }

        const fix = await response.json();
        showFixModal(fix, vulnId);

    } catch (error) {
        console.error('Failed to load fix:', error);
        alert('Failed to load fix details');
    }
}

function showFixModal(fix, vulnId) {
    elements.modalContent.innerHTML = `
        <div class="fix-section">
            <h4>Explanation</h4>
            <div class="explanation">${escapeHtml(fix.explanation)}</div>
        </div>

        <div class="fix-section">
            <h4>Code Comparison</h4>
            <div class="code-comparison">
                <div class="code-block vulnerable">
                    <div class="code-block-header">❌ Vulnerable Code</div>
                    <pre>${escapeHtml(fix.original_code)}</pre>
                </div>
                <div class="code-block fixed">
                    <div class="code-block-header">✅ Fixed Code</div>
                    <pre>${escapeHtml(fix.fixed_code)}</pre>
                </div>
            </div>
        </div>

        ${fix.ai_model ? `
        <div class="fix-section">
            <p style="color: var(--text-secondary); font-size: 0.85rem;">
                Generated by: ${fix.ai_model}
            </p>
        </div>` : ''}
    `;

    // Only show decision buttons if status is pending
    if (fix.status === 'pending') {
        elements.modalActions.innerHTML = `
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button class="btn btn-reject" onclick="submitDecision('${fix.id}', 'reject')">
                Reject Fix
            </button>
            <button class="btn btn-accept" onclick="submitDecision('${fix.id}', 'accept')">
                Accept Fix
            </button>
        `;
    } else {
        elements.modalActions.innerHTML = `
            <span class="fix-status ${fix.status}">${fix.status}</span>
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        `;
    }

    elements.fixModal.classList.remove('hidden');
}

async function submitDecision(fixId, decision) {
    try {
        const response = await fetch(`${API_BASE}/fixes/${fixId}/decision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                decision: decision,
                reason: decision === 'accept' ? 'Approved via UI' : 'Rejected via UI'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit decision');
        }

        const result = await response.json();
        alert(`Fix ${decision}ed successfully!`);
        closeModal();

        // Refresh results
        await loadResults(currentScanId, null);

    } catch (error) {
        console.error('Failed to submit decision:', error);
        alert('Failed to submit decision');
    }
}

function closeModal() {
    elements.fixModal.classList.add('hidden');
}

function clearForm() {
    elements.projectName.value = '';
    elements.fileName.value = '';
    elements.codeInput.value = '';
}

function startNewScan() {
    currentProjectId = null;
    currentScanId = null;
    vulnerabilities = [];
    showInput();
}

// UI State Management
function showLoading() {
    elements.inputSection.classList.add('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.loadingSection.classList.remove('hidden');
}

function showResults() {
    elements.inputSection.classList.add('hidden');
    elements.loadingSection.classList.add('hidden');
    elements.resultsSection.classList.remove('hidden');
}

function showInput() {
    elements.loadingSection.classList.add('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.inputSection.classList.remove('hidden');
}

// Utility Functions
function formatVulnType(type) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
