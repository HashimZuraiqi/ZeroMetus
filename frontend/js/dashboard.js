/**
 * ZeroMetus Dashboard Handler
 * Manages dashboard data loading and interactions
 */

// Dashboard state
const dashboardState = {
    user: null,
    projects: [],
    recentScans: [],
    stats: {
        totalVulnerabilities: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        resolvedCount: 0
    },
    isLoading: true,
    currentScanMethod: 'paste',
    selectedFile: null,
    selectedZip: null
};

// Initialize dashboard
async function initDashboard() {
    // Check authentication - verify token with backend
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    showLoadingState(true);
    
    try {
        // Load user data (this also verifies the token)
        await loadUserData();
        
        // Load dashboard data in parallel
        await Promise.all([
            loadProjects(),
            loadStats()
        ]);
        
        // Load recent scans after projects (needs project names)
        await loadRecentScans();
        
        // Render everything
        renderDashboard();
        
        // Setup all event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Dashboard init error:', error);
        
        // If auth error, redirect to login
        if (error.status === 401) {
            clearAuth();
            window.location.href = 'login.html';
            return;
        }
        
        showToast('Failed to load dashboard data', 'error');
    } finally {
        showLoadingState(false);
    }
}

// Load user data (also verifies token validity)
async function loadUserData() {
    try {
        const user = await api.getCurrentUser();
        dashboardState.user = user;
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
        throw error;
    }
}

// Update user UI elements
function updateUserUI(user) {
    // Update welcome name
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeName) {
        welcomeName.textContent = (user.display_name || user.email).split(' ')[0];
    }
    
    // Update user name displays
    document.querySelectorAll('.user-name, #user-name').forEach(el => {
        el.textContent = user.display_name || user.email;
    });
    
    // Update user email displays
    document.querySelectorAll('.user-email').forEach(el => {
        el.textContent = user.email;
    });
    
    // Update user avatar
    document.querySelectorAll('.user-avatar, #user-avatar').forEach(el => {
        const initials = getInitials(user.display_name || user.email);
        el.textContent = initials;
    });
}

