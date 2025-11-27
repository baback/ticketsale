// Admin Analytics

let currentPeriod = 30;

async function loadAnalytics() {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - currentPeriod);

    try {
        // Load orders
        const { data: orders } = await supabase
            .from('orders')
            .select('*, events(title, organizer_id, users(full_name, email))')
            .gte('created_at', daysAgo.toISOString())
            .eq('status', 'completed');

        // Load tickets
        const { data: tickets } = await supabase
            .from('tickets')
            .select('*')
            .gte('created_at', daysAgo.toISOString());

        calculateMetrics(orders || [], tickets || []);
        renderRevenueByEvent(orders || []);
        renderOrdersByStatus(orders || []);
        renderTopOrganizers(orders || []);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function calculateMetrics(orders, tickets) {
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const totalOrders = orders.length;
    const ticketsSold = tickets.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('ticketsSold').textContent = ticketsSold;
    document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;

    document.getElementById('revenueChange').textContent = `${totalOrders} orders`;
    document.getElementById('ordersChange').textContent = `${ticketsSold} tickets`;
    document.getElementById('ticketsChange').textContent = `${(ticketsSold / totalOrders || 0).toFixed(1)} per order`;
    document.getElementById('avgChange').textContent = `from ${totalOrders} orders`;
}

function renderRevenueByEvent(orders) {
    const eventRevenue = {};
    
    orders.forEach(order => {
        const eventTitle = order.events?.title || 'Unknown';
        eventRevenue[eventTitle] = (eventRevenue[eventTitle] || 0) + parseFloat(order.total || 0);
    });

    const sorted = Object.entries(eventRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxRevenue = sorted[0]?.[1] || 1;

    const html = sorted.map(([event, revenue]) => {
        const percentage = (revenue / maxRevenue) * 100;
        return `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium">${event}</span>
                    <span class="text-neutral-600 dark:text-neutral-400">$${revenue.toFixed(2)}</span>
                </div>
                <div class="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                    <div class="bg-black dark:bg-white h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('revenueByEvent').innerHTML = html || '<div class="text-center text-neutral-500">No data</div>';
}

function renderOrdersByStatus(orders) {
    const statusCount = {
        completed: 0,
        pending: 0,
        failed: 0
    };

    orders.forEach(order => {
        statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    const total = orders.length || 1;

    const html = Object.entries(statusCount).map(([status, count]) => {
        const percentage = (count / total) * 100;
        return `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium capitalize">${status}</span>
                    <span class="text-neutral-600 dark:text-neutral-400">${count} (${percentage.toFixed(0)}%)</span>
                </div>
                <div class="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                    <div class="bg-black dark:bg-white h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('ordersByStatus').innerHTML = html;
}

function renderTopOrganizers(orders) {
    const organizerStats = {};

    orders.forEach(order => {
        const organizerId = order.events?.organizer_id;
        const organizerName = order.events?.users?.full_name || 'Unknown';
        const organizerEmail = order.events?.users?.email || '';

        if (!organizerId) return;

        if (!organizerStats[organizerId]) {
            organizerStats[organizerId] = {
                name: organizerName,
                email: organizerEmail,
                revenue: 0,
                orders: 0
            };
        }

        organizerStats[organizerId].revenue += parseFloat(order.total || 0);
        organizerStats[organizerId].orders += 1;
    });

    const sorted = Object.values(organizerStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    if (sorted.length === 0) {
        document.getElementById('topOrganizers').innerHTML = '<div class="text-center py-8 text-neutral-500">No data</div>';
        return;
    }

    const tableHtml = `
        <table class="w-full">
            <thead>
                <tr class="border-b border-neutral-200 dark:border-neutral-800">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Organizer</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Orders</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map((org, index) => `
                    <tr class="border-b border-neutral-200 dark:border-neutral-800">
                        <td class="py-4 px-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black text-xs font-bold">
                                    ${index + 1}
                                </div>
                                <div>
                                    <div class="font-medium">${org.name}</div>
                                    <div class="text-xs text-neutral-600 dark:text-neutral-400">${org.email}</div>
                                </div>
                            </div>
                        </td>
                        <td class="py-4 px-4 text-right">${org.orders}</td>
                        <td class="py-4 px-4 text-right font-semibold">$${org.revenue.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('topOrganizers').innerHTML = tableHtml;
}

// Event listeners
document.getElementById('periodFilter').addEventListener('change', (e) => {
    currentPeriod = parseInt(e.target.value);
    loadAnalytics();
});

// Initialize
loadAnalytics();
