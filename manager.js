document.addEventListener('DOMContentLoaded', () => {
    
    let db;
    let itemsChart;

    function loadData() {
        if (typeof Analytics !== 'undefined') {
            db = Analytics.getDB();
            renderDashboard();
        }
    }

    function renderDashboard() {
        if (!db) return;

        let totalRevenue = 0;
        let totalOrders = 0;
        let cancelledOrders = 0;
        let totalTimeSecs = 0;
        let userCount = Object.keys(db.users).length;

        const tableBody = document.getElementById('user-table-body');
        tableBody.innerHTML = '';

        Object.entries(db.users).forEach(([deviceId, user]) => {
            totalRevenue += user.totalSpent;
            
            let userOrders = 0;
            user.orders.forEach(o => {
                if (o.status === 'completed') {
                    userOrders++;
                    totalOrders++;
                } else if (o.status === 'cancelled') {
                    cancelledOrders++;
                }
            });

            totalTimeSecs += user.totalTimeSeconds;

            // Render Table Row
            const tr = document.createElement('tr');
            const avgSession = user.visits.length > 0 ? Math.floor((user.totalTimeSeconds / user.visits.length) / 60) : 0;
            
            tr.innerHTML = `
                <td><strong>${deviceId}</strong></td>
                <td>${new Date(user.firstVisit).toLocaleDateString()}</td>
                <td>${new Date(user.lastVisit).toLocaleDateString()}</td>
                <td>${userOrders}</td>
                <td>₹${user.totalSpent}</td>
                <td>${avgSession}m</td>
            `;
            tr.addEventListener('click', () => openUserModal(deviceId, user));
            tableBody.appendChild(tr);
        });

        // Top Metrics
        document.getElementById('metric-revenue').textContent = `₹${totalRevenue}`;
        document.getElementById('metric-orders').textContent = totalOrders;
        document.getElementById('metric-cancelled').textContent = `${cancelledOrders} Cancelled`;
        document.getElementById('metric-users').textContent = userCount;
        
        let avgTimeGlobal = userCount > 0 ? Math.floor((totalTimeSecs / userCount) / 60) : 0;
        document.getElementById('metric-time').textContent = `${avgTimeGlobal}m`;

        // Chart: Most Ordered Items
        renderChart(db.globalItemFrequencies);

        // Freq Bought Together List
        const freqList = document.getElementById('freq-pairs-list');
        freqList.innerHTML = '';
        
        const sortedPairs = Object.entries(db.frequentlyBoughtTogether)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // top 5

        if (sortedPairs.length === 0) {
            freqList.innerHTML = '<li><span style="color:#64748b">No data yet</span></li>';
        } else {
            sortedPairs.forEach(([pair, count]) => {
                const names = pair.split('|').join(' + ');
                freqList.innerHTML += `
                    <li>
                        <span>${names}</span>
                        <span class="pair-count">${count}x</span>
                    </li>
                `;
            });
        }
    }

    function renderChart(itemFreq) {
        const ctx = document.getElementById('topItemsChart').getContext('2d');
        
        // Sort and get top 7 items
        const sortedItems = Object.entries(itemFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7);
            
        const labels = sortedItems.map(i => i[0]);
        const data = sortedItems.map(i => i[1]);

        if (itemsChart) itemsChart.destroy();

        itemsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Ordered',
                    data: data,
                    backgroundColor: '#78350f',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Modal Logic
    const modal = document.getElementById('user-modal');
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.remove('active');
    });

    function openUserModal(deviceId, user) {
        document.getElementById('modal-device-id').textContent = `Device: ${deviceId}`;
        document.getElementById('modal-spent').textContent = `₹${user.totalSpent}`;
        
        let completedCount = user.orders.filter(o => o.status === 'completed').length;
        document.getElementById('modal-orders').textContent = completedCount;
        
        document.getElementById('modal-time').textContent = `${Math.floor(user.totalTimeSeconds / 60)}m`;

        // Favorites
        const favList = document.getElementById('modal-favorites');
        favList.innerHTML = '';
        const sortedFavs = Object.entries(user.itemFrequencies)
            .filter(i => i[1] > 0)
            .sort((a, b) => b[1] - a[1]);
            
        if (sortedFavs.length === 0) favList.innerHTML = '<li>No favorites yet.</li>';
        sortedFavs.forEach(([item, count]) => {
            favList.innerHTML += `<li><span>${item}</span> <strong>${count}</strong></li>`;
        });

        // History
        const historyDiv = document.getElementById('modal-history');
        historyDiv.innerHTML = '';
        if (user.orders.length === 0) historyDiv.innerHTML = 'No order history.';
        
        // sort newest first
        const sortedOrders = [...user.orders].sort((a,b) => b.timestamp - a.timestamp);
        
        sortedOrders.forEach(o => {
            const isCancelled = o.status === 'cancelled';
            const dateStr = new Date(o.timestamp).toLocaleString();
            let itemsStr = o.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
            
            historyDiv.innerHTML += `
                <div class="history-item ${isCancelled ? 'cancelled' : ''}">
                    <div class="h-head">
                        <span>${isCancelled ? 'CANCELLED' : '₹' + o.total}</span>
                        <span class="h-date">${dateStr}</span>
                    </div>
                    <div style="font-size:0.9rem; color:#64748b">${itemsStr}</div>
                </div>
            `;
        });

        modal.classList.add('active');
    }

    document.getElementById('refresh-btn').addEventListener('click', loadData);

    // Initial Load
    loadData();
});
