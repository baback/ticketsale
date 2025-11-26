// Organizer CRM Script

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

// Initialize CRM page
async function initCRM() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }

  await loadCustomers(session.user.id);
  
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterCustomers(e.target.value);
    });
  }
}

let allCustomers = [];

async function loadCustomers(organizerId) {
  try {
    // Get all orders for organizer's events
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        events!inner(organizer_id, title)
      `)
      .eq('events.organizer_id', organizerId)
      .in('status', ['paid', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by customer
    const customerMap = new Map();
    
    orders.forEach(order => {
      const email = order.customer_email;
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email: email,
          name: order.customer_name || 'Unknown',
          user_id: order.user_id,
          orders: [],
          totalSpent: 0,
          orderCount: 0
        });
      }
      
      const customer = customerMap.get(email);
      customer.orders.push(order);
      customer.totalSpent += parseFloat(order.total || 0);
      customer.orderCount++;
    });

    allCustomers = Array.from(customerMap.values());
    
    // Update stats
    const totalCustomersEl = document.getElementById('totalCustomers');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    totalCustomersEl.textContent = allCustomers.length;
    totalOrdersEl.textContent = orders.length;
    totalRevenueEl.textContent = formatCurrency(
      orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
    );

    displayCustomers(allCustomers);
  } catch (error) {
    console.error('Error loading customers:', error);
  }
}

function displayCustomers(customers) {
  const container = document.getElementById('customersList');
  
  if (!customers || customers.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-neutral-600 dark:text-neutral-400">No customers yet</div>';
    return;
  }

  container.innerHTML = customers.map(customer => `
    <a href="/dashboard/organizer/crm/profile/?email=${encodeURIComponent(customer.email)}" 
       class="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-semibold">
          ${customer.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div class="font-medium">${customer.name}</div>
          <div class="text-sm text-neutral-600 dark:text-neutral-400">${customer.email}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="font-semibold">${formatCurrency(customer.totalSpent)}</div>
        <div class="text-sm text-neutral-600 dark:text-neutral-400">${customer.orderCount} order${customer.orderCount !== 1 ? 's' : ''}</div>
      </div>
    </a>
  `).join('');
}

function filterCustomers(query) {
  if (!query) {
    displayCustomers(allCustomers);
    return;
  }

  const filtered = allCustomers.filter(customer => 
    customer.name.toLowerCase().includes(query.toLowerCase()) ||
    customer.email.toLowerCase().includes(query.toLowerCase())
  );
  
  displayCustomers(filtered);
}

// Initialize on page load
if (window.location.pathname.includes('/crm/') && !window.location.pathname.includes('/profile/')) {
  document.addEventListener('DOMContentLoaded', initCRM);
}
