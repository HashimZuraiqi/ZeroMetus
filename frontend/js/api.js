/**
 * ZeroMetus API Client
 * Handles all communication with the backend
 */

const API_BASE = 'http://localhost:8000/api/v1';

// Custom error class
class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('zerometus_token');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('zerometus_token', token);
        } else {
            localStorage.removeItem('zerometus_token');
        }
    }

    // Get auth headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Generic request handler
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new ApiError(data.detail || 'Request failed', response.status, data);
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Network error. Please check your connection.', 0, null);
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ============ AUTH ============

    async register(email, password, displayName) {
        return this.post('/auth/register', {
            email,
            password,
            display_name: displayName,
        });
    }

    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        return response;
    }

    async logout() {
        try {
            await this.post('/auth/logout', {});
        } finally {
            this.setToken(null);
        }
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async verifyToken() {
        return this.get('/auth/verify-token');
    }

    async updateProfile(data) {
        return this.put('/auth/me', data);
    }

    async changePassword(currentPassword, newPassword) {
        return this.post('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
        });
    }

    // ============ PROJECTS ============

    async getProjects() {
        return this.get('/projects');
    }

    async getProject(projectId) {
        return this.get(`/projects/${projectId}`);
    }

    async createProject(data) {
        // Support both object and individual parameters
        const body = typeof data === 'object' ? {
            name: data.name,
            description: data.description || '',
            source_type: data.sourceType || 'paste',
        } : {
            name: data,
            description: '',
            source_type: 'paste',
        };
        return this.post('/projects', body);
    }

    async deleteProject(projectId) {
        return this.delete(`/projects/${projectId}`);
    }

    async uploadFiles(projectId, files) {
        return this.post(`/projects/${projectId}/files`, { files });
    }

    async getProjectFiles(projectId) {
        return this.get(`/projects/${projectId}/files`);
    }

    async getProjectScans(projectId) {
        return this.get(`/projects/${projectId}/scans`);
    }

    // ============ SCANS ============

    async createScan(projectId, options = {}) {
        return this.post('/scans', {
            project_id: projectId,
            scan_options: {
                include_ai_fixes: options.includeAiFixes ?? true,
                severity_threshold: options.severityThreshold ?? 'low',
            },
        });
    }

    async getScan(scanId) {
        return this.get(`/scans/${scanId}`);
    }

    async getScanResults(scanId) {
        return this.get(`/scans/${scanId}/results`);
    }

    // ============ VULNERABILITIES ============

    async getVulnerabilities(scanId = null) {
        if (scanId) {
            return this.get(`/scans/${scanId}/vulnerabilities`);
        }
        return this.get('/vulnerabilities');
    }

    async getVulnerability(vulnId) {
        return this.get(`/vulnerabilities/${vulnId}`);
    }

    async updateVulnerabilityStatus(vulnId, status) {
        return this.put(`/vulnerabilities/${vulnId}/status`, { status });
    }

    // ============ FIXES ============

    async getFix(vulnId) {
        return this.get(`/vulnerabilities/${vulnId}/fix`);
    }

    async acceptFix(fixId) {
        return this.post(`/fixes/${fixId}/accept`, {});
    }

    async rejectFix(fixId, reason, notes) {
        return this.post(`/fixes/${fixId}/reject`, { reason, notes });
    }
}

// Export singleton instance
const api = new ApiClient();
