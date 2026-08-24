// cart.js

let cart = [];
let currentItemForModal = null;
let currentModalQty = 1;
const taxRate = 0.05;

document.addEventListener('DOMContentLoaded', () => {
    const addBtns = document.querySelectorAll('.add-btn');
    
    // Modal Elements
    const modal = document.getElementById('customization-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalItemName = document.getElementById('modal-item-name');
    const modalQty = document.getElementById('modal-qty');
    const modalQtyMinus = document.getElementById('modal-qty-minus');
    const modalQtyPlus = document.getElementById('modal-qty-plus');
    const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');
    const modalTotalPrice = document.getElementById('modal-total-price');
    const addonCheckboxes = document.querySelectorAll('.addon-checkbox');
    const specialInstructions = document.getElementById('special-instructions');

    // Cart Elements
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const floatingCartBtn = document.getElementById('floating-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartBadge = document.getElementById('cart-badge');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartTaxesEl = document.getElementById('cart-taxes');
    const cartTotalEl = document.getElementById('cart-total');
    const placeOrderBtn = document.getElementById('place-order-btn');

    // Setup Add Buttons
    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            const name = menuItem.querySelector('.item-name').textContent;
            const priceText = menuItem.querySelector('.price').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            
            openModal({ name, basePrice: price });
        });
    });

    // Modal Logic
    function openModal(item) {
        currentItemForModal = item;
        currentModalQty = 1;
        modalItemName.textContent = item.name;
        modalQty.textContent = currentModalQty;
        specialInstructions.value = '';
        addonCheckboxes.forEach(cb => cb.checked = false);
        updateModalPrice();
        
        modal.classList.add('open');
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('open');
        modalOverlay.classList.remove('active');
        currentItemForModal = null;
    }

    function updateModalPrice() {
        if (!currentItemForModal) return;
        let addonsTotal = 0;
        addonCheckboxes.forEach(cb => {
            if (cb.checked) addonsTotal += parseInt(cb.dataset.price, 10);
        });
        const total = (currentItemForModal.basePrice + addonsTotal) * currentModalQty;
        modalTotalPrice.textContent = `₹${total}`;
    }

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    modalQtyMinus.addEventListener('click', () => {
        if (currentModalQty > 1) {
            currentModalQty--;
            modalQty.textContent = currentModalQty;
            updateModalPrice();
        }
    });

    modalQtyPlus.addEventListener('click', () => {
        currentModalQty++;
        modalQty.textContent = currentModalQty;
        updateModalPrice();
    });

    addonCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateModalPrice);
    });

    modalAddToCartBtn.addEventListener('click', () => {
        if (!currentItemForModal) return;
        
        const addons = [];
        let addonsTotal = 0;
        addonCheckboxes.forEach(cb => {
            if (cb.checked) {
                addons.push(cb.value);
                addonsTotal += parseInt(cb.dataset.price, 10);
            }
        });
        
        const instructions = specialInstructions.value.trim();
        
        const cartItem = {
            id: Date.now().toString(), // unique ID for this cart entry
            name: currentItemForModal.name,
            basePrice: currentItemForModal.basePrice,
            addons: addons,
            addonsTotal: addonsTotal,
            instructions: instructions,
            quantity: currentModalQty,
            unitPrice: currentItemForModal.basePrice + addonsTotal
        };
        
        cart.push(cartItem);
        updateCartUI();
        closeModal();
        
        // Slight animation on cart button
        floatingCartBtn.style.transform = 'scale(1.2)';
        setTimeout(() => floatingCartBtn.style.transform = '', 200);
    });

    // Cart Logic
    function openCart() {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('active');
    }

    function closeCart() {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('active');
    }

    floatingCartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function updateCartUI() {
        // Update badge
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 0) {
            cartBadge.style.display = 'flex';
            cartBadge.textContent = totalItems;
        } else {
            cartBadge.style.display = 'none';
        }

        // Render items
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty</div>';
            cartSubtotalEl.textContent = '₹0';
            cartTaxesEl.textContent = '₹0';
            cartTotalEl.textContent = '₹0';
            placeOrderBtn.disabled = true;
            return;
        }

        placeOrderBtn.disabled = false;
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.unitPrice * item.quantity;
            subtotal += itemTotal;
            
            const addonsText = item.addons.length > 0 ? `Add-ons: ${item.addons.join(', ')}` : '';
            const instText = item.instructions ? `Note: ${item.instructions}` : '';
            
            const html = `
                <div class="cart-item">
                    <div class="cart-item-header">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <span class="cart-item-price">₹${itemTotal}</span>
                    </div>
                    ${addonsText ? `<div class="cart-item-addons">${addonsText}</div>` : ''}
                    ${instText ? `<div class="cart-item-addons" style="font-style: italic;">${instText}</div>` : ''}
                    <div class="cart-item-actions">
                        <div class="qty-controls">
                            <button class="qty-btn" onclick="window.updateCartItemQty('${item.id}', -1)">-</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="window.updateCartItemQty('${item.id}', 1)">+</button>
                        </div>
                        <button class="remove-btn" onclick="window.removeCartItem('${item.id}')">Remove</button>
                    </div>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', html);
        });

        // Totals
        const taxes = Math.round(subtotal * taxRate);
        const grandTotal = subtotal + taxes;

        cartSubtotalEl.textContent = `₹${subtotal}`;
        cartTaxesEl.textContent = `₹${taxes}`;
        cartTotalEl.textContent = `₹${grandTotal}`;
    }

    // Global functions for inline HTML event handlers
    window.updateCartItemQty = function(id, change) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                window.removeCartItem(id);
            } else {
                updateCartUI();
            }
        }
    };

    window.removeCartItem = function(id) {
        cart = cart.filter(i => i.id !== id);
        updateCartUI();
    };

    // Place Order
    placeOrderBtn.addEventListener('click', () => {
        const tableNumber = sessionStorage.getItem('mochaTableNumber') || 'Takeaway/Unknown';
        
        const orderSummary = cart.map(i => `${i.quantity}x ${i.name}`).join('\n');
        const grandTotal = cartTotalEl.textContent;
        
        alert(`Order Placed for Table: ${tableNumber}!\n\nItems:\n${orderSummary}\n\nTotal: ${grandTotal}\n\nOur chef is preparing your meal.`);
        
        // Reset Cart
        cart = [];
        updateCartUI();
        closeCart();
    });
});
