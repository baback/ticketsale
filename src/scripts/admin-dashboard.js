// Super Admin Dashboard Script

async function loadDashboardStats() {
    try {
        // Load total users
        const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('totalUsers').textContent = usersCount || 0;

        // Load total events
        const { count: eventsCount } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('totalEvents').textContent = eventsCount || 0;

        // Load total orders
        const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');
        
        document.getElementById('totalOrders').textContent = ordersCount || 0;

        // Load total revenue
        const { data: revenue } = await supabase
            .from('orders')
            .select('total')
            .eq('status', 'completed');
        
        const totalRevenue = revenue?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentActivity() {
    try {
        // Get recent orders
        const { data: orders } = await supabase
            .from('orders')
            .select(`
                id,
                created_at,
                total,
                status,
                customer_name,
                customer_email,
                events (title)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        const container = document.getElementById('recentActivity');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-neutral-500">No recent activity</div>';
            return;
        }

        container.innerHTML = orders.map(order => {
            const date = new Date(order.created_at).toLocaleString();
            const statusColors = {
                completed: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
                pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400',
                failed: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
            };

            return `
                <div class="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                    <div class="flex-1">
                        <div class="font-semibold mb-1">${order.customer_name || order.customer_email}</div>
                        <div class="text-sm text-neutral-600 dark:text-neutral-400">
                            ${order.events?.title || 'Unknown Event'} • ${date}
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending}">
                            ${order.status}
                        </span>
                        <div class="font-bold text-lg">$${parseFloat(order.total).toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading recent activity:', error);
        document.getElementById('recentActivity').innerHTML = 
            '<div class="text-center py-8 text-red-500">Error loading activity</div>';
    }
}

// Initialize dashboard
async function init() {
    await loadDashboardStats();
    await loadRecentActivity();
    
    // Refresh stats every 30 seconds
    setInterval(loadDashboardStats, 30000);
}

// Run on page load
init();
