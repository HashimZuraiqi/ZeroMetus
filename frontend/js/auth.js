/**
 * ZeroMetus Authentication Handler
 * Manages login, signup, and session state
 */

// Check if user is authenticated (has token)
function isAuthenticated() {
    return !!localStorage.getItem('zerometus_token');
}

// Verify token is valid with the backend
async function verifyAuthentication() {
    if (!isAuthenticated()) {
        return false;
    }
    
    try {
        // Verify token with backend
        const user = await api.getCurrentUser();
        if (user && user.id) {
            storeUser(user);
            return true;
        }
        // Token is invalid
        clearAuth();
        return false;
    } catch (error) {
        console.error('Token verification failed:', error);
        if (error.status === 401) {
            clearAuth();
        }
        return false;
    }
}

// Get stored user data
function getStoredUser() {
    const userData = localStorage.getItem('zerometus_user');
    return userData ? JSON.parse(userData) : null;
}

// Store user data
function storeUser(user) {
    localStorage.setItem('zerometus_user', JSON.stringify(user));
}

// Clear all auth data
function clearAuth() {
    localStorage.removeItem('zerometus_token');
    localStorage.removeItem('zerometus_user');
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Async version that verifies token with backend
async function requireAuthAsync() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        // Verify token with backend
        const user = await api.getCurrentUser();
        if (user && user.id) {
            storeUser(user);
            return true;
        }
        // Token is invalid
        clearAuth();
        window.location.href = 'login.html';
        return false;
    } catch (error) {
        console.error('Auth verification failed:', error);
        if (error.status === 401) {
            clearAuth();
            window.location.href = 'login.html';
        }
        return false;
    }
}

// Redirect to dashboard if already authenticated
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return true;
    }
    return false;
}

// Initialize auth page (login/signup)
function initAuthPage() {
    // Redirect if already logged in
    redirectIfAuthenticated();
    
    // Setup form handlers
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        setupLoginForm(loginForm);
    }
    
    if (signupForm) {
        setupSignupForm(signupForm);
    }
    
    // Setup password toggle
    setupPasswordToggle();
}

// Setup login form
function setupLoginForm(form) {
    const submitBtn = form.querySelector('#submit-btn');
    const errorEl = form.querySelector('#form-error');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = form.querySelector('#email').value.trim();
        const password = form.querySelector('#password').value;
        
        if (!email || !password) {
            showFormError(errorEl, 'Please enter both email and password');
            return;
        }
        
        // Show loading state
        setButtonLoading(submitBtn, true);
        hideFormError(errorEl);
        
        try {
            const response = await api.login(email, password);
            
            // Store user data
            if (response.user) {
                storeUser(response.user);
            }
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            showFormError(errorEl, error.message || 'Login failed. Please try again.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

// Setup signup form
function setupSignupForm(form) {
    const submitBtn = form.querySelector('#submit-btn');
    const errorEl = form.querySelector('#form-error');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = form.querySelector('#display-name')?.value.trim() || form.querySelector('#name')?.value.trim();
        const email = form.querySelector('#email').value.trim();
        const password = form.querySelector('#password').value;
        const confirmPassword = form.querySelector('#confirm-password')?.value;
        
        // Validation
        if (!name || !email || !password) {
            showFormError(errorEl, 'Please fill in all required fields');
            return;
        }
        
        if (password.length < 8) {
            showFormError(errorEl, 'Password must be at least 8 characters');
            return;
        }
        
        if (confirmPassword && password !== confirmPassword) {
            showFormError(errorEl, 'Passwords do not match');
            return;
        }
        
        // Show loading state
        setButtonLoading(submitBtn, true);
        hideFormError(errorEl);
        
        try {
            await api.register(email, password, name);
            
            // Auto-login after registration
            const loginResponse = await api.login(email, password);
            
            if (loginResponse.user) {
                storeUser(loginResponse.user);
            }
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            showFormError(errorEl, error.message || 'Registration failed. Please try again.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });
}

// Setup password visibility toggle
function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.password-input-wrapper');
            const input = wrapper.querySelector('input');
            const eyeIcon = btn.querySelector('.eye-icon');
            const eyeOffIcon = btn.querySelector('.eye-off-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon?.classList.add('hidden');
                eyeOffIcon?.classList.remove('hidden');
            } else {
                input.type = 'password';
                eyeIcon?.classList.remove('hidden');
                eyeOffIcon?.classList.add('hidden');
            }
        });
    });
}

// Show form error
function showFormError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.add('visible');
        element.style.display = 'block';
    }
}

// Hide form error
function hideFormError(element) {
    if (element) {
        element.classList.remove('visible');
        element.style.display = 'none';
    }
}

// Set button loading state
function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        if (btnText) btnText.style.visibility = 'hidden';
        if (btnLoader) btnLoader.classList.remove('hidden');
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        if (btnText) btnText.style.visibility = 'visible';
        if (btnLoader) btnLoader.classList.add('hidden');
    }
}

// Logout handler
async function logout() {
    try {
        await api.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuth();
        window.location.href = 'login.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if this is an auth page
    const isAuthPage = document.body.classList.contains('auth-page');
    
    if (isAuthPage) {
        initAuthPage();
    }
});
