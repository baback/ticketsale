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
      return;
    }
    
    const eventIds = events.map(e => e.id);
    
    // Get total revenue from completed orders
    const { data: orders } = await supabase
      .from('orders')
      .select('total')
      .in('event_id', eventIds)
      .eq('status', 'completed');
    
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    
    // Get total tickets sold
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id')
      .in('order_id', orders?.map(o => o.id) || []);
    
    const ticketsSold = tickets?.length || 0;
    
    // Count active (published) events
    const activeEvents = events.filter(e => e.status === 'published').length;
    
    // Update UI
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
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
      .select('*')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
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
    
    // Render events
    if (eventsList) {
      eventsList.innerHTML = events.map(event => {
        const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        const statusColors = {
          published: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
          draft: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
          cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        };
        
        return `
          <a href="/dashboard/organizer/events/edit/?id=${event.id}" class="block glass rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group">
            <!-- Event Image -->
            <div class="relative h-32 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              ${event.image_url ? `
                <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ` : `
                <div class="w-full h-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
              `}
              <div class="absolute top-2 right-2">
                <span class="text-xs px-2 py-1 rounded-full ${statusColors[event.status] || statusColors.draft} backdrop-blur-sm">
                  ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
            </div>
            
            <!-- Event Details -->
            <div class="p-3">
              <h3 class="font-semibold mb-1 line-clamp-1">${event.title}</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">${eventDate} • ${event.location || 'TBA'}</p>
            </div>
          </a>
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
