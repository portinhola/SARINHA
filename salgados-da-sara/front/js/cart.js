// Cart Module
const Cart = {
    items: [],
    deliveryFee: 10.00,

    // Initialize cart
    init: async () => {
        Cart.loadCart();
        Cart.updateCartCount();
        Cart.setupDeliveryOptions();
        await Cart.loadDeliveryFee();
    },

    // Load delivery fee from API
    loadDeliveryFee: async () => {
        try {
            const response = await API.config.get('delivery_fee');
            if (response.success && response.data.delivery_fee) {
                Cart.deliveryFee = parseFloat(response.data.delivery_fee);
            }
        } catch (error) {
            console.error('Erro ao carregar taxa de entrega:', error);
        }
    },

    // Load cart from localStorage (mantém funcionalidade local)
    loadCart: () => {
        Cart.items = Utils.storage.get('cart') || [];
        Cart.renderCart();
        Cart.updateCartCount();
        Cart.updateCartSummary();
    },

    // Save cart to localStorage
    saveCart: () => {
        Utils.storage.set('cart', Cart.items);
        Cart.updateCartCount();
    },

    // Add item to cart
    addItem: (item) => {
        // Check if item already exists in cart
        const existingItemIndex = Cart.items.findIndex(cartItem => 
            cartItem.id === item.id && 
            cartItem.quantityType === item.quantityType &&
            cartItem.unitCount === item.unitCount
        );

        if (existingItemIndex >= 0) {
            // Update quantity
            Cart.items[existingItemIndex].quantity = (Cart.items[existingItemIndex].quantity || 1) + 1;
            Cart.items[existingItemIndex].totalPrice = Cart.items[existingItemIndex].totalPrice + item.totalPrice;
        } else {
            // Add new item
            Cart.items.push({
                ...item,
                cartId: Utils.generateId(),
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }

        Cart.saveCart();
        Cart.renderCart();
        Cart.updateCartSummary();
    },

    // Remove item from cart
    removeItem: (cartId) => {
        Cart.items = Cart.items.filter(item => item.cartId !== cartId);
        Cart.saveCart();
        Cart.renderCart();
        Cart.updateCartSummary();
        Utils.showMessage('Item removido do carrinho!');
    },

    // Update item quantity
    updateQuantity: (cartId, change) => {
        const item = Cart.items.find(item => item.cartId === cartId);
        if (!item) return;

        const newQuantity = (item.quantity || 1) + change;
        
        if (newQuantity <= 0) {
            Cart.removeItem(cartId);
            return;
        }

        // Calculate base price per unit
        const basePrice = item.totalPrice / (item.quantity || 1);
        
        item.quantity = newQuantity;
        item.totalPrice = basePrice * newQuantity;

        Cart.saveCart();
        Cart.renderCart();
        Cart.updateCartSummary();
    },

    // Update cart count in navbar
    updateCartCount: () => {
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            const totalItems = Cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
            cartCountEl.textContent = totalItems;
            cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    },

    // Render cart items
    renderCart: () => {
        const cartItemsEl = document.getElementById('cart-items');
        if (!cartItemsEl) return;

        if (Cart.items.length === 0) {
            cartItemsEl.innerHTML = `
                <div class="cart-empty">
                    <h3>Seu carrinho está vazio</h3>
                    <p>Adicione alguns itens deliciosos do nosso cardápio!</p>
                    <button class="btn btn-primary" onclick="showPage('cardapio')">Ver Cardápio</button>
                </div>
            `;
            return;
        }

        cartItemsEl.innerHTML = Cart.items.map(item => `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <div class="quantity-type">
                            ${Utils.getQuantityLabel(item.quantityType, item.unitCount)}
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="Cart.updateQuantity('${item.cartId}', -1)">-</button>
                            <span class="quantity-display">${item.quantity || 1}</span>
                            <button class="quantity-btn" onclick="Cart.updateQuantity('${item.cartId}', 1)">+</button>
                        </div>
                        <button class="remove-btn" onclick="Cart.removeItem('${item.cartId}')">Remover</button>
                    </div>
                </div>
                <div class="cart-item-details">
                    <div class="unit-price">
                        ${Utils.formatCurrency(item.totalPrice / (item.quantity || 1))} cada
                    </div>
                    <div class="total-price">
                        ${Utils.formatCurrency(item.totalPrice)}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Setup delivery options
    setupDeliveryOptions: () => {
        const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
        deliveryOptions.forEach(option => {
            option.addEventListener('change', () => {
                Cart.updateCartSummary();
            });
        });
    },

    // Update cart summary
    updateCartSummary: () => {
        const subtotalEl = document.getElementById('subtotal');
        const deliveryFeeEl = document.getElementById('delivery-fee');
        const totalEl = document.getElementById('total');
        const continueBtn = document.getElementById('continue-btn');

        if (!subtotalEl) return;

        const subtotal = Cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const isDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'delivery';
        const deliveryFee = isDelivery ? Cart.deliveryFee : 0;
        const total = subtotal + deliveryFee;

        subtotalEl.textContent = Utils.formatCurrency(subtotal);
        deliveryFeeEl.textContent = Utils.formatCurrency(deliveryFee);
        totalEl.textContent = Utils.formatCurrency(total);

        // Enable/disable continue button
        if (continueBtn) {
            continueBtn.disabled = Cart.items.length === 0;
            continueBtn.style.opacity = Cart.items.length === 0 ? '0.5' : '1';
        }
    },

    // Clear cart
    clearCart: () => {
        Cart.items = [];
        Cart.saveCart();
        Cart.renderCart();
        Cart.updateCartSummary();
    },

    // Get order summary
    getOrderSummary: () => {
        const subtotal = Cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const isDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'delivery';
        const deliveryFee = isDelivery ? Cart.deliveryFee : 0;
        const total = subtotal + deliveryFee;
        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cash';

        return {
            items: Cart.items,
            subtotal,
            deliveryFee,
            total,
            isDelivery,
            paymentMethod,
            itemCount: Cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
        };
    }
};

// Global functions
function showPayment() {
    if (Cart.items.length === 0) {
        Utils.showMessage('Seu carrinho está vazio!', 'error');
        return;
    }
    
    showPage('payment');
}

async function finalizeOrder() {
    if (Cart.items.length === 0) {
        Utils.showMessage('Seu carrinho está vazio!', 'error');
        return;
    }

    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        Utils.showMessage('Você precisa estar logado para finalizar o pedido!', 'error');
        return;
    }

    const orderSummary = Cart.getOrderSummary();
    
    // Create order data for API
    const orderData = {
        user_id: currentUser.id,
        customer_data: {
            name: currentUser.name,
            phone: currentUser.phone,
            email: currentUser.email,
            address: currentUser.address,
            number: currentUser.number,
            complement: currentUser.complement,
            city: currentUser.city
        },
        items: orderSummary.items,
        subtotal: orderSummary.subtotal,
        delivery_fee: orderSummary.deliveryFee,
        total: orderSummary.total,
        is_delivery: orderSummary.isDelivery,
        payment_method: orderSummary.paymentMethod
    };

    try {
        Utils.setLoading(true);
        const response = await API.orders.create(orderData);
        
        if (response.success) {
            // Clear cart
            Cart.clearCart();

            // Show success message
            Utils.showMessage(`Pedido ${response.order_number} realizado com sucesso!`);
            
            // Redirect to history
            setTimeout(() => {
                showPage('historico');
            }, 2000);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        Utils.showMessage('Erro ao finalizar pedido: ' + error.message, 'error');
    } finally {
        Utils.setLoading(false);
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Cart.init();
});