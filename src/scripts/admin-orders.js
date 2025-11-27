// Admin Orders Management

let allOrders = [];
let filteredOrders = [];

async function loadOrders() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                events (title)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allOrders = orders || [];
        filteredOrders = allOrders;
        renderTable();
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersTable').innerHTML = 
            '<div class="text-center py-8 text-red-500">Error loading orders</div>';
    }
}

function filterOrders() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    filteredOrders = allOrders.filter(order => {
        const matchesSearch = !search || 
            (order.customer_name?.toLowerCase().includes(search)) ||
            (order.customer_email?.toLowerCase().includes(search)) ||
            (order.id?.toLowerCase().includes(search));
        const matchesStatus = !statusFilter || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderTable();
}

function renderTable() {
    const container = document.getElementById('ordersTable');

    if (filteredOrders.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-neutral-500">No orders found</div>';
        return;
    }

    const tableHtml = `
        <table class="w-full">
            <thead>
                <tr class="border-b border-neutral-200 dark:border-neutral-800">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Order ID</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Customer</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Event</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th class="text-right py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${filteredOrders.map(order => {
                    const date = new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    return `
                        <tr class="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                            <td class="py-4 px-4">
                                <div class="font-mono text-xs">${order.id.slice(0, 8).toUpperCase()}</div>
                            </td>
                            <td class="py-4 px-4">
                                <div class="font-medium">${order.customer_name || 'Guest'}</div>
                                <div class="text-sm text-neutral-600 dark:text-neutral-400">${order.customer_email}</div>
                            </td>
                            <td class="py-4 px-4 text-sm">${order.events?.title || 'Unknown Event'}</td>
                            <td class="py-4 px-4 text-sm text-neutral-600 dark:text-neutral-400">${date}</td>
                            <td class="py-4 px-4">
                                <span class="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                                    ${order.status}
                                </span>
                            </td>
                            <td class="py-4 px-4 text-right font-semibold">$${parseFloat(order.total).toFixed(2)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHtml;
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterOrders);
document.getElementById('statusFilter').addEventListener('change', filterOrders);

// Initialize
loadOrders();
