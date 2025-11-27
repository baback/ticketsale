// Admin Settings

async function loadDatabaseStats() {
    try {
        // Count users
        const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        // Count events
        const { count: eventsCount } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true });
        
        // Count orders
        const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });
        
        // Count tickets
        const { count: ticketsCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true });

        document.getElementById('dbUsers').textContent = usersCount || 0;
        document.getElementById('dbEvents').textContent = eventsCount || 0;
        document.getElementById('dbOrders').textContent = ordersCount || 0;
        document.getElementById('dbTickets').textContent = ticketsCount || 0;
    } catch (error) {
        console.error('Error loading database stats:', error);
    }
}

function clearCache() {
    if (confirm('This will clear your browser cache and reload the page. Continue?')) {
        // Clear localStorage
        const keysToKeep = ['sb-ltvesfeyxyxdzyuqtrmr-auth-token'];
        const storage = {};
        keysToKeep.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) storage[key] = value;
        });
        
        localStorage.clear();
        
        Object.keys(storage).forEach(key => {
            localStorage.setItem(key, storage[key]);
        });
        
        // Reload
        window.location.reload(true);
    }
}

function openConsole() {
    alert('Press F12 or right-click and select "Inspect" to open the browser console.');
}

// Make functions global
window.clearCache = clearCache;
window.openConsole = openConsole;

// Initialize
loadDatabaseStats();