// Get initials from name
function getInitials(name) {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Load projects
async function loadProjects() {
    try {
        const response = await api.getProjects();
        dashboardState.projects = Array.isArray(response) ? response : (response.projects || []);
    } catch (error) {
        console.error('Failed to load projects:', error);
        dashboardState.projects = [];
    }
}

// Load dashboard stats
async function loadStats() {
    try {
        // Get vulnerabilities for stats
        const response = await api.getVulnerabilities();
        const vulnerabilities = Array.isArray(response) ? response : (response.vulnerabilities || []);
        
        // Calculate stats
        dashboardState.stats = {
            totalVulnerabilities: vulnerabilities.length,
            criticalCount: vulnerabilities.filter(v => v.severity === 'critical').length,
            highCount: vulnerabilities.filter(v => v.severity === 'high').length,
            mediumCount: vulnerabilities.filter(v => v.severity === 'medium').length,
            lowCount: vulnerabilities.filter(v => v.severity === 'low').length,
            resolvedCount: vulnerabilities.filter(v => v.status === 'resolved' || v.status === 'fixed').length
        };
    } catch (error) {
        console.error('Failed to load stats:', error);
        // Set defaults on error
        dashboardState.stats = {
            totalVulnerabilities: 0,
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            lowCount: 0,
            resolvedCount: 0
        };
    }
}

// Load recent scans
async function loadRecentScans() {
    try {
        // Get scans from all projects
        const allScans = [];
        for (const project of dashboardState.projects.slice(0, 10)) {
            try {
                const response = await api.getProjectScans(project.id);
                const scans = Array.isArray(response) ? response : (response.scans || []);
                allScans.push(...scans.map(s => ({ ...s, projectName: project.name })));
            } catch (e) {
                // Continue if a project fails
            }
        }
        
        // Sort by date and take recent
        dashboardState.recentScans = allScans
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
    } catch (error) {
        console.error('Failed to load scans:', error);
        dashboardState.recentScans = [];
    }
}

// Render entire dashboard
function renderDashboard() {
    renderStats();
    renderSeverityBar();
    renderProjects();
    renderRecentActivity();
    renderNavProjects();
}

// Render stats cards
function renderStats() {
    const { stats, projects, recentScans } = dashboardState;
    
    // Update stat values with animation
    animateNumber(document.getElementById('total-vulns'), 0, stats.totalVulnerabilities, 500);
    animateNumber(document.getElementById('critical-count'), 0, stats.criticalCount, 500);
    animateNumber(document.getElementById('projects-count'), 0, projects.length, 500);
    animateNumber(document.getElementById('scans-count'), 0, recentScans.length, 500);
}

// Render severity bar
function renderSeverityBar() {
    const { stats } = dashboardState;
    const total = stats.totalVulnerabilities || 1;
    
    const criticalWidth = (stats.criticalCount / total) * 100;
    const highWidth = (stats.highCount / total) * 100;
    const mediumWidth = (stats.mediumCount / total) * 100;
    const lowWidth = (stats.lowCount / total) * 100;
    
    // Update segment widths
    const segCritical = document.getElementById('seg-critical');
    const segHigh = document.getElementById('seg-high');
    const segMedium = document.getElementById('seg-medium');
    const segLow = document.getElementById('seg-low');
    
    if (segCritical) {
        segCritical.style.width = `${criticalWidth}%`;
        segCritical.querySelector('.severity-count')?.remove();
        if (stats.criticalCount > 0) {
            segCritical.innerHTML = `<span class="severity-count">${stats.criticalCount}</span>`;
        }
    }
    if (segHigh) {
        segHigh.style.width = `${highWidth}%`;
        segHigh.querySelector('.severity-count')?.remove();
        if (stats.highCount > 0) {
            segHigh.innerHTML = `<span class="severity-count">${stats.highCount}</span>`;
        }
    }
    if (segMedium) {
        segMedium.style.width = `${mediumWidth}%`;
        segMedium.querySelector('.severity-count')?.remove();
        if (stats.mediumCount > 0) {
            segMedium.innerHTML = `<span class="severity-count">${stats.mediumCount}</span>`;
        }
    }
    if (segLow) {
        segLow.style.width = `${lowWidth}%`;
        segLow.querySelector('.severity-count')?.remove();
        if (stats.lowCount > 0) {
            segLow.innerHTML = `<span class="severity-count">${stats.lowCount}</span>`;
        }
    }
}

// Animate number
function animateNumber(el, start, end, duration) {
    if (!el) return;
    
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * easeOutQuart(progress));
        el.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Easing function
function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

// Render projects list
function renderProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;
    
    const emptyState = document.getElementById('empty-projects');
    
    if (dashboardState.projects.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        container.innerHTML = '';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = dashboardState.projects.slice(0, 5).map(project => `
        <div class="project-item" data-project-id="${project.id}">
            <div class="project-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            <div class="project-item-info">
                <h4 class="project-item-name">${escapeHtml(project.name)}</h4>
                <p class="project-item-meta">
                    ${project.files_count || 0} files • ${project.scans_count || 0} scans
                </p>
            </div>
            <div class="project-item-actions">
                <button class="btn btn-sm btn-ghost" onclick="viewProject('${project.id}')">View</button>
                <button class="btn btn-sm btn-primary" onclick="startProjectScan('${project.id}')">Scan</button>
            </div>
        </div>
    `).join('');
}

// Render recent activity
function renderRecentActivity() {
    const container = document.getElementById('activity-list');
    if (!container) return;
    
    const emptyState = document.getElementById('empty-activity');
    
    if (dashboardState.recentScans.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = dashboardState.recentScans.map(scan => `
        <div class="activity-item" onclick="viewScan('${scan.id}')">
            <div class="activity-icon ${getStatusClass(scan.status)}">
                ${getStatusIcon(scan.status)}
            </div>
            <div class="activity-content">
                <p class="activity-text">
                    <strong>Scan ${scan.status}</strong> on ${escapeHtml(scan.projectName || 'Unknown Project')}
                </p>
                <span class="activity-time">${formatDate(scan.created_at)}</span>
            </div>
            <div class="activity-meta">
                <span class="badge badge-${getStatusBadge(scan.status)}">${scan.total_vulns || 0} issues</span>
            </div>
        </div>
    `).join('');
}

// Render navigation projects
function renderNavProjects() {
    const container = document.getElementById('nav-projects');
    if (!container) return;
    
    container.innerHTML = dashboardState.projects.slice(0, 5).map(project => `
        <a href="project.html?id=${project.id}" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>${escapeHtml(project.name)}</span>
        </a>
    `).join('');
}

// Setup all event listeners
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // User menu dropdown
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', () => {
            userMenu.classList.remove('active');
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Quick Scan button
    const quickScanBtn = document.getElementById('quick-scan-btn');
    if (quickScanBtn) {
        quickScanBtn.addEventListener('click', openScanModal);
    }
    
    // New Scan in sidebar
    const navNewScan = document.getElementById('nav-new-scan');
    if (navNewScan) {
        navNewScan.addEventListener('click', (e) => {
            e.preventDefault();
            openScanModal();
        });
    }
    
    // New Project button
    const newProjectBtn = document.getElementById('new-project-btn');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', openProjectModal);
    }
    
    // Create project in sidebar
    const navCreateProject = document.getElementById('nav-create-project');
    if (navCreateProject) {
        navCreateProject.addEventListener('click', (e) => {
            e.preventDefault();
            openProjectModal();
        });
    }
    
    // Create first project button
    const createFirstProject = document.getElementById('create-first-project');
    if (createFirstProject) {
        createFirstProject.addEventListener('click', openProjectModal);
    }
    
    // Scan Modal
    setupScanModal();
    
    // Project Modal
    setupProjectModal();
}

