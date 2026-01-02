/**
 * ZeroMetus Settings Page Handler
 */

// Settings state
const settingsState = {
    user: null,
    isLoading: true
};

// Initialize settings page
async function initSettingsPage() {
    // Check if token exists
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Load user data (also verifies token validity)
        const user = await api.getCurrentUser();
        settingsState.user = user;
        storeUser(user);
        
        // Populate form
        populateUserForm(user);
        
        // Setup event listeners
        setupSettingsEventListeners();
        
    } catch (error) {
        console.error('Settings init error:', error);
        if (error.status === 401) {
            clearAuth();
            window.location.href = 'login.html';
        }
    }
}

// Populate user form
function populateUserForm(user) {
    const nameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');
    const avatarEl = document.getElementById('current-avatar');
    
    if (nameInput) nameInput.value = user.display_name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (avatarEl) avatarEl.textContent = getInitials(user.display_name || user.email);
    
    // Update user UI
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = user.display_name || user.email;
    });
    document.querySelectorAll('.user-avatar, #user-avatar').forEach(el => {
        el.textContent = getInitials(user.display_name || user.email);
    });
}

// Setup event listeners
function setupSettingsEventListeners() {
    // Settings tabs
    const navItems = document.querySelectorAll('.settings-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Update active panel
            document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(`panel-${tab}`);
            if (panel) panel.classList.add('active');
        });
    });
    
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Password form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Delete account
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const modal = document.getElementById('delete-account-modal');
            if (modal) modal.classList.add('active');
        });
    }
    
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const confirmInput = document.getElementById('confirm-delete');
    if (confirmDeleteBtn && confirmInput) {
        confirmInput.addEventListener('input', () => {
            confirmDeleteBtn.disabled = confirmInput.value !== 'DELETE';
        });
        confirmDeleteBtn.addEventListener('click', handleAccountDelete);
    }
    
    // Modal close
    document.querySelectorAll('#cancel-delete, .modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('delete-account-modal')?.classList.remove('active');
        });
    });
    
    // Logout
    document.querySelectorAll('#logout-btn, .logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // User menu
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
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const displayName = form.querySelector('#display-name')?.value.trim();
    
    if (!displayName) {
        showToast('Display name is required', 'error');
        return;
    }
    
    try {
        const updated = await api.updateProfile({ display_name: displayName });
        settingsState.user = { ...settingsState.user, display_name: displayName };
        populateUserForm(settingsState.user);
        showToast('Profile updated successfully', 'success');
    } catch (error) {
        showToast('Failed to update profile: ' + error.message, 'error');
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const form = e.target;
    const currentPassword = form.querySelector('#current-password')?.value;
    const newPassword = form.querySelector('#new-password')?.value;
    const confirmPassword = form.querySelector('#confirm-password')?.value;
    
    if (!currentPassword || !newPassword) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('New password must be at least 8 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        await api.changePassword(currentPassword, newPassword);
        showToast('Password changed successfully', 'success');
        form.reset();
    } catch (error) {
        showToast('Failed to change password: ' + error.message, 'error');
    }
}

// Handle account delete
async function handleAccountDelete() {
    try {
        await api.request('/auth/me', { method: 'DELETE' });
        clearAuth();
        window.location.href = 'index.html';
    } catch (error) {
        showToast('Failed to delete account: ' + error.message, 'error');
    }
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

// Show toast notification
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initSettingsPage);
