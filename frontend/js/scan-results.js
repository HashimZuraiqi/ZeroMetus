/**
 * ZeroMetus Scan Results Page Handler
 */

// Scan state
const scanState = {
    scan: null,
    vulnerabilities: [],
    user: null,
    isLoading: true
};

// Get scan ID from URL
function getScanId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Initialize scan results page
async function initScanResultsPage() {
    // Check if token exists
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    const scanId = getScanId();
    if (!scanId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    showLoading(true);
    
    try {
        // Load user data for display
        await loadUserData();
        
        // Load scan data
        const scan = await api.getScan(scanId);
        scanState.scan = scan;
        
        // Load vulnerabilities
        await loadScanVulnerabilities(scanId);
        
        // Render
        renderScanResults();
        setupScanEventListeners();
        
        // Poll if scan is still running
        if (scan.status === 'running' || scan.status === 'pending') {
            startPolling(scanId);
        }
        
    } catch (error) {
        console.error('Scan results init error:', error);
        if (error.status === 404) {
            showToast('Scan not found', 'error');
            window.location.href = 'dashboard.html';
        } else if (error.status === 401) {
            clearAuth();
            window.location.href = 'login.html';
        }
    } finally {
        showLoading(false);
    }
}

// Load user data (also verifies token validity)
async function loadUserData() {
    try {
        const user = await api.getCurrentUser();
        scanState.user = user;
        storeUser(user);
        updateUserUI(user);
    } catch (error) {
        console.error('Failed to load user:', error);
        // If 401, token is invalid - redirect to login
        if (error.status === 401) {
            clearAuth();
            window.location.href = 'login.html';
            return;
        }
        const storedUser = getStoredUser();
        if (storedUser) {
            scanState.user = storedUser;
            updateUserUI(storedUser);
        }
    }
}

// Update user UI elements
function updateUserUI(user) {
    document.querySelectorAll('.user-name, #user-name').forEach(el => {
        el.textContent = user.display_name || user.email;
    });
    
    document.querySelectorAll('.user-avatar, #user-avatar').forEach(el => {
        const initials = getInitials(user.display_name || user.email);
        el.textContent = initials;
    });
}

// Get initials from name
function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
// Load scan vulnerabilities
async function loadScanVulnerabilities(scanId) {
    try {
        const response = await api.getVulnerabilities(scanId);
        scanState.vulnerabilities = response.vulnerabilities || response || [];
    } catch (error) {
        console.error('Failed to load vulnerabilities:', error);
        scanState.vulnerabilities = [];
    }
}

// Render scan results
function renderScanResults() {
    const { scan, vulnerabilities } = scanState;
    
    // Update header
    document.title = `Scan Results - ZeroMetus`;
    
    const statusBadge = document.getElementById('scan-status');
    if (statusBadge) {
        statusBadge.className = `badge badge-${getStatusColor(scan.status)}`;
        statusBadge.textContent = scan.status;
    }
    
    const scanDate = document.getElementById('scan-date');
    if (scanDate) scanDate.textContent = formatDate(scan.created_at);
    
    // Render stats
    renderScanStats();
    
    // Render vulnerabilities list
    renderVulnerabilities();
    
    // Render severity chart
    renderSeverityChart();
}

// Render scan stats
function renderScanStats() {
    const { vulnerabilities } = scanState;
    
    const total = vulnerabilities.length;
    const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
    const high = vulnerabilities.filter(v => v.severity === 'high').length;
    const medium = vulnerabilities.filter(v => v.severity === 'medium').length;
    const low = vulnerabilities.filter(v => v.severity === 'low').length;
    
    // Try both ID formats for compatibility
    updateStat('total-count', total);
    updateStat('count-critical', critical);
    updateStat('count-high', high);
    updateStat('count-medium', medium);
    updateStat('count-low', low);
    
    // Legacy ID format
    updateStat('critical-count', critical);
    updateStat('high-count', high);
    updateStat('medium-count', medium);
    updateStat('low-count', low);
}

// Update stat element
function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Render vulnerabilities list
function renderVulnerabilities() {
    const container = document.getElementById('vulnerabilities-list') || document.getElementById('findings-list');
    if (!container) return;
    
    const { vulnerabilities } = scanState;
    
    if (vulnerabilities.length === 0) {
        container.innerHTML = `
            <div class="empty-state success">
                <div class="empty-state-icon">✅</div>
                <p class="empty-state-text">No vulnerabilities found!</p>
                <p class="empty-state-subtext">Your code looks secure. Keep up the good work!</p>
            </div>
        `;
        return;
    }
    
    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...vulnerabilities].sort((a, b) => 
        (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4)
    );
    
    container.innerHTML = sorted.map(vuln => `
        <div class="vulnerability-card" data-vuln-id="${vuln.id}">
            <div class="vuln-header">
                <span class="severity-badge severity-${vuln.severity}">${vuln.severity}</span>
                <h3 class="vuln-title">${escapeHtml(vuln.title || vuln.vulnerability_type)}</h3>
            </div>
            <p class="vuln-description">${escapeHtml(vuln.description || 'No description available')}</p>
            <div class="vuln-meta">
                <span class="vuln-file">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    </svg>
                    ${escapeHtml(vuln.file_path || 'Unknown file')}
                </span>
                <span class="vuln-line">Line ${vuln.line_number || '?'}</span>
            </div>
            <div class="vuln-actions">
                <button class="btn btn-sm btn-secondary" onclick="viewVulnerability('${vuln.id}')">
                    View Details
                </button>
                ${vuln.has_fix ? `
                    <button class="btn btn-sm btn-primary" onclick="viewFix('${vuln.id}')">
                        View AI Fix
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Render severity chart
function renderSeverityChart() {
    const container = document.getElementById('severity-chart');
    if (!container) return;
    
    const { vulnerabilities } = scanState;
    const total = vulnerabilities.length || 1;
    
    const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
    const high = vulnerabilities.filter(v => v.severity === 'high').length;
    const medium = vulnerabilities.filter(v => v.severity === 'medium').length;
    const low = vulnerabilities.filter(v => v.severity === 'low').length;
    
    container.innerHTML = `
        <div class="severity-bar">
            <div class="severity-segment critical" style="width: ${(critical / total) * 100}%" title="Critical: ${critical}"></div>
            <div class="severity-segment high" style="width: ${(high / total) * 100}%" title="High: ${high}"></div>
            <div class="severity-segment medium" style="width: ${(medium / total) * 100}%" title="Medium: ${medium}"></div>
            <div class="severity-segment low" style="width: ${(low / total) * 100}%" title="Low: ${low}"></div>
        </div>
    `;
}

// Setup event listeners
function setupScanEventListeners() {
    // Export button
    document.querySelectorAll('#export-btn, .export-btn').forEach(btn => {
        btn.addEventListener('click', exportResults);
    });
    
    // Filter buttons
    document.querySelectorAll('.severity-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const severity = e.target.dataset.severity;
            filterBySeverity(severity);
        });
    });
    
    // Logout
    document.querySelectorAll('#logout-btn').forEach(btn => {
        btn.addEventListener('click', logout);
    });
}