// ============ SCAN MODAL ============

function openScanModal() {
    const modal = document.getElementById('scan-modal');
    if (modal) {
        modal.classList.add('active');
        populateProjectSelects();
        setupScanTabs();
    }
}

function closeScanModal() {
    const modal = document.getElementById('scan-modal');
    if (modal) {
        modal.classList.remove('active');
        resetScanForm();
    }
}

function setupScanModal() {
    // Close button
    const closeBtn = document.getElementById('close-scan-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeScanModal);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-scan');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeScanModal);
    }
    
    // Modal backdrop
    const modal = document.getElementById('scan-modal');
    if (modal) {
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeScanModal);
        }
    }
    
    // Start scan button
    const startScanBtn = document.getElementById('start-scan');
    if (startScanBtn) {
        startScanBtn.addEventListener('click', handleStartScan);
    }
    
    // Input tabs
    setupScanTabs();
    
    // File upload
    setupFileUpload();
    
    // Zip upload
    setupZipUpload();
    
    // Code textarea line count
    const codeTextarea = document.getElementById('scan-code');
    if (codeTextarea) {
        codeTextarea.addEventListener('input', () => {
            const lines = codeTextarea.value.split('\n').length;
            const lineCount = document.getElementById('scan-line-count');
            if (lineCount) {
                lineCount.textContent = `${lines} lines`;
            }
        });
    }
}

function setupScanTabs() {
    const tabs = document.querySelectorAll('.input-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const method = tab.dataset.method;
            dashboardState.currentScanMethod = method;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active panel
            document.querySelectorAll('.input-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(`panel-${method}`);
            if (panel) panel.classList.add('active');
        });
    });
}

function setupFileUpload() {
    const uploadZone = document.getElementById('file-upload-zone');
    const fileInput = document.getElementById('file-input');
    const uploadedFile = document.getElementById('uploaded-file');
    const removeBtn = document.getElementById('remove-file');
    
    if (uploadZone && fileInput) {
        // Click to upload
        uploadZone.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });
        
        // File input change
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                handleFileSelect(fileInput.files[0]);
            }
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dashboardState.selectedFile = null;
            if (uploadedFile) uploadedFile.classList.add('hidden');
            if (uploadZone) uploadZone.classList.remove('hidden');
            if (fileInput) fileInput.value = '';
        });
    }
}

function handleFileSelect(file) {
    const uploadZone = document.getElementById('file-upload-zone');
    const uploadedFile = document.getElementById('uploaded-file');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    
    dashboardState.selectedFile = file;
    
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = formatFileSize(file.size);
    if (uploadZone) uploadZone.classList.add('hidden');
    if (uploadedFile) uploadedFile.classList.remove('hidden');
}

function setupZipUpload() {
    const uploadZone = document.getElementById('zip-upload-zone');
    const zipInput = document.getElementById('zip-input');
    const uploadedZip = document.getElementById('uploaded-zip');
    const removeBtn = document.getElementById('remove-zip');
    
    if (uploadZone && zipInput) {
        // Click to upload
        uploadZone.addEventListener('click', () => zipInput.click());
        
        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                handleZipSelect(e.dataTransfer.files[0]);
            }
        });
        
        // File input change
        zipInput.addEventListener('change', () => {
            if (zipInput.files.length > 0) {
                handleZipSelect(zipInput.files[0]);
            }
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dashboardState.selectedZip = null;
            if (uploadedZip) uploadedZip.classList.add('hidden');
            if (uploadZone) uploadZone.classList.remove('hidden');
            if (zipInput) zipInput.value = '';
        });
    }
}

