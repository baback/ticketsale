// Event Analytics Script

// Initialize theme
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.remove('dark');
}

// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

// State
let analyticsData = null;
let salesChart = null;
let ticketChart = null;

// Initialize
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }
  
  if (!eventId) {
    window.location.href = '/dashboard/organizer/events/';
    return;
  }
  
  setupEventListeners();
  await loadAnalytics();
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('refreshBtn').addEventListener('click', () => loadAnalytics());
}

// Load analytics data
async function loadAnalytics() {
  try {
    showSkeleton();
    
    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, event_date')
      .eq('id', eventId)
      .single();
    
    if (eventError) throw eventError;
    
    document.getElementById('eventTitle').textContent = `${event.title} - Analytics`;
    
    // Fetch orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*, order_items(*, ticket_types(name))')
      .eq('event_id', eventId)
      .in('status', ['paid', 'completed']);
    
    console.log('Orders query result:', { orders, ordersError, eventId });
    
    if (ordersError) {
      console.error('Orders error:', ordersError);
      throw ordersError;
    }
    
    // Fetch tickets - only from completed orders
    let tickets = [];
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      console.log('Fetching tickets for order IDs:', orderIds);
      
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*, ticket_types(name, price)')
        .eq('event_id', eventId)
        .in('order_id', orderIds);
      
      console.log('Tickets query result:', { ticketsData, ticketsError });
      
      if (ticketsError) {
        console.error('Tickets error:', ticketsError);
        throw ticketsError;
      }
      tickets = ticketsData || [];
    } else {
      console.log('No completed orders found for this event');
    }
    
    // Fetch ticket types
    const { data: ticketTypes, error: ticketTypesError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId);
    
    console.log('Ticket types:', ticketTypes);
    
    if (ticketTypesError) {
      console.error('Ticket types error:', ticketTypesError);
      throw ticketTypesError;
    }
    
    // Fetch page views
    const { data: pageViews, error: pageViewsError } = await supabase
      .from('page_views')
      .select('*')
      .eq('event_id', eventId);
    
    if (pageViewsError) console.error('Page views error:', pageViewsError);
    
    // Fetch conversion events
    const { data: conversions, error: conversionsError } = await supabase
      .from('conversion_events')
      .select('*')
      .eq('event_id', eventId);
    
    if (conversionsError) console.error('Conversions error:', conversionsError);
    
    // Process analytics data
    analyticsData = processAnalytics(orders, tickets, ticketTypes, pageViews || [], conversions || []);
    
    // Display analytics
    displayMetrics(analyticsData);
    displayCharts(analyticsData);
    displayRecentOrders(orders);
    displayTicketTypes(analyticsData.ticketTypeStats);
    displayTrafficStats(analyticsData);
    displayConversionFunnel(analyticsData);
    
    hideSkeleton();
    
  } catch (error) {
    console.error('Error loading analytics:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    hideSkeleton();
    
    // Show error message in the UI
    const analyticsContent = document.getElementById('analyticsContent');
    if (analyticsContent) {
      analyticsContent.classList.remove('hidden');
      analyticsContent.innerHTML = `
        <div class="glass rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h3 class="text-xl font-bold mb-2">Failed to Load Analytics</h3>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">
            ${error.message || 'An error occurred while loading analytics data.'}
          </p>
          <button onclick="location.reload()" class="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium">
            Try Again
          </button>
        </div>
      `;
    }
  }
}

