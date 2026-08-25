// cart.js

let cart = [];
let currentItemForModal = null;
let currentModalQty = 1;
const taxRate = 0.05;

document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Modal Elements
    const modal = document.getElementById('customization-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalItemName = document.getElementById('modal-item-name');
    const modalItemImg = document.getElementById('modal-item-img');
    const modalItemIngredients = document.getElementById('modal-item-ingredients');
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
    
    // Freq Bought Elements
    const freqBoughtSection = document.getElementById('cart-freq-bought-section');
    const freqBoughtItemsContainer = document.getElementById('freq-bought-items-container');

    // Setup Menu Item Click to Open Modal
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const menuItem = e.currentTarget;
            const name = menuItem.querySelector('.item-name').textContent;
            const priceText = menuItem.querySelector('.price').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            const imgSrc = menuItem.querySelector('.item-img').src;
            const ingredients = menuItem.getAttribute('data-ingredients') || 'Ingredients not available';
            const nutritionEl = menuItem.querySelector('.nutritional-overlay');
            const nutritionHtml = nutritionEl ? nutritionEl.innerHTML : '';
            
            openModal({ name, basePrice: price, image: imgSrc, ingredients: ingredients, nutritionHtml: nutritionHtml });
        });
    });

    // Modal Logic
    function openModal(item) {
        currentItemForModal = item;
        currentModalQty = 1;
        modalItemName.textContent = item.name;
        if (modalItemImg) modalItemImg.src = item.image;
        if (modalItemIngredients) modalItemIngredients.textContent = item.ingredients;
        
        const nutritionContainer = document.getElementById('modal-nutrition-container');
        if (nutritionContainer) {
            nutritionContainer.innerHTML = item.nutritionHtml || '';
        }

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
            image: currentItemForModal.image,
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
    function populateFreqBoughtItems() {
        const allItems = Array.from(document.querySelectorAll('.menu-item'));
        if (allItems.length === 0) return;
        
        let selected = [];
        
        if (typeof Analytics !== 'undefined') {
            const cartItemNames = cart.map(i => i.name);
            const suggestions = Analytics.getSuggestionsForCart(cartItemNames);
            
            // Find HTML elements for suggestions
            suggestions.forEach(suggestedName => {
                if (selected.length < 3) {
                    const itemEl = allItems.find(el => el.querySelector('.item-name').textContent === suggestedName);
                    if (itemEl && !cartItemNames.includes(suggestedName)) {
                        selected.push(itemEl);
                    }
                }
            });
        }
        
        // Fill remaining with random (not in cart, not already selected)
        if (selected.length < 3) {
            const cartNames = cart.map(i => i.name);
            const availableForRandom = allItems.filter(el => {
                const n = el.querySelector('.item-name').textContent;
                return !cartNames.includes(n) && !selected.includes(el);
            });
            const shuffled = availableForRandom.sort(() => 0.5 - Math.random());
            selected = [...selected, ...shuffled.slice(0, 3 - selected.length)];
        }
        
        freqBoughtItemsContainer.innerHTML = '';
        selected.forEach(item => {
            const name = item.querySelector('.item-name').textContent;
            const priceText = item.querySelector('.price').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            const imgSrc = item.querySelector('.item-img').src;
            const ingredients = item.getAttribute('data-ingredients') || 'Ingredients not available';
            
            const html = `
                <div class="freq-item">
                    <img src="${imgSrc}" class="freq-item-img" alt="${name}">
                    <div class="freq-item-info">
                        <h5 class="freq-item-name">${name}</h5>
                        <span class="freq-item-price">₹${price}</span>
                    </div>
                    <button class="freq-item-add-btn" onclick="window.addFreqItemToCart('${name.replace(/'/g, "\\'")}', ${price}, '${imgSrc}', '${ingredients.replace(/'/g, "\\'")}')">ADD</button>
                </div>
            `;
            freqBoughtItemsContainer.insertAdjacentHTML('beforeend', html);
        });
        freqBoughtSection.style.display = 'block';
    }

    window.addFreqItemToCart = function(name, price, image, ingredients) {
        openModal({ name, basePrice: price, image, ingredients });
    };

    function openCart() {
        if (cart.length > 0) {
            populateFreqBoughtItems();
        } else {
            freqBoughtSection.style.display = 'none';
        }
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
            freqBoughtSection.style.display = 'none';
            return;
        }

        placeOrderBtn.disabled = false;
        freqBoughtSection.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.unitPrice * item.quantity;
            subtotal += itemTotal;
            
            const addonsText = item.addons.length > 0 ? `Add-ons: ${item.addons.join(', ')}` : '';
            const instText = item.instructions ? `Note: ${item.instructions}` : '';
            
            const html = `
                <div class="cart-item">
                    <img class="cart-item-img" src="${item.image}" alt="${item.name}" />
                    <div class="cart-item-details">
                        <div class="cart-item-header">
                            <h4 class="cart-item-title">${item.name}</h4>
                            <span class="cart-item-price">₹${itemTotal}</span>
                        </div>
                        ${addonsText ? `<div class="cart-item-addons">${addonsText}</div>` : ''}
                        ${instText ? `<div class="cart-item-addons" style="font-style: italic;">${instText}</div>` : ''}
                        
                        <div class="cart-item-controls">
                            <div class="quantity-controls small">
                                <button onclick="window.updateCartItemQty('${item.id}', -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="window.updateCartItemQty('${item.id}', 1)">+</button>
                            </div>
                            <button class="remove-item-btn" onclick="window.removeCartItem('${item.id}')">Remove</button>
                        </div>
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
        
        // --- Kitchen Dashboard Logic ---
        const deviceId = localStorage.getItem('mochaDeviceId') || 'UnknownDevice';
        const todayDate = new Date().toDateString();
        
        let kitchenOrders = [];
        try {
            kitchenOrders = JSON.parse(localStorage.getItem('mochaKitchenOrders')) || [];
        } catch (e) {
            kitchenOrders = [];
        }

        // Purge old orders (different day)
        kitchenOrders = kitchenOrders.filter(order => order.date === todayDate);

        // Find existing order for same table and device today
        let existingOrder = kitchenOrders.find(o => o.tableNumber === tableNumber && o.deviceId === deviceId && o.status === 'pending');

        let orderId = '';
        if (existingOrder) {
            // Merge items
            orderId = existingOrder.id;
            cart.forEach(cartItem => {
                let existingItem = existingOrder.items.find(i => i.name === cartItem.name);
                if (existingItem) {
                    existingItem.quantity += cartItem.quantity;
                } else {
                    existingOrder.items.push({...cartItem});
                }
            });
            existingOrder.timestamp = Date.now(); // update time to latest
        } else {
            // Create new order
            orderId = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            kitchenOrders.push({
                id: orderId,
                tableNumber: tableNumber,
                deviceId: deviceId,
                date: todayDate,
                timestamp: Date.now(),
                items: JSON.parse(JSON.stringify(cart)),
                status: 'pending'
            });
        }

        localStorage.setItem('mochaKitchenOrders', JSON.stringify(kitchenOrders));
        
        // --- Manager Analytics Logic ---
        if (typeof Analytics !== 'undefined') {
            // We store the current order id in session storage to cancel it later if needed
            sessionStorage.setItem('mochaLastOrderId', orderId);
            Analytics.logOrder(cart, grandTotal, orderId);
        }
        // --- End Kitchen Logic ---

        
        // Set 1 minute cancellation timer
        localStorage.setItem('mochaOrderCancelEndTime', Date.now() + 60000);
        window.dispatchEvent(new Event('orderPlaced'));
        
        // Reset Cart
        cart = [];
        updateCartUI();
        closeCart();
    });
});
