// Order details page functionality

async function loadOrderDetails() {
  try {
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (!orderId) {
      showError();
      return;
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login/';
      return;
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, total, created_at, event_id, ticket_pdf_url')
      .eq('id', orderId)
      .eq('user_id', session.user.id)
      .single();

    if (orderError || !order) {
      showError();
      return;
    }

    // Get event
    const { data: event } = await supabase
      .from('events')
      .select('id, title, location, event_date, image_url')
      .eq('id', order.event_id)
      .single();

    // Get order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, quantity, ticket_type_id')
      .eq('order_id', orderId);

    // Get ticket types
    const ticketTypeIds = orderItems?.map(oi => oi.ticket_type_id) || [];
    const { data: ticketTypes } = await supabase
      .from('ticket_types')
      .select('id, name, price')
      .in('id', ticketTypeIds);

    // Get tickets
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, qr_code, status, created_at')
      .eq('order_id', orderId);

    // Combine data
    order.event = event;
    order.order_items = orderItems?.map(oi => ({
      ...oi,
      ticket_types: ticketTypes?.find(tt => tt.id === oi.ticket_type_id)
    })) || [];
    order.tickets = tickets || [];

    displayOrder(order);
    
  } catch (error) {
    console.error('Error loading order:', error);
    showError();
  }
}

function displayOrder(order) {
  const event = order.event;
  const tickets = order.tickets;
  const ticketType = order.order_items[0]?.ticket_types;
  
  const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const content = document.getElementById('content');
  content.innerHTML = `
    <!-- Header with Event Image -->
    <div class="glass rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
      ${event.image_url ? `
        <div class="aspect-[21/9] w-full overflow-hidden">
          <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover" />
        </div>
      ` : ''}
      <div class="p-8">
        <h1 class="text-3xl font-bold mb-2">${event.title}</h1>
        <p class="text-lg text-neutral-600 dark:text-neutral-400 mb-4">${eventDate}</p>
        <p class="text-neutral-600 dark:text-neutral-400">${event.location || 'TBA'}</p>
      </div>
    </div>

    <!-- Order Summary -->
    <div class="glass rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
      <h2 class="text-xl font-semibold mb-4">Order Summary</h2>
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="text-neutral-600 dark:text-neutral-400">Order Number</span>
          <span class="font-medium">#${order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-neutral-600 dark:text-neutral-400">Tickets</span>
          <span class="font-medium">${tickets.length} × ${ticketType?.name || 'General'}</span>
        </div>
        <div class="flex justify-between pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <span class="font-semibold">Total Paid</span>
          <span class="font-semibold text-green-600 dark:text-green-400">$${Number(order.total).toFixed(2)}</span>
        </div>
      </div>
    </div>

    ${order.ticket_pdf_url ? `
    <!-- Download PDF -->
    <div class="glass rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
      <h2 class="text-xl font-semibold mb-4">Download Tickets</h2>
      <a href="${order.ticket_pdf_url}" target="_blank" download class="flex items-center justify-center gap-2 w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Download PDF Tickets
      </a>
    </div>
    ` : ''}

    <!-- Individual Tickets -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">Your Tickets</h2>
      ${tickets.map((ticket, index) => `
        <div class="glass rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
          <div class="flex items-start gap-6 flex-col md:flex-row">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-4">
                <h3 class="text-lg font-semibold">Ticket ${index + 1}</h3>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${
                  ticket.status === 'valid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                  ticket.status === 'used' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400' :
                  'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }">
                  ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
              </div>
              <div class="space-y-2 text-sm">
                <p><span class="text-neutral-600 dark:text-neutral-400">Type:</span> <span class="font-medium">${ticketType?.name || 'General'}</span></p>
                <p><span class="text-neutral-600 dark:text-neutral-400">Ticket #:</span> <span class="font-mono text-xs">${ticket.ticket_number}</span></p>
              </div>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="bg-white p-3 rounded-lg border border-neutral-200">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qr_code)}" alt="QR Code" class="w-32 h-32" />
              </div>
              <p class="text-xs text-neutral-600 dark:text-neutral-400">Scan at entry</p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Important Info -->
    <div class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
      <div class="flex gap-3">
        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="text-sm text-blue-900 dark:text-blue-100">
          <p class="font-semibold mb-1">Important Information</p>
          <p>Present these QR codes at the entrance. Each ticket is valid for one person only. You can print this page or show it on your phone.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('loading').classList.add('hidden');
  content.classList.remove('hidden');
}

function showError() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadOrderDetails);
} else {
  loadOrderDetails();
}
