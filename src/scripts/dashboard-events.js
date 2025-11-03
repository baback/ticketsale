// Dashboard Events page functionality

// State for event listing
let events = [];
let searchQuery = '';
let selectedCategory = '';

// Show loading skeletons
function showLoading() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;
    
    const skeletons = Array(4).fill(0).map(() => `
        <div class="rounded-3xl overflow-hidden relative h-[400px] border border-neutral-200 dark:border-neutral-800 animate-pulse">
            <div class="absolute inset-0 bg-neutral-200 dark:bg-neutral-800"></div>
        </div>
    `).join('');
    
    eventsGrid.innerHTML = skeletons;
}

// Render events
function renderEvents(eventsToRender = events) {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    if (eventsToRender.length === 0) {
        eventsGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <h3 class="text-2xl font-bold mb-2">No events found</h3>
                <p class="text-neutral-600 dark:text-neutral-400">Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    eventsGrid.innerHTML = eventsToRender.map(event => {
        const eventDate = new Date(event.event_date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        const minPrice = event.ticket_types && event.ticket_types.length > 0 
            ? Math.min(...event.ticket_types.map(t => parseFloat(t.price)))
            : 0;
        
        const priceDisplay = minPrice > 0 ? `$${minPrice.toFixed(2)}` : 'Free';
        
        const availableTickets = event.ticket_types?.reduce((sum, t) => sum + t.available, 0) || 0;
        const status = availableTickets < 10 && availableTickets > 0 ? 'Almost Sold Out' : 
                      availableTickets === 0 ? 'Sold Out' : 'Available';
        
        return `
            <a href="/events/?event=${event.slug}" class="group cursor-pointer rounded-3xl overflow-hidden relative h-[400px] border border-neutral-200 dark:border-neutral-800 hover:shadow-2xl transition-all duration-500 block">
                <div class="absolute inset-0">
                    <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" loading="lazy" />
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                <div class="absolute inset-0 flex flex-col justify-end p-8 text-white">
                    <div class="space-y-4">
                        <div class="flex items-start justify-between gap-4">
                            <h3 class="text-2xl md:text-3xl font-bold font-display">${event.title}</h3>
                            <span class="text-xs px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 whitespace-nowrap font-medium">${status}</span>
                        </div>
                        <div class="flex items-center gap-6 text-sm text-white/80">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <path d="M16 2v4M8 2v4M3 10h18"/>
                                </svg>
                                ${formattedDate}
                            </div>
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                ${event.location}
                            </div>
                        </div>
                        <div class="flex items-center justify-between pt-2">
                            <span class="text-3xl font-bold font-display">${priceDisplay}</span>
                            <span class="px-6 py-3 rounded-full bg-white text-black font-medium group-hover:scale-105 transition-transform shadow-lg inline-block">
                                View Details
                            </span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

// Filter events
function filterEvents() {
    let filtered = events;
    
    if (selectedCategory) {
        filtered = filtered.filter(event => {
            const categories = event.event_category_mappings?.map(m => m.event_categories.name) || [];
            return categories.includes(selectedCategory);
        });
    }
    
    if (searchQuery) {
        filtered = filtered.filter(event => 
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    renderEvents(filtered);
}

// Load events
async function loadEvents() {
    showLoading();
    
    try {
        const { data, error } = await window.supabaseClient
            .from('events')
            .select(`
                *,
                ticket_types (price, available),
                event_category_mappings (
                    event_categories (name)
                )
            `)
            .eq('status', 'published')
            .order('event_date', { ascending: true });

        if (error) throw error;

        events = data.map(event => {
            const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            return {
                ...event,
                slug: `${slug}-${event.id}`
            };
        });

        renderEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        const eventsGrid = document.getElementById('eventsGrid');
        if (eventsGrid) {
            eventsGrid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <h3 class="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Error Loading Events</h3>
                    <p class="text-neutral-600 dark:text-neutral-400">Please try again later</p>
                </div>
            `;
        }
    }
}

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterEvents();
    });
}

// Category filter
const categoryFilter = document.getElementById('categoryFilter');
if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
        selectedCategory = e.target.value;
        filterEvents();
    });
}

// Initialize
loadEvents();
