/** @format */

// Initialize theme
if (!localStorage.getItem('theme')) {
  localStorage.setItem('theme', 'dark');
  document.documentElement.classList.add('dark');
}

if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Dashboard functionality
let currentMode = 'buyer'; // 'buyer' or 'organizer'
let userProfile = null;

// Use the global supabase client (already declared in supabase.js)
// Access it via window.supabaseClient or the global supabase variable

// Initialize dashboard
async function initDashboard() {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      window.location.href = '../login/';
      return;
    }

    // Load user profile
    await loadUserProfile(session.user);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial content
    await loadContent();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    // Silently handle - user will see empty states
  }
}

// Load user profile from database
async function loadUserProfile(user) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    userProfile = data;
    
    // Update UI with user info
    const userName = document.getElementById('userName');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmailShort = document.getElementById('userEmailShort');
    const userAvatar = document.getElementById('userAvatar');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsName = document.getElementById('settingsName');
    
    const displayName = userProfile.full_name || user.email.split('@')[0];
    const initials = getInitials(displayName);
    
    if (userName) {
      userName.className = '';
      userName.textContent = displayName;
    }
    if (userDisplayName) {
      userDisplayName.className = 'text-sm font-medium truncate';
      userDisplayName.textContent = displayName;
    }
    if (userEmailShort) {
      userEmailShort.className = 'text-xs text-neutral-600 dark:text-neutral-400 truncate';
      userEmailShort.textContent = user.email;
    }
    if (userAvatar) {
      userAvatar.className = 'w-10 h-10 shrink-0 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-semibold text-sm';
      userAvatar.textContent = initials;
    }
    if (settingsEmail) settingsEmail.textContent = user.email;
    if (settingsName) settingsName.textContent = userProfile.full_name || 'Not set';
    
  } catch (error) {
    console.error('Error loading profile:', error);
    // If profile doesn't exist, user info from auth is still available
    const user = (await supabase.auth.getUser()).data.user;
    const userName = document.getElementById('userName');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmailShort = document.getElementById('userEmailShort');
    const userAvatar = document.getElementById('userAvatar');
    const settingsEmail = document.getElementById('settingsEmail');
    
    const displayName = user.email.split('@')[0];
    const initials = getInitials(displayName);
    
    if (userName) {
      userName.className = '';
      userName.textContent = displayName;
    }
    if (userDisplayName) {
      userDisplayName.className = 'text-sm font-medium truncate';
      userDisplayName.textContent = displayName;
    }
    if (userEmailShort) {
      userEmailShort.className = 'text-xs text-neutral-600 dark:text-neutral-400 truncate';
      userEmailShort.textContent = user.email;
    }
    if (userAvatar) {
      userAvatar.className = 'w-10 h-10 shrink-0 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-semibold text-sm';
      userAvatar.textContent = initials;
    }
    if (settingsEmail) settingsEmail.textContent = user.email;
  }
}

