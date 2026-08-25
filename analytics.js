// analytics.js - Core tracking engine for Mocha POS

const Analytics = (function() {
    const STORAGE_KEY = 'mochaLifetimeAnalytics';
    
    // Initialize or get DB
    function getDB() {
        try {
            let db = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!db) throw new Error("Empty DB");
            return db;
        } catch (e) {
            return {
                users: {},
                globalItemFrequencies: {},
                frequentlyBoughtTogether: {}
            };
        }
    }

    function saveDB(db) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
    
    function getDeviceId() {
        let id = localStorage.getItem('mochaDeviceId');
        if (!id) {
            id = Math.random().toString(36).substring(2, 8).toUpperCase();
            localStorage.setItem('mochaDeviceId', id);
        }
        return id;
    }

    // Ensure user exists in DB
    function ensureUser(db, deviceId) {
        if (!db.users[deviceId]) {
            db.users[deviceId] = {
                firstVisit: Date.now(),
                lastVisit: Date.now(),
                totalSpent: 0,
                totalTimeSeconds: 0,
                visits: [Date.now()],
                orders: [],
                itemFrequencies: {}
            };
        } else {
            db.users[deviceId].lastVisit = Date.now();
            // Add new visit if last visit was > 1 hour ago
            const lastV = db.users[deviceId].visits[db.users[deviceId].visits.length - 1] || 0;
            if (Date.now() - lastV > 3600000) {
                db.users[deviceId].visits.push(Date.now());
            }
        }
    }

    // Session time tracking
    let sessionStart = Date.now();
    window.addEventListener('beforeunload', () => {
        const db = getDB();
        const deviceId = getDeviceId();
        ensureUser(db, deviceId);
        
        const sessionDurationSeconds = Math.floor((Date.now() - sessionStart) / 1000);
        db.users[deviceId].totalTimeSeconds += sessionDurationSeconds;
        saveDB(db);
    });

    return {
        getDB,
        getDeviceId,
        logOrder: function(orderItems, orderTotalStr, orderId) {
            const db = getDB();
            const deviceId = getDeviceId();
            ensureUser(db, deviceId);
            
            // Parse total (remove symbols)
            const numericTotal = parseFloat(orderTotalStr.replace(/[^0-9.]/g, '')) || 0;
            
            const newOrder = {
                id: orderId,
                items: orderItems,
                total: numericTotal,
                timestamp: Date.now(),
                status: 'completed'
            };
            
            db.users[deviceId].orders.push(newOrder);
            db.users[deviceId].totalSpent += numericTotal;
            
            // Item frequencies
            const itemNames = [];
            orderItems.forEach(item => {
                const qty = item.quantity || 1;
                const name = item.name;
                itemNames.push(name);
                
                // User freq
                db.users[deviceId].itemFrequencies[name] = (db.users[deviceId].itemFrequencies[name] || 0) + qty;
                // Global freq
                db.globalItemFrequencies[name] = (db.globalItemFrequencies[name] || 0) + qty;
            });
            
            // Frequently bought together (Pairs)
            // Generate all unique pairs from this order
            const uniqueItems = [...new Set(itemNames)];
            for (let i = 0; i < uniqueItems.length; i++) {
                for (let j = i + 1; j < uniqueItems.length; j++) {
                    // Sort alphabetically to ensure A|B is same as B|A
                    const pair = [uniqueItems[i], uniqueItems[j]].sort().join('|');
                    db.frequentlyBoughtTogether[pair] = (db.frequentlyBoughtTogether[pair] || 0) + 1;
                }
            }
            
            saveDB(db);
        },
        
        logCancellation: function(orderId) {
            const db = getDB();
            const deviceId = getDeviceId();
            if (db.users[deviceId]) {
                const order = db.users[deviceId].orders.find(o => o.id === orderId);
                if (order && order.status !== 'cancelled') {
                    order.status = 'cancelled';
                    db.users[deviceId].totalSpent -= order.total;
                    
                    // Deduct frequencies
                    order.items.forEach(item => {
                        const qty = item.quantity || 1;
                        const name = item.name;
                        
                        db.users[deviceId].itemFrequencies[name] = Math.max(0, (db.users[deviceId].itemFrequencies[name] || 0) - qty);
                        db.globalItemFrequencies[name] = Math.max(0, (db.globalItemFrequencies[name] || 0) - qty);
                    });
                    
                    // Deduct pairs
                    const uniqueItems = [...new Set(order.items.map(i => i.name))];
                    for (let i = 0; i < uniqueItems.length; i++) {
                        for (let j = i + 1; j < uniqueItems.length; j++) {
                            const pair = [uniqueItems[i], uniqueItems[j]].sort().join('|');
                            db.frequentlyBoughtTogether[pair] = Math.max(0, (db.frequentlyBoughtTogether[pair] || 0) - 1);
                        }
                    }
                    saveDB(db);
                }
            }
        },
        
        getSuggestionsForCart: function(cartItemNames) {
            const db = getDB();
            let suggestions = {};
            
            // For each item in cart, look at pairs
            cartItemNames.forEach(cartItem => {
                for (const [pair, count] of Object.entries(db.frequentlyBoughtTogether)) {
                    const items = pair.split('|');
                    if (items.includes(cartItem)) {
                        const otherItem = items.find(i => i !== cartItem);
                        // If other item is not already in cart
                        if (!cartItemNames.includes(otherItem)) {
                            suggestions[otherItem] = (suggestions[otherItem] || 0) + count;
                        }
                    }
                }
            });
            
            // Sort by highest count
            return Object.entries(suggestions)
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);
        },
        
        getUserFavorites: function() {
            const db = getDB();
            const deviceId = getDeviceId();
            if (!db.users[deviceId]) return [];
            
            return Object.entries(db.users[deviceId].itemFrequencies)
                .filter(entry => entry[1] > 0)
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);
        }
    };
})();
