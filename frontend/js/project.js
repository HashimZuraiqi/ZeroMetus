/**
 * ZeroMetus Project Page Handler
 */

// Project state
const projectState = {
    project: null,
    scans: [],
    files: [],
    isLoading: true
};

// Get project ID from URL
function getProjectId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Initialize project page
async function initProjectPage() {
    if (!requireAuth()) return;
    
    const projectId = getProjectId();
    if (!projectId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    showLoading(true);
    
    try {
        // Load project data
        const project = await api.getProject(projectId);
        projectState.project = project;
        
        // Load scans and files
        await Promise.all([
            loadProjectScans(projectId),
            loadProjectFiles(projectId)
        ]);
        
        // Render
        renderProject();
        setupProjectEventListeners();
        
    } catch (error) {
        console.error('Project init error:', error);
        if (error.status === 404) {
            showToast('Project not found', 'error');
            window.location.href = 'dashboard.html';
        } else if (error.status === 401) {
            clearAuth();
            window.location.href = 'login.html';
        }
    } finally {
        showLoading(false);
    }
}

// Load project scans
async function loadProjectScans(projectId) {
    try {
        const response = await api.getProjectScans(projectId);
        projectState.scans = response.scans || response || [];
    } catch (error) {
        console.error('Failed to load scans:', error);
        projectState.scans = [];
    }
}

// Load project files
async function loadProjectFiles(projectId) {
    try {
        const response = await api.getProjectFiles(projectId);
        projectState.files = response.files || response || [];
    } catch (error) {
        console.error('Failed to load files:', error);
        projectState.files = [];
    }
}

// Render project page
function renderProject() {
    const { project, scans, files } = projectState;
    
    // Update page title
    document.title = `${project.name} - ZeroMetus`;
    
    // Update header
    const headerTitle = document.getElementById('project-title');
    if (headerTitle) headerTitle.textContent = project.name;
    
    const headerDescription = document.getElementById('project-description');
    if (headerDescription) headerDescription.textContent = project.description || 'No description';
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('project-breadcrumb');
    if (breadcrumb) breadcrumb.textContent = project.name;
    
    // Render scans
    renderProjectScans();
    
    // Render files
    renderProjectFiles();
    
    // Update stats
    updateProjectStats();
}

// Render project scans
function renderProjectScans() {
    const container = document.getElementById('project-scans');
    if (!container) return;
    
    const { scans } = projectState;
    
    if (scans.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p class="empty-state-text">No scans yet</p>
                <button class="btn btn-primary btn-sm" onclick="startProjectScan()">Run First Scan</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Scan ID</th>
                    <th>Status</th>
                    <th>Vulnerabilities</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${scans.map(scan => `
                    <tr>
                        <td><code>${scan.id.slice(0, 8)}</code></td>
                        <td>
                            <span class="badge badge-${getStatusColor(scan.status)}">${scan.status}</span>
                        </td>
                        <td>${scan.vulnerability_count || 0}</td>
                        <td>${formatDate(scan.created_at)}</td>
                        <td>
                            <button class="btn btn-sm btn-ghost" onclick="viewScan('${scan.id}')">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Render project files
function renderProjectFiles() {
    const container = document.getElementById('project-files');
    if (!container) return;
    
    const { files } = projectState;
    
    if (files.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <p class="empty-state-text">No files uploaded</p>
                <p class="empty-state-subtext">Upload files to scan for vulnerabilities</p>
                <button class="btn btn-primary btn-sm" onclick="openUploadModal()">Upload Files</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="files-grid">
            ${files.map(file => `
                <div class="file-card">
                    <div class="file-icon">${getFileIcon(file.filename)}</div>
                    <div class="file-info">
                        <span class="file-name">${escapeHtml(file.filename)}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Update project stats
function updateProjectStats() {
    const { scans, files } = projectState;
    
    const scanCount = document.getElementById('scan-count');
    if (scanCount) scanCount.textContent = scans.length;
    
    const fileCount = document.getElementById('file-count');
    if (fileCount) fileCount.textContent = files.length;
    
    const totalVulns = scans.reduce((sum, s) => sum + (s.vulnerability_count || 0), 0);
    const vulnCount = document.getElementById('vuln-count');
    if (vulnCount) vulnCount.textContent = totalVulns;
}

// Setup event listeners
function setupProjectEventListeners() {
    // Scan button
    document.querySelectorAll('#run-scan-btn, .run-scan-btn').forEach(btn => {
        btn.addEventListener('click', startProjectScan);
    });
    
    // Upload button
    document.querySelectorAll('#upload-btn, .upload-btn').forEach(btn => {
        btn.addEventListener('click', openUploadModal);
    });
    
    // Delete project
    document.querySelectorAll('#delete-project-btn').forEach(btn => {
        btn.addEventListener('click', confirmDeleteProject);
    });
    
    // Logout
    document.querySelectorAll('#logout-btn').forEach(btn => {
        btn.addEventListener('click', logout);
    });
}

// Start project scan
async function startProjectScan() {
    const projectId = getProjectId();
    if (!projectId) return;
    
    try {
        showToast('Starting scan...', 'info');
        const scan = await api.createScan(projectId);
        showToast('Scan started!', 'success');
        window.location.href = `scan-results.html?id=${scan.id}`;
    } catch (error) {
        showToast('Failed to start scan: ' + error.message, 'error');
    }
}

// Open upload modal
function openUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) modal.classList.add('active');
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Confirm delete project
function confirmDeleteProject() {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        deleteProject();
    }
}

// Delete project
async function deleteProject() {
    const projectId = getProjectId();
    if (!projectId) return;
    
    try {
        await api.deleteProject(projectId);
        showToast('Project deleted', 'success');
        window.location.href = 'dashboard.html';
    } catch (error) {
        showToast('Failed to delete project: ' + error.message, 'error');
    }
}

// View scan
function viewScan(scanId) {
    window.location.href = `scan-results.html?id=${scanId}`;
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

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        js: '📜', ts: '📜', jsx: '📜', tsx: '📜',
        py: '🐍', rb: '💎', go: '🔷',
        java: '☕', kt: '🎯', swift: '🍏',
        html: '🌐', css: '🎨', json: '📋',
        md: '📝', txt: '📝', yml: '⚙️', yaml: '⚙️'
    };
    return icons[ext] || '📄';
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
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
document.addEventListener('DOMContentLoaded', initProjectPage);
