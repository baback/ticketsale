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

        // Create table
        const tableHtml = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-neutral-200 dark:border-neutral-800">
                            <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Customer</th>
                            <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Event</th>
                            <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                            <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                            <th class="text-right py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => {
                            const date = new Date(order.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            const statusColors = {
                                completed: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                                pending: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                                failed: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                            };

                            return `
                                <tr class="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                    <td class="py-4 px-4">
                                        <div class="font-medium">${order.customer_name || 'Guest'}</div>
                                        <div class="text-sm text-neutral-600 dark:text-neutral-400">${order.customer_email}</div>
                                    </td>
                                    <td class="py-4 px-4 text-sm">${order.events?.title || 'Unknown Event'}</td>
                                    <td class="py-4 px-4 text-sm text-neutral-600 dark:text-neutral-400">${date}</td>
                                    <td class="py-4 px-4">
                                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending}">
                                            ${order.status}
                                        </span>
                                    </td>
                                    <td class="py-4 px-4 text-right font-semibold">$${parseFloat(order.total).toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = tableHtml;

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
