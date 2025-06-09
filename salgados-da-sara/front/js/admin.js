// Admin Module
const Admin = {
    currentSection: 'pedidos',

    // Initialize admin panel
    init: async () => {
        await Admin.loadOrders();
        await Admin.loadProducts();
        await Admin.loadAdmins();
        await Admin.loadConfig();
    },

    // Load orders for admin
    loadOrders: async () => {
        const ordersContainer = document.getElementById('admin-orders');
        if (!ordersContainer) return;

        try {
            const response = await API.orders.getAll();
            
            if (response.success) {
                const orders = response.data;
                const sortedOrders = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                if (sortedOrders.length === 0) {
                    ordersContainer.innerHTML = `
                        <div class="text-center">
                            <h4>Nenhum pedido encontrado</h4>
                            <p>Os pedidos aparecerão aqui quando forem realizados.</p>
                        </div>
                    `;
                    return;
                }

                ordersContainer.innerHTML = sortedOrders.map(order => `
                    <div class="admin-order ${order.status}">
                        <div class="order-header">
                            <div class="order-id">${order.order_number}</div>
                            <div class="order-status ${order.status}">
                                ${Admin.getStatusLabel(order.status)}
                            </div>
                        </div>
                        
                        <div class="order-details">
                            <div class="order-customer">
                                <div class="customer-info">
                                    <strong>Cliente:</strong>
                                    ${order.customer_data.name}
                                </div>
                                <div class="customer-info">
                                    <strong>Telefone:</strong>
                                    ${order.customer_data.phone}
                                </div>
                                <div class="customer-info">
                                    <strong>Entrega:</strong>
                                    ${order.is_delivery ? 'Delivery' : 'Retirada'}
                                </div>
                                <div class="customer-info">
                                    <strong>Pagamento:</strong>
                                    ${Admin.getPaymentLabel(order.payment_method)}
                                </div>
                                <div class="customer-info">
                                    <strong>Data:</strong>
                                    ${Utils.formatDate(order.created_at)}
                                </div>
                                <div class="customer-info">
                                    <strong>Total:</strong>
                                    ${Utils.formatCurrency(order.total)}
                                </div>
                            </div>
                            
                            ${order.is_delivery ? `
                                <div class="customer-info">
                                    <strong>Endereço:</strong>
                                    ${order.customer_data.address}, ${order.customer_data.number}
                                    ${order.customer_data.complement ? `, ${order.customer_data.complement}` : ''}
                                    - ${order.customer_data.city}
                                </div>
                            ` : ''}
                            
                            <div class="order-items">
                                <strong>Itens:</strong>
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
                        </div>
                        
                        <div class="order-actions">
                            ${order.status === 'pending' ? `
                                <button class="btn btn-success" onclick="Admin.updateOrderStatus('${order.id}', 'confirmed')">
                                    Confirmar
                                </button>
                                <button class="btn btn-danger" onclick="Admin.showRejectModal('${order.id}')">
                                    Recusar
                                </button>
                            ` : ''}
                            
                            ${order.status === 'confirmed' ? `
                                <button class="btn btn-primary" onclick="Admin.updateOrderStatus('${order.id}', 'ready')">
                                    Pronto
                                </button>
                            ` : ''}
                            
                            ${order.status === 'ready' ? `
                                <button class="btn btn-success" onclick="Admin.updateOrderStatus('${order.id}', 'delivered')">
                                    Entregue
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            ordersContainer.innerHTML = `
                <div class="text-center">
                    <h4>Erro ao carregar pedidos</h4>
                    <p>Tente novamente mais tarde.</p>
                </div>
            `;
        }
    },

    // Get status label
    getStatusLabel: (status) => {
        const labels = {
            'pending': 'Aguardando Confirmação',
            'confirmed': 'Em Preparação',
            'ready': 'Pronto',
            'delivered': 'Entregue',
            'rejected': 'Recusado'
        };
        return labels[status] || status;
    },

    // Get payment label
    getPaymentLabel: (method) => {
        const labels = {
            'cash': 'Dinheiro',
            'card': 'Cartão',
            'pix': 'PIX'
        };
        return labels[method] || method;
    },

    // Update order status
    updateOrderStatus: async (orderId, newStatus) => {
        try {
            const response = await API.orders.updateStatus(orderId, newStatus);
            
            if (response.success) {
                Admin.loadOrders();
                Utils.showMessage(`Pedido atualizado para: ${Admin.getStatusLabel(newStatus)}`);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            Utils.showMessage('Erro ao atualizar pedido: ' + error.message, 'error');
        }
    },

    // Show reject modal
    showRejectModal: (orderId) => {
        const reason = prompt('Motivo da recusa:');
        if (reason) {
            Admin.rejectOrder(orderId, reason);
        }
    },

    // Reject order
    rejectOrder: async (orderId, reason) => {
        try {
            const response = await API.orders.updateStatus(orderId, 'rejected', null, reason);
            
            if (response.success) {
                Admin.loadOrders();
                Utils.showMessage('Pedido foi recusado.');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            Utils.showMessage('Erro ao recusar pedido: ' + error.message, 'error');
        }
    },

    // Load products for admin
    loadProducts: async () => {
        const productsContainer = document.getElementById('admin-products');
        if (!productsContainer) return;

        try {
            const response = await API.products.getAll();
            
            if (response.success) {
                const products = response.data;

                productsContainer.innerHTML = products.map(item => `
                    <div class="admin-product">
                        <div class="product-info">
                            <h4>${item.name}</h4>
                            <div class="product-price">
                                ${item.is_portioned ? Utils.formatCurrency(item.price) : Utils.formatCurrency(item.price) + ' / cento'}
                            </div>
                            <div class="product-category">${Menu.getCategoryName(item.category)}</div>
                            ${item.description ? `<p>${item.description}</p>` : ''}
                        </div>
                        <div class="product-actions">
                            ${item.is_custom ? `
                                <button class="btn btn-secondary" onclick="Admin.editProduct(${item.id})">Editar</button>
                                <button class="btn btn-danger" onclick="Admin.deleteProduct(${item.id})">Excluir</button>
                            ` : `
                                <small>Item padrão</small>
                            `}
                        </div>
                    </div>
                `).join('');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            productsContainer.innerHTML = `
                <div class="text-center">
                    <h4>Erro ao carregar produtos</h4>
                    <p>Tente novamente mais tarde.</p>
                </div>
            `;
        }
    },

    // Show add product modal
    showAddProduct: () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content admin-modal">
                <div class="modal-header">
                    <h3>Adicionar Produto</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <form id="add-product-form">
                    <div class="form-group">
                        <label for="product-name">Nome do Produto</label>
                        <input type="text" id="product-name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="product-price">Preço (R$)</label>
                        <input type="number" id="product-price" name="price" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="product-category">Categoria</label>
                        <select id="product-category" name="category" required>
                            <option value="salgados">Salgados Fritos</option>
                            <option value="sortidos">Sortidos</option>
                            <option value="assados">Assados</option>
                            <option value="especiais">Especiais</option>
                            <option value="opcionais">Opcionais</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="product-description">Descrição</label>
                        <textarea id="product-description" name="description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="is_portioned"> Item vendido por porção
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Adicionar</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Handle form submission
        modal.querySelector('#add-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newProduct = {
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                category: formData.get('category'),
                description: formData.get('description'),
                is_portioned: formData.has('is_portioned')
            };

            try {
                const response = await API.products.create(newProduct);
                
                if (response.success) {
                    Admin.loadProducts();
                    Utils.showMessage('Produto adicionado com sucesso!');
                    modal.remove();
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                Utils.showMessage('Erro ao adicionar produto: ' + error.message, 'error');
            }
        });
    },

    // Edit product
    editProduct: async (productId) => {
        // Implementar edição de produto
        Utils.showMessage('Funcionalidade de edição em desenvolvimento');
    },

    // Delete product
    deleteProduct: async (productId) => {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                const response = await API.products.delete(productId);
                
                if (response.success) {
                    Admin.loadProducts();
                    Utils.showMessage('Produto excluído com sucesso!');
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                Utils.showMessage('Erro ao excluir produto: ' + error.message, 'error');
            }
        }
    },

    // Load admins
    loadAdmins: async () => {
        const adminsContainer = document.getElementById('admin-admins');
        if (!adminsContainer) return;

        try {
            const response = await API.admin.getAdmins();
            
            if (response.success) {
                const admins = response.data;

                adminsContainer.innerHTML = admins.map(admin => `
                    <div class="admin-admin">
                        <div class="admin-info">
                            <h4>${admin.username}</h4>
                            <div class="admin-role">${admin.role}</div>
                        </div>
                        <div class="admin-actions">
                            ${admin.username !== 'sara' ? `
                                <button class="btn btn-danger" onclick="Admin.deleteAdmin('${admin.id}')">Excluir</button>
                            ` : `
                                <small>Administrador principal</small>
                            `}
                        </div>
                    </div>
                `).join('');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erro ao carregar administradores:', error);
        }
    },

    // Show add admin modal
    showAddAdmin: () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content admin-modal">
                <div class="modal-header">
                    <h3>Adicionar Administrador</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <form id="add-admin-form">
                    <div class="form-group">
                        <label for="admin-username">Nome de Usuário</label>
                        <input type="text" id="admin-username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="admin-password">Senha</label>
                        <input type="password" id="admin-password" name="password" required>
                    </div>
                    <div class="form-group">
                        <label for="admin-role">Função</label>
                        <select id="admin-role" name="role" required>
                            <option value="admin">Administrador</option>
                            <option value="manager">Gerente</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Adicionar</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Handle form submission
        modal.querySelector('#add-admin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newAdmin = {
                username: formData.get('username'),
                password: formData.get('password'),
                role: formData.get('role')
            };

            try {
                const response = await API.admin.createAdmin(newAdmin);
                
                if (response.success) {
                    Admin.loadAdmins();
                    Utils.showMessage('Administrador adicionado com sucesso!');
                    modal.remove();
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                Utils.showMessage('Erro ao adicionar administrador: ' + error.message, 'error');
            }
        });
    },

    // Delete admin
    deleteAdmin: async (adminId) => {
        if (confirm('Tem certeza que deseja excluir este administrador?')) {
            try {
                const response = await API.admin.deleteAdmin(adminId);
                
                if (response.success) {
                    Admin.loadAdmins();
                    Utils.showMessage('Administrador excluído com sucesso!');
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                Utils.showMessage('Erro ao excluir administrador: ' + error.message, 'error');
            }
        }
    },

    // Load configuration
    loadConfig: async () => {
        const deliveryPriceInput = document.getElementById('delivery-price');
        if (!deliveryPriceInput) return;

        try {
            const response = await API.config.get('delivery_fee');
            if (response.success && response.data.delivery_fee) {
                deliveryPriceInput.value = response.data.delivery_fee;
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    },

    // Update delivery price
    updateDeliveryPrice: async () => {
        const deliveryPriceInput = document.getElementById('delivery-price');
        const newPrice = parseFloat(deliveryPriceInput.value) || 0;

        try {
            const response = await API.config.set('delivery_fee', newPrice.toString());
            
            if (response.success) {
                Utils.showMessage('Valor da entrega atualizado com sucesso!');
                // Update cart delivery fee
                Cart.deliveryFee = newPrice;
                Cart.updateCartSummary();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            Utils.showMessage('Erro ao atualizar valor da entrega: ' + error.message, 'error');
        }
    }
};

// Global functions
function showAdminSection(section) {
    Admin.currentSection = section;
    
    // Update active button
    document.querySelectorAll('.admin-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`admin-${section}`).style.display = 'block';
    
    // Load section data
    switch (section) {
        case 'pedidos':
            Admin.loadOrders();
            break;
        case 'produtos':
            Admin.loadProducts();
            break;
        case 'administradores':
            Admin.loadAdmins();
            break;
        case 'configuracoes':
            Admin.loadConfig();
            break;
    }
}

function showAddProduct() {
    Admin.showAddProduct();
}

function showAddAdmin() {
    Admin.showAddAdmin();
}

function updateDeliveryPrice() {
    Admin.updateDeliveryPrice();
}

// Initialize admin when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-page')) {
        Admin.init();
    }
});