// Get user initials
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Set up event listeners
function setupEventListeners() {
  // NOTE: Sidebar event listeners are handled by dashboard-sidebar.js
  // This function only handles dashboard-specific functionality
  
  // Navigation items (for single-page navigation within dashboard)
  const navOverview = document.getElementById('navOverview');
  const navTickets = document.getElementById('navTickets');
  const navSettings = document.getElementById('navSettings');
  
  if (navOverview) navOverview.addEventListener('click', (e) => { e.preventDefault(); showSection('overview'); });
  if (navTickets) navTickets.addEventListener('click', (e) => { e.preventDefault(); showSection('tickets'); });
  if (navSettings) navSettings.addEventListener('click', (e) => { e.preventDefault(); showSection('settings'); });
  
  // Create event buttons
  const createEventBtn = document.getElementById('createEventBtn');
  const createEventBtnEmpty = document.getElementById('createEventBtnEmpty');
  
  if (createEventBtn) {
    createEventBtn.addEventListener('click', () => {
      alert('Create Event feature coming soon!');
    });
  }
  
  if (createEventBtnEmpty) {
    createEventBtnEmpty.addEventListener('click', () => {
      alert('Create Event feature coming soon!');
    });
  }
  
  // Account settings buttons
  const editNameBtn = document.getElementById('editNameBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  
  if (editNameBtn) {
    editNameBtn.addEventListener('click', editName);
  }
  
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', changePassword);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Switch between buyer and organizer mode
function switchMode(mode) {
  currentMode = mode;
  
  const buyerContent = document.getElementById('buyerContent');
  const organizerContent = document.getElementById('organizerContent');
  const switchModeText = document.getElementById('switchModeText');
  const currentModeText = document.getElementById('currentModeText');
  const navTickets = document.getElementById('navTickets');
  const navEvents = document.getElementById('navEvents');
  
  if (mode === 'buyer') {
    // Show/hide content
    buyerContent.classList.remove('hidden');
    organizerContent.classList.add('hidden');
    
    // Update UI text
    if (switchModeText) switchModeText.textContent = 'Switch to Organizer';
    if (currentModeText) currentModeText.textContent = 'Buyer Mode';
    
    // Update navigation
    if (navTickets) navTickets.classList.remove('hidden');
    if (navEvents) navEvents.classList.add('hidden');
  } else {
    // Show/hide content
    organizerContent.classList.remove('hidden');
    buyerContent.classList.add('hidden');
    
    // Update UI text
    if (switchModeText) switchModeText.textContent = 'Switch to Buyer';
    if (currentModeText) currentModeText.textContent = 'Organizer Mode';
    
    // Update navigation
    if (navTickets) navTickets.classList.add('hidden');
    if (navEvents) navEvents.classList.remove('hidden');
  }
  
  // Load content for the selected mode
  loadContent();
}

// Show different sections
function showSection(section) {
  // This will be expanded later for different views
  console.log('Showing section:', section);
}

// Toggle theme
function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const theme = html.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
}

// Load content based on current mode
async function loadContent() {
  if (currentMode === 'buyer') {
    await loadTickets();
  } else {
    await loadEvents();
  }
}

// Load user's tickets with orders
// Load user's tickets with orders
async function loadTickets() {
  try {
    console.log('Loading tickets...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User ID:', user.id);
    
    // Get orders with tickets - using separate queries to avoid PostgreSQL join issues
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total, created_at, event_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    console.log('Orders query result:', { orders, error: ordersError });
    
    if (ordersError) throw ordersError;
    
    // Fetch related data separately with error handling
    if (orders && orders.length > 0) {
      try {
        const eventIds = [...new Set(orders.map(o => o.event_id))];
        console.log('Fetching events for IDs:', eventIds);
        
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, title, location, event_date, image_url')
          .in('id', eventIds);
        
        if (eventsError) {
          console.error('Events query error:', eventsError);
          throw eventsError;
        }
        
        console.log('Fetching order items...');
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('id, order_id, quantity, ticket_type_id')
          .in('order_id', orders.map(o => o.id));
        
        if (orderItemsError) {
          console.error('Order items query error:', orderItemsError);
          throw orderItemsError;
        }
        
        const ticketTypeIds = [...new Set(orderItems?.map(oi => oi.ticket_type_id) || [])];
        console.log('Fetching ticket types for IDs:', ticketTypeIds);
        
        const { data: ticketTypes, error: ticketTypesError } = await supabase
          .from('ticket_types')
          .select('id, name, price')
          .in('id', ticketTypeIds);
        
        if (ticketTypesError) {
          console.error('Ticket types query error:', ticketTypesError);
          throw ticketTypesError;
        }
        
        console.log('Fetching tickets...');
        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('id, order_id, ticket_number, qr_code, status, created_at')
          .in('order_id', orders.map(o => o.id));
        
        if (ticketsError) {
          console.error('Tickets query error:', ticketsError);
          throw ticketsError;
        }
        
        console.log('Combining data...');
        // Combine the data  
        orders.forEach(order => {
          order.events = events?.find(e => e.id === order.event_id);
          order.order_items = orderItems?.filter(oi => oi.order_id === order.id).map(oi => ({
            ...oi,
            ticket_types: ticketTypes?.find(tt => tt.id === oi.ticket_type_id)
          })) || [];
          order.tickets = tickets?.filter(t => t.order_id === order.id) || [];
        });
        
        console.log('Data combined successfully:', orders);
      } catch (err) {
        console.error('Error fetching related data:', err);
        throw err;
      }
    }
    
    const ticketsList = document.getElementById('ticketsList');
    const ticketsEmpty = document.getElementById('ticketsEmpty');
    const ticketCount = document.getElementById('ticketCount');
    
    // Filter to only show upcoming events
    const now = new Date();
    const upcomingOrders = orders?.filter(order => {
      const eventDate = new Date(order.events?.event_date);
      return eventDate >= now;
    }) || [];
    
    // Count total tickets for upcoming events
    const totalTickets = upcomingOrders.reduce((sum, order) => sum + (order.tickets?.length || 0), 0);
    
    if (upcomingOrders.length > 0 && totalTickets > 0) {
      // Show tickets, hide empty state
      if (ticketsList) ticketsList.classList.remove('hidden');
      if (ticketsEmpty) ticketsEmpty.classList.add('hidden');
      if (ticketCount) ticketCount.textContent = `${totalTickets} ticket${totalTickets !== 1 ? 's' : ''}`;
      
      const viewAllLink = document.getElementById('viewAllTickets');
      if (upcomingOrders.length > 3 && viewAllLink) {
        viewAllLink.classList.remove('hidden');
      }
      
      if (ticketsList) {
        ticketsList.innerHTML = upcomingOrders.slice(0, 3).map(order => {
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
          <a href="/dashboard/mytickets/order/?id=${order.id}" class="block glass rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group">
            <div class="flex">
              <!-- Event Image -->
              <div class="w-40 h-40 shrink-0 bg-neutral-200 dark:bg-neutral-800 relative overflow-hidden">
                ${event.image_url ? `
                  <img src="${event.image_url}" alt="${event.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.style.display='none'" />
                ` : `
                  <div class="absolute inset-0 flex items-center justify-center">
                    <svg class="w-16 h-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                  </div>
                `}
              </div>
              
              <!-- Event Details -->
              <div class="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="flex-1">
                      <h3 class="text-lg font-semibold mb-1 line-clamp-1">${event.title}</h3>
                      <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="truncate">${event.location || 'TBA'}</span>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        <span>${eventDate}</span>
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <div class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mb-2">
                        ${tickets.length} Ticket${tickets.length !== 1 ? 's' : ''}
                      </div>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">${ticketType?.name || 'General'}</p>
                    </div>
                  </div>
                </div>
                
                <div class="border-t border-neutral-200 dark:border-neutral-800 pt-3 mt-3">
                  <div class="flex items-center justify-between">
                    <div class="text-sm text-neutral-600 dark:text-neutral-400">Order #${order.id.slice(0, 8).toUpperCase()}</div>
                    <div class="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-1">
                      View Tickets
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a>
        `;
        }).join('');
      }
    } else {
      // Show empty state, hide tickets
      if (ticketsList) ticketsList.classList.add('hidden');
      if (ticketsEmpty) ticketsEmpty.classList.remove('hidden');
      if (ticketCount) ticketCount.textContent = '0 tickets';
    }
    
  } catch (error) {
    console.error('Error loading tickets:', error);
    // Show empty state on error
    const ticketsList = document.getElementById('ticketsList');
    const ticketsEmpty = document.getElementById('ticketsEmpty');
    const ticketCount = document.getElementById('ticketCount');
    
    if (ticketsList) ticketsList.classList.add('hidden');
    if (ticketsEmpty) ticketsEmpty.classList.remove('hidden');
    if (ticketCount) ticketCount.textContent = '0 tickets';
  }
}

// View tickets modal with PDF download link
async function viewTickets(orderId) {
  try {
    // Get order with separate queries
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, total, created_at, event_id')
      .eq('id', orderId)
      .single();
    
    if (orderError) throw orderError;
    
    // Get event
    const { data: event } = await supabase
      .from('events')
      .select('id, title, location, event_date')
      .eq('id', order.event_id)
      .single();
    
    // Get order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, order_id, quantity, ticket_type_id')
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
      .select('id, order_id, ticket_number, qr_code, status, created_at')
      .eq('order_id', orderId);
    
    // Combine data
    order.events = event;
    order.order_items = orderItems?.map(oi => ({
      ...oi,
      ticket_types: ticketTypes?.find(tt => tt.id === oi.ticket_type_id)
    })) || [];
    order.tickets = tickets || [];
    
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
            <h2 class="text-2xl font-bold mb-1">${event.title}</h2>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">${eventDate}</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-6">
            <h3 class="font-semibold mb-4">Order Details</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Order Number</span>
                <span class="font-medium">#${order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Event</span>
                <span class="font-medium">${event.title}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Date & Time</span>
                <span class="font-medium">${eventDate}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Location</span>
                <span class="font-medium">${event.location || 'TBA'}</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span class="text-neutral-600 dark:text-neutral-400">Tickets</span>
                <span class="font-medium">${tickets.length} × ${ticketType?.name || 'General'}</span>
              </div>
              <div class="flex justify-between font-bold text-base">
                <span>Total Paid</span>
                <span class="text-green-600 dark:text-green-400">$${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

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
                    <p><span class="text-neutral-600 dark:text-neutral-400">Location:</span> <span class="font-medium">${event.location || 'TBA'}</span></p>
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
                <p>Present these QR codes at the entrance. Each ticket is valid for one person only. You can print this page or show it on your phone.</p>
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
    // Close any existing modal and fail silently
    const existingModal = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (existingModal) existingModal.remove();
  }
}

// Make viewTickets globally available
window.viewTickets = viewTickets;

// Load organizer's events
async function loadEvents() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user is an organizer
    if (!userProfile || (userProfile.role !== 'organizer' && userProfile.role !== 'both')) {
      document.getElementById('eventsList').classList.add('hidden');
      document.getElementById('eventsEmpty').classList.add('hidden');
      document.getElementById('notOrganizerState').classList.remove('hidden');
      document.getElementById('createEventBtn').disabled = true;
      document.getElementById('createEventBtn').classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const eventsList = document.getElementById('eventsList');
    const eventsEmpty = document.getElementById('eventsEmpty');
    const notOrganizerState = document.getElementById('notOrganizerState');
    
    notOrganizerState.classList.add('hidden');
    
    if (events && events.length > 0) {
      eventsList.classList.remove('hidden');
      eventsEmpty.classList.add('hidden');
      
      eventsList.innerHTML = events.map(event => `
        <div class="glass rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all cursor-pointer">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h3 class="font-semibold mb-1">${event.title}</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">${event.location}</p>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <div class="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                event.status === 'published' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                event.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                event.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }">
                ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </div>
            </div>
            <div class="text-right">
              <button type="button" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                View →
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      eventsList.classList.add('hidden');
      eventsEmpty.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('Error loading events:', error);
    // Show empty state on error
    const eventsList = document.getElementById('eventsList');
    const eventsEmpty = document.getElementById('eventsEmpty');
    
    if (eventsList) eventsList.classList.add('hidden');
    if (eventsEmpty) eventsEmpty.classList.remove('hidden');
  }
}

// Edit name
async function editName() {
  const newName = prompt('Enter your full name:', userProfile?.full_name || '');
  
  if (newName === null) return; // User cancelled
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('users')
      .update({ full_name: newName })
      .eq('id', user.id);
    
    if (error) throw error;
    
    // Update UI
    document.getElementById('settingsName').textContent = newName || 'Not set';
    document.getElementById('userName').textContent = newName || user.email.split('@')[0];
    
    if (userProfile) {
      userProfile.full_name = newName;
    }
    
    // Success - no alert needed, UI already updated
    
  } catch (error) {
    console.error('Error updating name:', error);
    // Revert UI on error
    const settingsName = document.getElementById('settingsName');
    if (settingsName && userProfile?.full_name) {
      settingsName.textContent = userProfile.full_name;
    }
  }
}

// Change password
async function changePassword() {
  const newPassword = prompt('Enter your new password (min 6 characters):');
  
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    alert('Password updated successfully');
    
  } catch (error) {
    console.error('Error updating password:', error);
    alert('Failed to update password. Please try again.');
  }
}

// Handle logout
async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '../login/';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect anyway
    window.location.href = '../login/';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
