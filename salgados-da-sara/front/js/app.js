// Main Application Module
const App = {
    currentPage: 'cardapio',
    
    // Initialize application
    init: () => {
        Utils.setLoading(true);
        
        // Check URL for admin access
        if (window.location.pathname.includes('/admin') || window.location.hash.includes('admin')) {
            App.showAdminPage();
            Utils.setLoading(false);
            return;
        }
        
        // Always show main app first (cardápio)
        App.showMainApp();
        
        Utils.setLoading(false);
    },

    // Show authentication pages
    showAuthPages: () => {
        document.getElementById('navbar').style.display = 'none';
        document.querySelectorAll('.main-page').forEach(page => {
            page.style.display = 'none';
        });
        document.getElementById('admin-page').style.display = 'none';
        document.getElementById('login-page').style.display = 'flex';
    },

    // Show main application
    showMainApp: () => {
        document.querySelectorAll('.auth-page').forEach(page => {
            page.style.display = 'none';
        });
        document.getElementById('admin-page').style.display = 'none';
        document.getElementById('navbar').style.display = 'block';
        
        // Show default page (cardapio)
        App.showPage('cardapio');
        
        // Initialize modules
        Menu.init();
        Cart.init();
        
        // Only initialize history if user is logged in
        if (Auth.isLoggedIn()) {
            History.init();
        }
    },

    // Show admin page
    showAdminPage: () => {
        document.querySelectorAll('.auth-page').forEach(page => {
            page.style.display = 'none';
        });
        document.querySelectorAll('.main-page').forEach(page => {
            page.style.display = 'none';
        });
        document.getElementById('navbar').style.display = 'none';
        document.getElementById('admin-page').style.display = 'block';
        
        // Check if admin is logged in
        if (Auth.isAdminLoggedIn()) {
            document.getElementById('admin-login').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'flex';
            Admin.init();
        } else {
            document.getElementById('admin-login').style.display = 'flex';
            document.getElementById('admin-panel').style.display = 'none';
        }
    },

    // Show specific page
    showPage: (pageName) => {
        // Check if user needs to be logged in for certain pages
        if ((pageName === 'carrinho' || pageName === 'historico') && !Auth.isLoggedIn()) {
            App.showAuthPages();
            Utils.showMessage('Você precisa fazer login para acessar esta página!', 'error');
            return;
        }

        App.currentPage = pageName;
        
        // Hide all main pages
        document.querySelectorAll('.main-page').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show selected page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
        }
        
        // Update navigation
        App.updateNavigation(pageName);
        
        // Load page-specific data
        switch (pageName) {
            case 'cardapio':
                Menu.loadMenuItems();
                break;
            case 'carrinho':
                Cart.renderCart();
                Cart.updateCartSummary();
                break;
            case 'historico':
                History.loadHistory();
                break;
        }
    },

    // Update navigation active state
    updateNavigation: (activePage) => {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Find and activate the corresponding nav button
        const activeBtn = document.querySelector(`.nav-btn[onclick*="${activePage}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    },

    // Check if user needs login for action
    requireLogin: (callback) => {
        if (!Auth.isLoggedIn()) {
            App.showAuthPages();
            Utils.showMessage('Você precisa fazer login para continuar!', 'error');
            return false;
        }
        callback();
        return true;
    }
};

// History Module
const History = {
    // Initialize history
    init: async () => {
        await History.loadHistory();
    },

    // Load user's order history from API
    loadHistory: async () => {
        const historyContainer = document.getElementById('history-items');
        if (!historyContainer) return;

        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        try {
            const response = await API.orders.getAll(currentUser.id);
            
            if (response.success) {
                const userOrders = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                if (userOrders.length === 0) {
                    historyContainer.innerHTML = `
                        <div class="history-empty">
                            <h3>Nenhum pedido encontrado</h3>
                            <p>Você ainda não fez nenhum pedido. Que tal dar uma olhada no nosso cardápio?</p>
                            <button class="btn btn-primary" onclick="showPage('cardapio')">Ver Cardápio</button>
                        </div>
                    `;
                    return;
                }

                historyContainer.innerHTML = userOrders.map(order => `
                    <div class="history-item">
                        <div class="history-item-header">
                            <div class="history-order-id">${order.order_number}</div>
                            <div class="history-date">${Utils.formatDate(order.created_at)}</div>
                            <div class="history-status ${order.status}">
                                ${Admin.getStatusLabel(order.status)}
                            </div>
                        </div>
                        
                        <div class="history-items-list">
                            ${order.items.map(item => `
                                <div class="order-item">
                                    <span>
                                        ${item.quantity}x ${item.name}
                                        (${Utils.getQuantityLabel(item.quantityType, item.unitCount)})
                                    </span>
                                    <span>${Utils.formatCurrency(item.totalPrice)}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="history-total">
                            Total: ${Utils.formatCurrency(order.total)}
                        </div>
                        
                        ${order.status === 'rejected' && order.rejection_reason ? `
                            <div class="rejection-reason">
                                <strong>Motivo da recusa:</strong> ${order.rejection_reason}
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            historyContainer.innerHTML = `
                <div class="history-empty">
                    <h3>Erro ao carregar histórico</h3>
                    <p>Verifique se o backend está rodando. ${error.message}</p>
                </div>
            `;
        }
    }
};

// Global navigation function
function showPage(pageName) {
    App.showPage(pageName);
}

// Handle URL changes for admin access
window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('admin')) {
        App.showAdminPage();
    }
});

// Handle direct admin URL access
if (window.location.pathname.includes('/admin')) {
    window.location.hash = '#admin';
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle page refresh
window.addEventListener('beforeunload', () => {
    // Save any pending data
    Cart.saveCart();
});

// Handle online/offline status
window.addEventListener('online', () => {
    Utils.showMessage('Conexão restaurada!');
});

window.addEventListener('offline', () => {
    Utils.showMessage('Você está offline. Algumas funcionalidades podem não funcionar.', 'error');
});

// Prevent form submission on Enter key in certain inputs
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.type === 'number') {
        e.preventDefault();
    }
});

// Auto-format phone numbers
document.addEventListener('input', (e) => {
    if (e.target.type === 'tel') {
        e.target.value = Utils.formatPhone(e.target.value);
    }
});

// Handle escape key to close modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal[style*="flex"]');
        if (modal) {
            modal.style.display = 'none';
        }
    }
});

// Click outside modal to close
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});