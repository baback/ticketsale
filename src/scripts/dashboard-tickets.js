// Enhanced ticket loading and viewing functionality

// Load user's tickets with orders
async function loadTickets() {
  try {
    console.log('Loading tickets...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User ID:', user.id);
    
    // Get orders with tickets
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        created_at,
        events!event_id (
          id,
          name,
          venue,
          event_date
        ),
        order_items (
          id,
          quantity,
          ticket_types (
            name,
            price
          )
        ),
        tickets (
          id,
          ticket_number,
          qr_code,
          status,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    console.log('Orders query result:', { orders, error });
    
    if (error) throw error;
    
    const ticketsList = document.getElementById('ticketsList');
    const ticketsEmpty = document.getElementById('ticketsEmpty');
    const ticketCount = document.getElementById('ticketCount');
    
    // Count total tickets
    const totalTickets = orders?.reduce((sum, order) => sum + (order.tickets?.length || 0), 0) || 0;
    
    if (orders && orders.length > 0 && totalTickets > 0) {
      ticketsList.classList.remove('hidden');
      ticketsEmpty.classList.add('hidden');
      ticketCount.textContent = `${totalTickets} ticket${totalTickets !== 1 ? 's' : ''}`;
      
      ticketsList.innerHTML = orders.map(order => {
        const event = order.events;
        const tickets = order.tickets || [];
        const ticketType = order.order_items[0]?.ticket_types;
        
        const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return `
          <div class="glass rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold mb-1">${event.name}</h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  ${event.venue || 'TBA'}
                </p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  ${eventDate}
                </p>
              </div>
              <div class="text-right">
                <div class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mb-2">
                  ${tickets.length} Ticket${tickets.length !== 1 ? 's' : ''}
                </div>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">${ticketType?.name || 'General'}</p>
              </div>
            </div>
            
            <div class="border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-4">
              <div class="flex items-center justify-between">
                <div class="text-sm text-neutral-600 dark:text-neutral-400">
                  Order #${order.id.slice(0, 8).toUpperCase()}
                </div>
                <button 
                  onclick="viewTickets('${order.id}')"
                  class="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  View Tickets
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      ticketsList.classList.add('hidden');
      ticketsEmpty.classList.remove('hidden');
      ticketCount.textContent = '0 tickets';
    }
    
  } catch (error) {
    console.error('Error loading tickets:', error);
    showError('Failed to load tickets');
  }
}


// View tickets modal
async function viewTickets(orderId) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        created_at,
        events!event_id (
          id,
          name,
          venue,
          event_date
        ),
        order_items (
          *,
          ticket_types (
            name,
            price
          )
        ),
        tickets (
          id,
          ticket_number,
          qr_code,
          status,
          created_at
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    
    const event = order.events;
    const tickets = order.tickets || [];
    const ticketType = order.order_items[0]?.ticket_types;
    
    const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
      <div class="bg-white dark:bg-neutral-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-6 flex items-center justify-between z-10">
          <div>
            <h2 class="text-2xl font-bold mb-1">${event.name}</h2>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">${eventDate}</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="p-6 space-y-4">
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
                    <p><span class="text-neutral-600 dark:text-neutral-400">Location:</span> <span class="font-medium">${event.venue || 'TBA'}</span></p>
                  </div>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <div class="bg-white p-3 rounded-lg border border-neutral-200">
                    <img src="${ticket.qr_code}" alt="QR Code" class="w-32 h-32" />
                  </div>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400">Scan at entry</p>
                </div>
              </div>
            </div>
          `).join('')}
          
          <div class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div class="flex gap-3">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="text-sm text-blue-900 dark:text-blue-100">
                <p class="font-semibold mb-1">Important Information</p>
                <p>Present these QR codes at the entrance. Each ticket is valid for one person only. Screenshots are accepted, but please ensure the QR code is clearly visible.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-6 z-10">
          <div class="flex gap-3 flex-col sm:flex-row">
            <button 
              onclick="window.print()"
              class="flex-1 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Print Tickets
            </button>
            <button 
              onclick="this.closest('.fixed').remove()"
              class="px-6 py-3 border border-neutral-200 dark:border-neutral-800 rounded-full font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error('Error viewing tickets:', error);
    showError('Failed to load tickets');
  }
}

// Make functions globally available
window.viewTickets = viewTickets;