// Start polling for running scans
let pollInterval = null;
function startPolling(scanId) {
    pollInterval = setInterval(async () => {
        try {
            const scan = await api.getScan(scanId);
            scanState.scan = scan;
            
            if (scan.status !== 'running' && scan.status !== 'pending') {
                clearInterval(pollInterval);
                await loadScanVulnerabilities(scanId);
                renderScanResults();
                showToast('Scan completed!', 'success');
            }
        } catch (error) {
            clearInterval(pollInterval);
        }
    }, 3000);
}

// View vulnerability details
function viewVulnerability(vulnId) {
    window.location.href = `vulnerability.html?id=${vulnId}`;
}

// View AI fix
function viewFix(vulnId) {
    window.location.href = `vulnerability.html?id=${vulnId}#fix`;
}

// Filter by severity
function filterBySeverity(severity) {
    const cards = document.querySelectorAll('.vulnerability-card');
    cards.forEach(card => {
        if (!severity || severity === 'all') {
            card.style.display = '';
        } else {
            const cardSeverity = card.querySelector('.severity-badge')?.textContent?.toLowerCase();
            card.style.display = cardSeverity === severity ? '' : 'none';
        }
    });
}

// Export results
function exportResults() {
    const { scan, vulnerabilities } = scanState;
    
    const data = {
        scan_id: scan.id,
        status: scan.status,
        date: scan.created_at,
        total_vulnerabilities: vulnerabilities.length,
        vulnerabilities: vulnerabilities.map(v => ({
            severity: v.severity,
            type: v.vulnerability_type,
            title: v.title,
            file: v.file_path,
            line: v.line_number,
            description: v.description
        }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-results-${scan.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Results exported', 'success');
}

// Helper functions
function showLoading(isLoading) {
    const loader = document.getElementById('page-loader');
    const content = document.getElementById('page-content');
    if (loader) loader.style.display = isLoading ? 'flex' : 'none';
    if (content) content.style.display = isLoading ? 'none' : 'block';
}

function getStatusColor(status) {
    const colors = {
        completed: 'success',
        running: 'info',
        pending: 'warning',
        failed: 'danger'
    };
    return colors[status] || 'secondary';
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initScanResultsPage);
