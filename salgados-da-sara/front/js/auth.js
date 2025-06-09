// Authentication Module
const Auth = {
    currentUser: null,
    currentAdmin: null,

    // Initialize
    init: () => {
        // Carregar usuário do localStorage (para manter sessão)
        Auth.currentUser = Utils.storage.get('currentUser');
        Auth.currentAdmin = Utils.storage.get('currentAdmin');
    },

    // Login user
    login: async (phone, password) => {
        try {
            const response = await API.auth.login(phone, password);
            
            if (response.success) {
                Auth.currentUser = response.user;
                Utils.storage.set('currentUser', response.user);
                return { success: true, user: response.user };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Register user
    register: async (userData) => {
        try {
            const response = await API.auth.register(userData);
            
            if (response.success) {
                Auth.currentUser = response.user;
                Utils.storage.set('currentUser', response.user);
                return { success: true, user: response.user };
            }
            
            return { success: false, errors: response.errors };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Forgot password
    forgotPassword: async (phone) => {
        try {
            const response = await API.auth.forgotPassword(phone);
            return response;
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Admin login
    adminLogin: async (username, password) => {
        try {
            const response = await API.auth.adminLogin(username, password);
            
            if (response.success) {
                Auth.currentAdmin = response.admin;
                Utils.storage.set('currentAdmin', response.admin);
                return { success: true, admin: response.admin };
            }
            
            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Logout
    logout: () => {
        Auth.currentUser = null;
        Auth.currentAdmin = null;
        Utils.storage.remove('currentUser');
        Utils.storage.remove('currentAdmin');
    },

    // Check if user is logged in
    isLoggedIn: () => {
        return Auth.currentUser !== null;
    },

    // Check if admin is logged in
    isAdminLoggedIn: () => {
        return Auth.currentAdmin !== null;
    },

    // Get current user
    getCurrentUser: () => {
        return Auth.currentUser;
    },

    // Get current admin
    getCurrentAdmin: () => {
        return Auth.currentAdmin;
    }
};

// Form handlers
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const phone = formData.get('phone');
            const password = formData.get('password');

            Utils.setLoading(true);
            const result = await Auth.login(phone, password);
            Utils.setLoading(false);
            
            if (result.success) {
                Utils.showMessage('Login realizado com sucesso!');
                setTimeout(() => {
                    App.showMainApp();
                }, 1000);
            } else {
                Utils.showMessage(result.message, 'error');
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const userData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                address: formData.get('address'),
                number: formData.get('number'),
                complement: formData.get('complement'),
                city: formData.get('city'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            Utils.setLoading(true);
            const result = await Auth.register(userData);
            Utils.setLoading(false);
            
            if (result.success) {
                Utils.showMessage('Conta criada com sucesso!');
                setTimeout(() => {
                    App.showMainApp();
                }, 1000);
            } else {
                if (result.errors) {
                    // Show field-specific errors
                    for (const field in result.errors) {
                        const fieldEl = document.querySelector(`[name="${field}"]`);
                        if (fieldEl) {
                            const formGroup = fieldEl.closest('.form-group');
                            formGroup.classList.add('error');
                            
                            let errorEl = formGroup.querySelector('.error-message');
                            if (!errorEl) {
                                errorEl = document.createElement('small');
                                errorEl.className = 'error-message';
                                formGroup.appendChild(errorEl);
                            }
                            errorEl.textContent = result.errors[field];
                        }
                    }
                } else {
                    Utils.showMessage(result.message, 'error');
                }
            }
        });

        // Clear errors on input
        registerForm.addEventListener('input', (e) => {
            const formGroup = e.target.closest('.form-group');
            if (formGroup.classList.contains('error')) {
                formGroup.classList.remove('error');
                const errorEl = formGroup.querySelector('.error-message');
                if (errorEl) {
                    errorEl.remove();
                }
            }
        });
    }

    // Forgot password form
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(forgotForm);
            const phone = formData.get('phone');

            Utils.setLoading(true);
            const result = await Auth.forgotPassword(phone);
            Utils.setLoading(false);
            
            if (result.success) {
                Utils.showMessage(result.message);
            } else {
                Utils.showMessage(result.message, 'error');
            }
        });
    }

    // Admin login form
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(adminLoginForm);
            const username = formData.get('username');
            const password = formData.get('password');

            Utils.setLoading(true);
            const result = await Auth.adminLogin(username, password);
            Utils.setLoading(false);
            
            if (result.success) {
                Utils.showMessage('Login realizado com sucesso!');
                document.getElementById('admin-login').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'flex';
                Admin.init();
            } else {
                Utils.showMessage(result.message, 'error');
            }
        });
    }
});

// Navigation functions
function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('forgot-password-page').style.display = 'none';
}

function showRegister() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'flex';
    document.getElementById('forgot-password-page').style.display = 'none';
}

function showForgotPassword() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('register-page').style.display = 'none';
    document.getElementById('forgot-password-page').style.display = 'flex';
}

function logout() {
    Auth.logout();
    Utils.showMessage('Logout realizado com sucesso!');
    setTimeout(() => {
        App.showMainApp(); // Volta para o cardápio
    }, 1000);
}

function adminLogout() {
    Auth.logout();
    Utils.showMessage('Logout realizado com sucesso!');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

// Initialize auth
Auth.init();