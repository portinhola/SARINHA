// Utility Functions
const Utils = {
    // Format currency
    formatCurrency: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Format date
    formatDate: (date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Generate order number
    generateOrderNumber: () => {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderNumber = orders.length + 1;
        const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '');
        return `#${orderNumber.toString().padStart(3, '0')}-${date}`;
    },

    // Show message
    showMessage: (message, type = 'success') => {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    },

    // Validate form
    validateForm: (formData, rules) => {
        const errors = {};

        for (const field in rules) {
            const value = formData[field];
            const rule = rules[field];

            if (rule.required && (!value || value.trim() === '')) {
                errors[field] = `${rule.label} é obrigatório`;
                continue;
            }

            if (rule.minLength && value && value.length < rule.minLength) {
                errors[field] = `${rule.label} deve ter pelo menos ${rule.minLength} caracteres`;
                continue;
            }

            if (rule.email && value && !this.isValidEmail(value)) {
                errors[field] = 'Email inválido';
                continue;
            }

            if (rule.phone && value && !this.isValidPhone(value)) {
                errors[field] = 'Telefone inválido';
                continue;
            }

            if (rule.match && formData[rule.match] && value !== formData[rule.match]) {
                errors[field] = 'Senhas não coincidem';
                continue;
            }
        }

        return errors;
    },

    // Validate email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate phone
    isValidPhone: (phone) => {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone) || phone.replace(/\D/g, '').length >= 10;
    },

    // Format phone
    formatPhone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    },

    // Calculate item price
    calculateItemPrice: (basePrice, quantityType, unitCount = 1) => {
        const price = parseFloat(basePrice);
        
        switch (quantityType) {
            case 'cento':
                return price;
            case 'meio-cento':
                return price / 2;
            case 'unidade':
                return (price / 100) * unitCount;
            default:
                return price;
        }
    },

    // Get quantity label
    getQuantityLabel: (quantityType, unitCount = 1) => {
        switch (quantityType) {
            case 'cento':
                return 'Cento';
            case 'meio-cento':
                return 'Meio Cento';
            case 'unidade':
                return `${unitCount} unidades`;
            default:
                return 'Cento';
        }
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Deep clone object
    deepClone: (obj) => {
        return JSON.parse(JSON.stringify(obj));
    },

    // Check if user is logged in
    isLoggedIn: () => {
        return localStorage.getItem('currentUser') !== null;
    },

    // Get current user
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('currentUser') || 'null');
    },

    // Set loading state
    setLoading: (isLoading) => {
        const loadingEl = document.getElementById('loading');
        if (isLoading) {
            loadingEl.style.display = 'flex';
        } else {
            loadingEl.style.display = 'none';
        }
    },

    // Smooth scroll to element
    smoothScrollTo: (element) => {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    },

    // Local storage helpers
    storage: {
        get: (key) => {
            try {
                return JSON.parse(localStorage.getItem(key) || 'null');
            } catch (e) {
                console.error('Error parsing localStorage data:', e);
                return null;
            }
        },

        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Error saving to localStorage:', e);
            }
        },

        remove: (key) => {
            localStorage.removeItem(key);
        },

        clear: () => {
            localStorage.clear();
        }
    }
};

// Make Utils globally available
window.Utils = Utils;