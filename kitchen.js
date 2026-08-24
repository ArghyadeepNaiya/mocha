document.addEventListener('DOMContentLoaded', () => {
    
    // --- Clock & Time ---
    function updateClock() {
        const now = new Date();
        document.getElementById('real-time-clock').textContent = now.toLocaleTimeString();
        updateElapsedTimes();
    }
    setInterval(updateClock, 1000);
    
    function getElapsedTime(timestamp) {
        const diffMs = Date.now() - timestamp;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        return `${diffMins}m ago`;
    }

    function updateElapsedTimes() {
        document.querySelectorAll('.time-elapsed').forEach(el => {
            const timestamp = parseInt(el.getAttribute('data-timestamp'));
            if (timestamp) {
                el.textContent = getElapsedTime(timestamp);
            }
        });
    }

    // --- State ---
    let currentFilter = 'pending';
    const container = document.getElementById('orders-container');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // --- Core Logic ---
    function getOrders() {
        try {
            return JSON.parse(localStorage.getItem('mochaKitchenOrders')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveOrders(orders) {
        localStorage.setItem('mochaKitchenOrders', JSON.stringify(orders));
    }

    function purgeOldOrders(orders) {
        const todayDate = new Date().toDateString();
        // Keep only orders from today
        return orders.filter(o => o.date === todayDate);
    }

    function renderOrders() {
        let orders = getOrders();
        
        // Auto-purge old ones
        const originalLength = orders.length;
        orders = purgeOldOrders(orders);
        if (orders.length !== originalLength) {
            saveOrders(orders);
        }

        // Filter
        const filteredOrders = orders.filter(o => o.status === currentFilter);
        
        // Sort: oldest first for pending, newest first for completed
        filteredOrders.sort((a, b) => {
            if (currentFilter === 'pending') return a.timestamp - b.timestamp;
            return b.timestamp - a.timestamp;
        });

        container.innerHTML = '';

        if (filteredOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h2>No ${currentFilter} orders</h2>
                    <p>When new orders arrive, they will appear here instantly.</p>
                </div>
            `;
            return;
        }

        filteredOrders.forEach(order => {
            const timeStr = new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const card = document.createElement('div');
            card.className = 'order-card grid-item'; // Added grid-item for GSAP
            
            let itemsHtml = order.items.map(i => `
                <li class="item">
                    <span class="item-qty">${i.quantity}</span>
                    <span class="item-name">${i.name}</span>
                </li>
            `).join('');

            const headerClass = order.status === 'completed' ? 'order-header completed' : 'order-header';
            
            card.innerHTML = `
                <div class="${headerClass}">
                    <div class="table-info">
                        <h3 class="table-name">Table ${order.tableNumber}</h3>
                        <span class="device-info">Device: ${order.deviceId}</span>
                    </div>
                    <div class="time-container">
                        <div class="time-info">${timeStr}</div>
                        <div class="time-elapsed" data-timestamp="${order.timestamp}">${getElapsedTime(order.timestamp)}</div>
                    </div>
                </div>
                <div class="order-body">
                    <ul class="item-list">
                        ${itemsHtml}
                    </ul>
                </div>
                ${order.status === 'pending' ? `
                    <div class="order-footer">
                        <button class="complete-btn" data-id="${order.id}">Mark Completed</button>
                    </div>
                ` : ''}
            `;
            container.appendChild(card);
        });

        // Add listeners to complete buttons
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                markOrderCompleted(id);
            });
        });
        
        // --- GSAP Animation ---
        if (typeof gsap !== 'undefined') {
            gsap.from('.grid-item', { 
                opacity: 0, 
                scale: 0.92, 
                y: 16, 
                duration: 0.4, 
                stagger: { each: 0.06, from: 'start', grid: 'auto' }, 
                ease: 'back.out(1.4)' 
            });
        }
    }

    function markOrderCompleted(id) {
        let orders = getOrders();
        let order = orders.find(o => o.id === id);
        if (order) {
            order.status = 'completed';
            order.timestamp = Date.now(); // update time to completion time for sorting
            saveOrders(orders);
            renderOrders();
        }
    }

    // --- Event Listeners ---
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderOrders();
        });
    });

    // Listen for cross-tab updates (when order placed in another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'mochaKitchenOrders') {
            renderOrders();
        }
    });

    // Initial Render
    renderOrders();
    updateClock(); // Set initial clock immediately
});
