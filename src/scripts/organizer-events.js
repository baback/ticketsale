// Organizer Events Page Script

// Initialize theme from localStorage
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.remove('dark');
}

// State
let allEvents = [];
let filteredEvents = [];

// Initialize
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }
  
  // Load events
  await loadEvents();
  
  // Set up event listeners
  setupEventListeners();
}

// Load events
async function loadEvents() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: events, error } = await supabase
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
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    allEvents = events || [];
    filteredEvents = allEvents;
    
    renderEvents();
    
  } catch (error) {
    console.error('Error loading events:', error);
    showEmptyState();
  }
}

// Render events
function renderEvents() {
  const eventsGrid = document.getElementById('eventsGrid');
  const eventsEmpty = document.getElementById('eventsEmpty');
  
  if (filteredEvents.length === 0) {
    if (eventsGrid) eventsGrid.classList.add('hidden');
    if (eventsEmpty) eventsEmpty.classList.remove('hidden');
    return;
  }
  
  if (eventsGrid) eventsGrid.classList.remove('hidden');
  if (eventsEmpty) eventsEmpty.classList.add('hidden');
  
  if (eventsGrid) {
    eventsGrid.innerHTML = filteredEvents.map(event => {
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
            <div class="flex gap-2">
              <a href="/dashboard/organizer/events/edit/?id=${event.id}" class="flex-1 px-4 py-2 text-center rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                Edit
              </a>
              <a href="/dashboard/organizer/events/analytics/?id=${event.id}" class="flex-1 px-4 py-2 text-center rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-medium">
                Analytics
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Show empty state
function showEmptyState() {
  const eventsGrid = document.getElementById('eventsGrid');
  const eventsEmpty = document.getElementById('eventsEmpty');
  
  if (eventsGrid) eventsGrid.classList.add('hidden');
  if (eventsEmpty) eventsEmpty.classList.remove('hidden');
}

// Filter events
function filterEvents() {
  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('statusFilter')?.value || '';
  const dateSort = document.getElementById('dateSort')?.value || 'newest';
  
  // Filter by search and status
  filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery) || 
                         event.location?.toLowerCase().includes(searchQuery);
    const matchesStatus = !statusFilter || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort by date
  const now = new Date();
  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.event_date);
    const dateB = new Date(b.event_date);
    
    switch (dateSort) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'upcoming':
        // Show upcoming events first, sorted by event date
        const aUpcoming = dateA >= now;
        const bUpcoming = dateB >= now;
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;
        return dateA - dateB;
      case 'past':
        // Show past events first, sorted by event date (most recent first)
        const aPast = dateA < now;
        const bPast = dateB < now;
        if (aPast && !bPast) return -1;
        if (!aPast && bPast) return 1;
        return dateB - dateA;
      default:
        return 0;
    }
  });
  
  renderEvents();
}

// Set up event listeners
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const dateSort = document.getElementById('dateSort');
  
  if (searchInput) {
    searchInput.addEventListener('input', filterEvents);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterEvents);
  }
  
  if (dateSort) {
    dateSort.addEventListener('change', filterEvents);
  }
}

// Initialize on page load
init();