// Process analytics data
function processAnalytics(orders, tickets, ticketTypes, pageViews, conversions) {
  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  
  // Calculate tickets sold
  const ticketsSold = tickets.length;
  
  // Calculate total available tickets
  const totalAvailable = ticketTypes.reduce((sum, tt) => sum + (tt.available || 0), 0);
  
  // Calculate total orders
  const totalOrders = orders.length;
  
  // Calculate average order value
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Calculate check-ins
  const checkIns = tickets.filter(t => t.checked_in_at).length;
  const checkInRate = ticketsSold > 0 ? (checkIns / ticketsSold) * 100 : 0;
  
  // Sales timeline (group by date)
  const salesByDate = {};
  orders.forEach(order => {
    const date = new Date(order.created_at).toLocaleDateString();
    if (!salesByDate[date]) {
      salesByDate[date] = { revenue: 0, tickets: 0 };
    }
    salesByDate[date].revenue += parseFloat(order.total_amount || 0);
    salesByDate[date].tickets += order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  });
  
  // Ticket type breakdown
  const ticketTypeStats = {};
  ticketTypes.forEach(tt => {
    ticketTypeStats[tt.id] = {
      name: tt.name,
      price: parseFloat(tt.price),
      quantity: tt.quantity,
      available: tt.available,
      sold: tt.quantity - tt.available,
      revenue: 0
    };
  });
  
  // Calculate revenue per ticket type
  tickets.forEach(ticket => {
    if (ticketTypeStats[ticket.ticket_type_id]) {
      // Use the price from ticketTypeStats (which comes from ticket_types table)
      // This is more reliable than the joined data
      ticketTypeStats[ticket.ticket_type_id].revenue += ticketTypeStats[ticket.ticket_type_id].price;
    }
  });
  
  // Process page views
  const totalPageViews = pageViews.length;
  const uniqueVisitors = new Set(pageViews.map(pv => pv.session_id)).size;
  const conversionRate = uniqueVisitors > 0 ? (totalOrders / uniqueVisitors) * 100 : 0;
  
  // Traffic sources
  const trafficSources = {};
  pageViews.forEach(pv => {
    const source = pv.utm_source || (pv.referrer ? new URL(pv.referrer).hostname : 'Direct');
    trafficSources[source] = (trafficSources[source] || 0) + 1;
  });
  
  // Device breakdown
  const deviceStats = {};
  pageViews.forEach(pv => {
    const device = pv.device_type || 'unknown';
    deviceStats[device] = (deviceStats[device] || 0) + 1;
  });
  
  // Top referrers
  const referrers = {};
  pageViews.forEach(pv => {
    if (pv.referrer) {
      try {
        const hostname = new URL(pv.referrer).hostname;
        referrers[hostname] = (referrers[hostname] || 0) + 1;
      } catch (e) {}
    }
  });
  
  // Conversion funnel
  const funnelViews = conversions.filter(c => c.event_type === 'view').length || totalPageViews;
  const funnelCheckout = conversions.filter(c => c.event_type === 'checkout_start').length;
  const funnelPurchases = conversions.filter(c => c.event_type === 'purchase').length || totalOrders;
  
  return {
    totalRevenue,
    ticketsSold,
    totalAvailable,
    totalOrders,
    avgOrderValue,
    checkIns,
    checkInRate,
    salesByDate,
    ticketTypeStats,
    totalPageViews,
    uniqueVisitors,
    conversionRate,
    trafficSources,
    deviceStats,
    referrers,
    funnelViews,
    funnelCheckout,
    funnelPurchases
  };
}

// Display metrics
function displayMetrics(data) {
  document.getElementById('totalRevenue').textContent = `$${data.totalRevenue.toFixed(2)}`;
  document.getElementById('ticketsSold').textContent = data.ticketsSold;
  document.getElementById('ticketsAvailable').textContent = data.totalAvailable;
  document.getElementById('totalOrders').textContent = data.totalOrders;
  document.getElementById('avgOrderValue').textContent = `Avg: $${data.avgOrderValue.toFixed(2)}`;
  document.getElementById('checkIns').textContent = data.checkIns;
  document.getElementById('checkInRate').textContent = `${data.checkInRate.toFixed(1)}% attendance`;
}