function handleZipSelect(file) {
    const uploadZone = document.getElementById('zip-upload-zone');
    const uploadedZip = document.getElementById('uploaded-zip');
    const zipName = document.getElementById('zip-name');
    const zipSize = document.getElementById('zip-size');
    
    dashboardState.selectedZip = file;
    
    if (zipName) zipName.textContent = file.name;
    if (zipSize) zipSize.textContent = formatFileSize(file.size);
    if (uploadZone) uploadZone.classList.add('hidden');
    if (uploadedZip) uploadedZip.classList.remove('hidden');
}

function populateProjectSelects() {
    const selects = ['scan-project', 'file-project'];
    
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        
        select.innerHTML = `
            <option value="">Select project...</option>
            <option value="new">+ Create new project</option>
            ${dashboardState.projects.map(p => `
                <option value="${p.id}">${escapeHtml(p.name)}</option>
            `).join('')}
        `;
    });
}

function resetScanForm() {
    // Reset paste form
    const scanCode = document.getElementById('scan-code');
    const scanFilename = document.getElementById('scan-filename');
    if (scanCode) scanCode.value = '';
    if (scanFilename) scanFilename.value = '';
    
    // Reset file upload
    dashboardState.selectedFile = null;
    const uploadedFile = document.getElementById('uploaded-file');
    const fileUploadZone = document.getElementById('file-upload-zone');
    if (uploadedFile) uploadedFile.classList.add('hidden');
    if (fileUploadZone) fileUploadZone.classList.remove('hidden');
    
    // Reset zip upload
    dashboardState.selectedZip = null;
    const uploadedZip = document.getElementById('uploaded-zip');
    const zipUploadZone = document.getElementById('zip-upload-zone');
    if (uploadedZip) uploadedZip.classList.add('hidden');
    if (zipUploadZone) zipUploadZone.classList.remove('hidden');
    
    // Reset tabs
    dashboardState.currentScanMethod = 'paste';
    document.querySelectorAll('.input-tab').forEach((t, i) => {
        t.classList.toggle('active', i === 0);
    });
    document.querySelectorAll('.input-panel').forEach((p, i) => {
        p.classList.toggle('active', i === 0);
    });
}

async function handleStartScan() {
    const method = dashboardState.currentScanMethod;
    
    try {
        let projectId;
        let files = [];
        
        if (method === 'paste') {
            const projectSelect = document.getElementById('scan-project');
            const filename = document.getElementById('scan-filename')?.value?.trim() || 'code.py';
            const code = document.getElementById('scan-code')?.value || '';
            const language = document.getElementById('scan-language')?.value || 'python';
            
            if (!code.trim()) {
                showToast('Please enter some code to scan', 'error');
                return;
            }
            
            projectId = projectSelect?.value;
            
            // Create project if needed
            if (!projectId || projectId === 'new') {
                const project = await api.createProject({
                    name: filename.replace(/\.[^/.]+$/, '') || 'New Project',
                    description: 'Created from quick scan',
                    sourceType: 'paste'
                });
                projectId = project.id;
            }
            
            // Upload file
            files = [{
                filename: filename,
                filepath: filename,
                content: code,
                language: language
            }];
            
        } else if (method === 'file') {
            const projectSelect = document.getElementById('file-project');
            const file = dashboardState.selectedFile;
            
            if (!file) {
                showToast('Please select a file to scan', 'error');
                return;
            }
            
            projectId = projectSelect?.value;
            
            // Create project if needed
            if (!projectId || projectId === 'new') {
                const project = await api.createProject({
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    description: 'Created from file upload',
                    sourceType: 'upload'
                });
                projectId = project.id;
            }
            
            // Read file content
            const content = await readFileContent(file);
            files = [{
                filename: file.name,
                filepath: file.name,
                content: content,
                language: detectLanguageFromFilename(file.name)
            }];
            
        } else if (method === 'github') {
            const githubUrl = document.getElementById('github-url')?.value?.trim();
            const githubBranch = document.getElementById('github-branch')?.value?.trim() || 'main';
            
            if (!githubUrl) {
                showToast('Please enter a GitHub repository URL', 'error');
                return;
            }
            
            // Parse repo name from URL
            const repoMatch = githubUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
            const repoName = repoMatch ? repoMatch[1].replace(/\.git$/, '') : 'GitHub Project';
            
            const project = await api.createProject({
                name: repoName.split('/').pop(),
                description: `Imported from ${githubUrl}`,
                sourceType: 'github',
                githubUrl: githubUrl,
                githubBranch: githubBranch
            });
            
            projectId = project.id;
            
            // Note: In a real implementation, you'd need backend support to clone the repo
            showToast('GitHub import is not yet fully implemented', 'warning');
            closeScanModal();
            return;
            
        } else if (method === 'zip') {
            const projectName = document.getElementById('zip-project-name')?.value?.trim();
            const file = dashboardState.selectedZip;
            
            if (!file) {
                showToast('Please select a ZIP file to scan', 'error');
                return;
            }
            
            // Note: In a real implementation, you'd need backend support to extract ZIP
            showToast('ZIP upload is not yet fully implemented', 'warning');
            closeScanModal();
            return;
        }
        
        // Upload files to project
        if (files.length > 0) {
            showToast('Uploading files...', 'info');
            await api.uploadFiles(projectId, files);
        }
        
        // Start scan
        showToast('Starting scan...', 'info');
        const scan = await api.createScan(projectId);
        
        showToast('Scan started successfully!', 'success');
        closeScanModal();
        
        // Redirect to scan results
        window.location.href = `scan-results.html?id=${scan.id}`;
        
    } catch (error) {
        console.error('Scan error:', error);
        showToast('Failed to start scan: ' + error.message, 'error');
    }
}

