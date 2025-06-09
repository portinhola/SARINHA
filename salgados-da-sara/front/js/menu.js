// Menu Module
const Menu = {
    items: [],
    currentFilter: 'todos',
    currentItem: null,

    // Initialize menu
    init: async () => {
        await Menu.loadMenuItems();
        Menu.setupQuantityModal();
    },

    // Load menu items from API
    loadMenuItems: async () => {
        const menuItemsEl = document.getElementById('menu-items');
        if (!menuItemsEl) return;

        try {
            const response = await API.products.getAll();
            
            if (response.success) {
                Menu.items = response.data;
                Menu.renderMenuItems();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            menuItemsEl.innerHTML = `
                <div class="menu-empty">
                    <h3>Erro ao carregar produtos</h3>
                    <p>Verifique se o backend está rodando. ${error.message}</p>
                    <button class="btn btn-primary" onclick="Menu.loadMenuItems()">Tentar Novamente</button>
                </div>
            `;
        }
    },

    // Render menu items
    renderMenuItems: () => {
        const menuItemsEl = document.getElementById('menu-items');
        if (!menuItemsEl) return;

        // Filter items
        const filteredItems = Menu.currentFilter === 'todos' 
            ? Menu.items 
            : Menu.items.filter(item => item.category === Menu.currentFilter);

        if (filteredItems.length === 0) {
            menuItemsEl.innerHTML = `
                <div class="menu-empty">
                    <h3>Nenhum item encontrado</h3>
                    <p>Não há itens nesta categoria no momento.</p>
                </div>
            `;
            return;
        }

        menuItemsEl.innerHTML = filteredItems.map(item => `
            <div class="menu-item" onclick="Menu.selectItem(${item.id})">
                <h3>${item.name}</h3>
                <div class="price">
                    ${item.is_portioned ? Utils.formatCurrency(item.price) : Utils.formatCurrency(item.price) + ' / cento'}
                </div>
                <div class="category">${Menu.getCategoryName(item.category)}</div>
                ${item.description ? `<div class="description">${item.description}</div>` : ''}
            </div>
        `).join('');
    },

    // Get category display name
    getCategoryName: (category) => {
        const names = {
            'salgados': 'Salgados Fritos',
            'sortidos': 'Sortidos',
            'assados': 'Assados',
            'especiais': 'Especiais',
            'opcionais': 'Opcionais'
        };
        return names[category] || category;
    },

    // Filter menu
    filterMenu: (category) => {
        Menu.currentFilter = category;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        Menu.renderMenuItems();
    },

    // Select menu item
    selectItem: (itemId) => {
        // Check if user is logged in before allowing to add items
        if (!Auth.isLoggedIn()) {
            App.showAuthPages();
            Utils.showMessage('Você precisa fazer login para adicionar itens ao carrinho!', 'error');
            return;
        }

        Menu.currentItem = Menu.items.find(item => item.id === itemId);
        
        if (Menu.currentItem) {
            if (Menu.currentItem.is_portioned) {
                // For portioned items, add directly to cart
                Cart.addItem({
                    ...Menu.currentItem,
                    quantityType: 'porção',
                    unitCount: 1,
                    totalPrice: Menu.currentItem.price
                });
                Utils.showMessage(`${Menu.currentItem.name} adicionado ao carrinho!`);
            } else {
                Menu.showQuantityModal();
            }
        }
    },

    // Show quantity selection modal
    showQuantityModal: () => {
        if (!Menu.currentItem) return;

        const modal = document.getElementById('quantity-modal');
        const itemName = document.getElementById('modal-item-name');
        const priceCento = document.getElementById('price-cento');
        const priceMeioCento = document.getElementById('price-meio-cento');
        const priceUnidade = document.getElementById('price-unidade');
        const unitQuantity = document.getElementById('unit-quantity');
        const unitCount = document.getElementById('unit-count');

        // Set item name
        itemName.textContent = Menu.currentItem.name;

        // Set prices
        priceCento.textContent = Utils.formatCurrency(Menu.currentItem.price);
        priceMeioCento.textContent = Utils.formatCurrency(Menu.currentItem.price / 2);
        priceUnidade.textContent = Utils.formatCurrency(Menu.currentItem.price / 100);

        // Reset form
        document.querySelector('input[name="quantity-type"][value="cento"]').checked = true;
        unitCount.value = 10;
        unitQuantity.style.display = 'none';

        // Show modal
        modal.style.display = 'flex';
    },

    // Setup quantity modal events
    setupQuantityModal: () => {
        // Handle quantity type change
        document.querySelectorAll('input[name="quantity-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const unitQuantity = document.getElementById('unit-quantity');
                if (e.target.value === 'unidade') {
                    unitQuantity.style.display = 'block';
                } else {
                    unitQuantity.style.display = 'none';
                }
            });
        });

        // Handle unit count change
        document.getElementById('unit-count').addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            if (count < 10) {
                e.target.value = 10;
            }
        });
    }
};

// Global functions
function filterMenu(category) {
    Menu.currentFilter = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    const activeBtn = Array.from(document.querySelectorAll('.category-btn')).find(btn => 
        btn.textContent.toLowerCase().includes(category) || 
        (category === 'todos' && btn.textContent === 'TODOS')
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    Menu.renderMenuItems();
}

function closeModal() {
    document.getElementById('quantity-modal').style.display = 'none';
    Menu.currentItem = null;
}

function addToCart() {
    if (!Menu.currentItem) return;

    const quantityType = document.querySelector('input[name="quantity-type"]:checked').value;
    const unitCount = parseInt(document.getElementById('unit-count').value) || 10;

    const cartItem = {
        ...Menu.currentItem,
        quantityType: quantityType,
        unitCount: quantityType === 'unidade' ? unitCount : 1,
        totalPrice: Utils.calculateItemPrice(Menu.currentItem.price, quantityType, unitCount)
    };

    Cart.addItem(cartItem);
    closeModal();
    
    const quantityLabel = Utils.getQuantityLabel(quantityType, unitCount);
    Utils.showMessage(`${Menu.currentItem.name} (${quantityLabel}) adicionado ao carrinho!`);
}

// Initialize menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('menu-items')) {
        Menu.init();
    }
});