// Display charts
function displayCharts(data) {
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#a3a3a3' : '#525252';
  const gridColor = isDark ? '#262626' : '#e5e5e5';
  
  // Sales timeline chart
  const salesDates = Object.keys(data.salesByDate).sort((a, b) => new Date(a) - new Date(b));
  const salesRevenue = salesDates.map(date => data.salesByDate[date].revenue);
  
  const salesCtx = document.getElementById('salesChart').getContext('2d');
  if (salesChart) salesChart.destroy();
  
  salesChart = new Chart(salesCtx, {
    type: 'line',
    data: {
      labels: salesDates,
      datasets: [{
        label: 'Revenue',
        data: salesRevenue,
        borderColor: isDark ? '#ffffff' : '#000000',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: function(value) {
              return '$' + value.toFixed(0);
            }
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
  
  // Ticket type chart
  const ticketNames = Object.values(data.ticketTypeStats).map(tt => tt.name);
  const ticketSold = Object.values(data.ticketTypeStats).map(tt => tt.sold);
  
  const ticketCtx = document.getElementById('ticketChart').getContext('2d');
  if (ticketChart) ticketChart.destroy();
  
  ticketChart = new Chart(ticketCtx, {
    type: 'doughnut',
    data: {
      labels: ticketNames,
      datasets: [{
        data: ticketSold,
        backgroundColor: [
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
          '#f59e0b',
          '#10b981',
          '#6366f1'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            padding: 15
          }
        }
      }
    }
  });
}

// Display recent orders
function displayRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersTable');
  tbody.innerHTML = '';
  
  // Sort by date (most recent first) and take top 10
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);
  
  if (recentOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-neutral-600 dark:text-neutral-400">No orders yet</td></tr>';
    return;
  }
  
  recentOrders.forEach(order => {
    const ticketCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const date = new Date(order.created_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const statusColors = {
      paid: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
      completed: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
      pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400'
    };
    
    const row = document.createElement('tr');
    row.className = 'border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors';
    row.innerHTML = `
      <td class="py-3 px-4 text-sm font-mono">#${order.id.slice(0, 8)}</td>
      <td class="py-3 px-4 text-sm">${order.customer_name || order.customer_email || 'Guest'}</td>
      <td class="py-3 px-4 text-sm">${ticketCount}</td>
      <td class="py-3 px-4 text-sm font-semibold">$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending}">
          ${order.status}
        </span>
      </td>
      <td class="py-3 px-4 text-sm text-neutral-600 dark:text-neutral-400">${date}</td>
    `;
    tbody.appendChild(row);
  });
}

// Display ticket types performance
function displayTicketTypes(ticketTypeStats) {
  const container = document.getElementById('ticketTypesTable');
  container.innerHTML = '';
  
  Object.values(ticketTypeStats).forEach(tt => {
    const soldPercentage = tt.quantity > 0 ? (tt.sold / tt.quantity) * 100 : 0;
    
    const div = document.createElement('div');
    div.className = 'p-4 rounded-xl border border-neutral-200 dark:border-neutral-800';
    div.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div>
          <div class="font-semibold">${tt.name}</div>
          <div class="text-sm text-neutral-600 dark:text-neutral-400">$${tt.price.toFixed(2)} per ticket</div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold">${tt.sold}</div>
          <div class="text-xs text-neutral-600 dark:text-neutral-400">of ${tt.quantity} sold</div>
        </div>
      </div>
      <div class="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 mb-2">
        <div class="bg-black dark:bg-white h-2 rounded-full transition-all" style="width: ${soldPercentage}%"></div>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-neutral-600 dark:text-neutral-400">${soldPercentage.toFixed(1)}% sold</span>
        <span class="font-semibold">Revenue: $${tt.revenue.toFixed(2)}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// Show skeleton loading
function showSkeleton() {
  document.getElementById('loadingSkeleton').classList.remove('hidden');
  document.getElementById('analyticsContent').classList.add('hidden');
}

// Hide skeleton loading
function hideSkeleton() {
  document.getElementById('loadingSkeleton').classList.add('hidden');
  document.getElementById('analyticsContent').classList.remove('hidden');
}

// Display traffic statistics
function displayTrafficStats(data) {
  // Traffic overview
  document.getElementById('totalPageViews').textContent = data.totalPageViews;
  document.getElementById('uniqueVisitors').textContent = data.uniqueVisitors;
  document.getElementById('conversionRate').textContent = `${data.conversionRate.toFixed(1)}%`;
  
  // Traffic sources
  const sourcesContainer = document.getElementById('trafficSources');
  sourcesContainer.innerHTML = '';
  
  const sortedSources = Object.entries(data.trafficSources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sortedSources.length === 0) {
    sourcesContainer.innerHTML = '<p class="text-sm text-neutral-600 dark:text-neutral-400">No traffic data yet</p>';
  } else {
    sortedSources.forEach(([source, count]) => {
      const percentage = data.totalPageViews > 0 ? (count / data.totalPageViews) * 100 : 0;
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium">${source}</span>
          <span class="text-sm text-neutral-600 dark:text-neutral-400">${count} views</span>
        </div>
        <div class="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 transition-all" style="width: ${percentage}%"></div>
        </div>
      `;
      sourcesContainer.appendChild(div);
    });
  }
  
  // Device stats
  const deviceContainer = document.getElementById('deviceStats');
  deviceContainer.innerHTML = '';
  
  const deviceIcons = {
    mobile: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>',
    tablet: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>',
    desktop: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>'
  };
  
  Object.entries(data.deviceStats).forEach(([device, count]) => {
    const percentage = data.totalPageViews > 0 ? (count / data.totalPageViews) * 100 : 0;
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        ${deviceIcons[device] || deviceIcons.desktop}
        <span class="font-medium capitalize">${device}</span>
      </div>
      <div class="text-right">
        <div class="font-bold">${count}</div>
        <div class="text-xs text-neutral-600 dark:text-neutral-400">${percentage.toFixed(1)}%</div>
      </div>
    `;
    deviceContainer.appendChild(div);
  });
  
  // Top referrers
  const referrersContainer = document.getElementById('topReferrers');
  referrersContainer.innerHTML = '';
  
  const sortedReferrers = Object.entries(data.referrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (sortedReferrers.length === 0) {
    referrersContainer.innerHTML = '<p class="text-sm text-neutral-600 dark:text-neutral-400">No referrer data yet</p>';
  } else {
    sortedReferrers.forEach(([referrer, count]) => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800';
      div.innerHTML = `
        <span class="text-sm font-medium truncate">${referrer}</span>
        <span class="text-sm font-bold">${count}</span>
      `;
      referrersContainer.appendChild(div);
    });
  }
}

// Display conversion funnel
function displayConversionFunnel(data) {
  document.getElementById('funnelViews').textContent = data.funnelViews;
  document.getElementById('funnelCheckout').textContent = data.funnelCheckout;
  document.getElementById('funnelPurchases').textContent = data.funnelPurchases;
  
  const checkoutPercentage = data.funnelViews > 0 ? (data.funnelCheckout / data.funnelViews) * 100 : 0;
  const purchasePercentage = data.funnelViews > 0 ? (data.funnelPurchases / data.funnelViews) * 100 : 0;
  
  const checkoutBar = document.getElementById('funnelCheckoutBar');
  const purchaseBar = document.getElementById('funnelPurchaseBar');
  
  checkoutBar.style.width = `${checkoutPercentage}%`;
  checkoutBar.textContent = `${checkoutPercentage.toFixed(1)}%`;
  
  purchaseBar.style.width = `${purchasePercentage}%`;
  purchaseBar.textContent = `${purchasePercentage.toFixed(1)}%`;
}

// Initialize on page load
init();