// Read file content as text
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Detect language from filename
function detectLanguageFromFilename(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const langMap = {
        'py': 'python',
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'java': 'java',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'cs': 'csharp',
        'sql': 'sql'
    };
    return langMap[ext] || 'unknown';
}

// ============ PROJECT MODAL ============

function openProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('active');
        // Clear form
        const nameInput = document.getElementById('project-name');
        const descInput = document.getElementById('project-description');
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
    }
}

function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function setupProjectModal() {
    // Close button
    const closeBtn = document.getElementById('close-project-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProjectModal);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-project');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeProjectModal);
    }
    
    // Modal backdrop
    const modal = document.getElementById('project-modal');
    if (modal) {
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeProjectModal);
        }
    }
    
    // Save project button
    const saveBtn = document.getElementById('save-project');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleCreateProject);
    }
    
    // Form submit
    const form = document.getElementById('create-project-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleCreateProject();
        });
    }
}

async function handleCreateProject() {
    const nameInput = document.getElementById('project-name');
    const descInput = document.getElementById('project-description');
    
    const name = nameInput?.value?.trim();
    const description = descInput?.value?.trim();
    
    if (!name) {
        showToast('Please enter a project name', 'error');
        return;
    }
    
    try {
        showToast('Creating project...', 'info');
        
        const project = await api.createProject({
            name,
            description,
            sourceType: 'paste'
        });
        
        showToast('Project created successfully!', 'success');
        closeProjectModal();
        
        // Refresh projects
        await loadProjects();
        renderProjects();
        renderNavProjects();
        renderStats();
        
    } catch (error) {
        console.error('Create project error:', error);
        showToast('Failed to create project: ' + error.message, 'error');
    }
}

// ============ NAVIGATION ============

function viewProject(projectId) {
    window.location.href = `project.html?id=${projectId}`;
}

function viewScan(scanId) {
    window.location.href = `scan-results.html?id=${scanId}`;
}

async function startProjectScan(projectId) {
    try {
        showToast('Starting scan...', 'info');
        const scan = await api.createScan(projectId);
        showToast('Scan started successfully!', 'success');
        window.location.href = `scan-results.html?id=${scan.id}`;
    } catch (error) {
        console.error('Start scan error:', error);
        showToast('Failed to start scan: ' + error.message, 'error');
    }
}

// ============ UTILITY FUNCTIONS ============

function showLoadingState(isLoading) {
    dashboardState.isLoading = isLoading;
    document.body.classList.toggle('loading', isLoading);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) return 'Just now';
    
    // Less than an hour
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }
    
    // Default format
    return date.toLocaleDateString();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getStatusClass(status) {
    const classes = {
        completed: 'success',
        running: 'info',
        pending: 'warning',
        failed: 'danger'
    };
    return classes[status] || 'secondary';
}

function getStatusBadge(status) {
    const badges = {
        completed: 'success',
        running: 'info',
        pending: 'warning',
        failed: 'danger'
    };
    return badges[status] || 'secondary';
}

function getStatusIcon(status) {
    const icons = {
        completed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
        running: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        pending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        failed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    };
    return icons[status] || icons.pending;
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('visible'), 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('dashboard-page')) {
        initDashboard();
    }
});
