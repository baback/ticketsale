// Organizer Dashboard Script

// Initialize theme from localStorage
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.remove('dark');
}

// Initialize dashboard
async function initOrganizerDashboard() {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      window.location.href = '/login/';
      return;
    }

    // Check user role and redirect if needed
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!userError && userData && userData.role === 'buyer') {
      window.location.href = '/dashboard/';
      return;
    }

    // Load user profile
    await loadUserProfile(session.user);
    
    // Load dashboard data
    await loadDashboardStats();
    await loadRecentEvents();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
  }
}

// Load user profile
async function loadUserProfile(user) {
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    const displayName = data?.full_name || user.email.split('@')[0];
    const userName = document.getElementById('userName');
    
    if (userName) {
      userName.className = '';
      userName.textContent = displayName;
    }
    
  } catch (error) {
    console.error('Error loading profile:', error);
    const user = (await supabase.auth.getUser()).data.user;
    const displayName = user.email.split('@')[0];
    const userName = document.getElementById('userName');
    
    if (userName) {
      userName.className = '';
      userName.textContent = displayName;
    }
  }
}

// Show skeleton loading
function showStatsSkeleton() {
  const statsGrid = document.getElementById('statsGrid');
  const statsSkeleton = document.getElementById('statsSkeleton');
  
  if (statsGrid) statsGrid.classList.add('hidden');
  if (statsSkeleton) statsSkeleton.classList.remove('hidden');
}

// Hide skeleton loading
function hideStatsSkeleton() {
  const statsGrid = document.getElementById('statsGrid');
  const statsSkeleton = document.getElementById('statsSkeleton');
  
  if (statsGrid) statsGrid.classList.remove('hidden');
  if (statsSkeleton) statsSkeleton.classList.add('hidden');
}

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get all events by this organizer
    const { data: events } = await supabase
      .from('events')
      .select('id, status')
      .eq('organizer_id', user.id);
    
    if (!events || events.length === 0) {
      hideStatsSkeleton();
      return;
    }
    
    const eventIds = events.map(e => e.id);
    
    // Get total revenue from completed orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total')
      .in('event_id', eventIds)
      .eq('status', 'completed');
    
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    
    // Get total tickets sold from completed orders
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id')
      .in('event_id', eventIds);
    
    const ticketsSold = tickets?.length || 0;
    
    // Count active (published) events
    const activeEvents = events.filter(e => e.status === 'published').length;
    
    // Update UI with formatted currency
    const formattedRevenue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(totalRevenue);
    
    document.getElementById('totalRevenue').textContent = formattedRevenue;
    document.getElementById('ticketsSold').textContent = ticketsSold;
    document.getElementById('activeEvents').textContent = activeEvents;
    document.getElementById('totalViews').textContent = '0'; // TODO: Implement view tracking
    
    hideStatsSkeleton();
    
  } catch (error) {
    console.error('Error loading stats:', error);
    hideStatsSkeleton();
  }
}

// Load recent events
async function loadRecentEvents() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: events } = await supabase
      .from('events')
      .select(`
        *,
        ticket_types (
          id,
          name,
          price,
          quantity,
          available
        )
      `)
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    const eventsList = document.getElementById('eventsList');
    const eventsEmpty = document.getElementById('eventsEmpty');
    
    if (!events || events.length === 0) {
      if (eventsList) eventsList.classList.add('hidden');
      if (eventsEmpty) eventsEmpty.classList.remove('hidden');
      return;
    }
    
    // Show events list, hide empty state
    if (eventsList) eventsList.classList.remove('hidden');
    if (eventsEmpty) eventsEmpty.classList.add('hidden');
    
    // Render events with same card design as events page
    if (eventsList) {
      eventsList.innerHTML = events.map(event => {
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const isPast = eventDate < new Date();
        
        // Calculate tickets sold
        const totalTickets = event.ticket_types?.reduce((sum, t) => sum + t.quantity, 0) || 0;
        const availableTickets = event.ticket_types?.reduce((sum, t) => sum + t.available, 0) || 0;
        const soldTickets = totalTickets - availableTickets;
        const soldPercentage = totalTickets > 0 ? (soldTickets / totalTickets * 100).toFixed(0) : 0;
        
        const statusColors = {
          published: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
          draft: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
          cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        };
        
        return `
          <div class="glass rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group">
            <!-- Event Image -->
            <div class="relative h-48 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              ${event.image_url ? `
                <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ` : `
                <div class="w-full h-full flex items-center justify-center">
                  <svg class="w-16 h-16 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
              `}
              <div class="absolute top-3 right-3">
                <span class="text-xs px-3 py-1.5 rounded-full ${statusColors[event.status] || statusColors.draft} font-medium backdrop-blur-sm">
                  ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
              ${isPast ? `
                <div class="absolute top-3 left-3">
                  <span class="text-xs px-3 py-1.5 rounded-full bg-neutral-900/80 text-white font-medium backdrop-blur-sm">
                    Past Event
                  </span>
                </div>
              ` : ''}
            </div>
            
            <!-- Event Info -->
            <div class="p-4">
              <h3 class="font-bold text-lg mb-2 line-clamp-2">${event.title}</h3>
              
              <div class="space-y-2 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <span>${formattedDate}</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span class="truncate">${event.location || 'TBA'}</span>
                </div>
              </div>
              
              <!-- Ticket Stats -->
              <div class="mb-4">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-neutral-600 dark:text-neutral-400">Tickets Sold</span>
                  <span class="font-semibold">${soldTickets} / ${totalTickets}</span>
                </div>
                <div class="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style="width: ${soldPercentage}%"></div>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="grid grid-cols-2 gap-2 mb-2">
                <a href="/dashboard/organizer/events/edit/?id=${event.id}" class="px-3 py-2 text-center rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                  Edit
                </a>
                <a href="/dashboard/organizer/events/analytics/?id=${event.id}" class="px-3 py-2 text-center rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-medium">
                  Stats
                </a>
              </div>
              <a href="/dashboard/organizer/scan/?event=${event.id}" class="block w-full px-3 py-2 text-center rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                Scan Tickets
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
    
  } catch (error) {
    console.error('Error loading events:', error);
    const eventsList = document.getElementById('eventsList');
    const eventsEmpty = document.getElementById('eventsEmpty');
    
    if (eventsList) eventsList.classList.add('hidden');
    if (eventsEmpty) eventsEmpty.classList.remove('hidden');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOrganizerDashboard);
} else {
  initOrganizerDashboard();
}
