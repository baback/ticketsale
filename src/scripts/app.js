// Homepage specific functionality
// Theme and auth are handled by shared.js

// State
let events = [];
let allCategories = [];
let currentCategory = 'All Events';
let searchQuery = '';

// Show loading skeletons
function showLoading() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;
    
    // Create 4 skeleton cards
    const skeletons = Array(4).fill(0).map(() => `
        <div class="rounded-3xl overflow-hidden relative h-[400px] border border-neutral-200 dark:border-neutral-800 animate-pulse">
            <div class="absolute inset-0 bg-neutral-200 dark:bg-neutral-800"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent dark:from-neutral-950/95 dark:via-neutral-950/60"></div>
            <div class="absolute inset-0 flex flex-col justify-end p-8">
                <div class="space-y-4">
                    <div class="flex items-start justify-between gap-4">
                        <div class="h-8 bg-white/20 rounded-lg w-3/4"></div>
                        <div class="h-6 bg-white/20 rounded-full w-20"></div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="h-4 bg-white/20 rounded w-24"></div>
                        <div class="h-4 bg-white/20 rounded w-32"></div>
                    </div>
                    <div class="flex items-center justify-between pt-2">
                        <div class="h-10 bg-white/20 rounded w-20"></div>
                        <div class="h-12 bg-white/20 rounded-full w-32"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    eventsGrid.innerHTML = skeletons;
}

// Show category loading skeletons
function showCategoryLoading() {
    const categoryContainer = document.querySelector('#events .flex');
    if (!categoryContainer) return;
    
    const skeletons = Array(5).fill(0).map(() => `
        <div class="h-12 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full animate-pulse"></div>
    `).join('');
    
    categoryContainer.innerHTML = skeletons;
}

// Show error
function showError(message) {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;
    
    eventsGrid.innerHTML = `
        <div class="col-span-full text-center py-20">
            <svg class="w-16 h-16 mx-auto mb-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="text-2xl font-bold mb-2">Unable to load events</h3>
            <p class="text-neutral-600 dark:text-neutral-400">${message}</p>
        </div>
    `;
}

// Render events
function renderEvents(eventsToRender = events) {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    if (eventsToRender.length === 0) {
        eventsGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <svg class="w-16 h-16 mx-auto mb-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-2xl font-bold mb-2">No events found</h3>
                <p class="text-neutral-600 dark:text-neutral-400">Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    eventsGrid.innerHTML = eventsToRender.map(event => `
        <a href="./events/?event=${event.slug}" class="group cursor-pointer rounded-3xl overflow-hidden relative h-[400px] border border-neutral-200 dark:border-neutral-800 hover:shadow-2xl transition-all duration-500 block">
            <div class="absolute inset-0">
                <img src="${event.image}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" loading="lazy" />
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent dark:from-neutral-950/95 dark:via-neutral-950/60"></div>
            <div class="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <div class="space-y-4">
                    <div class="flex items-start justify-between gap-4">
                        <h3 class="text-2xl md:text-3xl font-bold font-display group-hover:opacity-90 transition-opacity">${event.title}</h3>
                        <span class="text-xs px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 whitespace-nowrap font-medium">${event.status}</span>
                    </div>
                    <div class="flex items-center gap-6 text-sm text-white/80">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <path d="M16 2v4M8 2v4M3 10h18"/>
                            </svg>
                            ${event.date}
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
                        <span class="text-3xl font-bold font-display">${event.price}</span>
                        <span class="px-6 py-3 rounded-full bg-white text-black font-medium group-hover:scale-105 transition-transform shadow-lg inline-block">
                            View Details
                        </span>
                    </div>
                </div>
            </div>
        </a>
    `).join('');
}

// Filter events
function filterEvents() {
    let filtered = events;
    
    if (currentCategory !== 'All Events') {
        filtered = filtered.filter(event => event.category === currentCategory);
    }
    
    if (searchQuery) {
        filtered = filtered.filter(event => 
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    renderEvents(filtered);
}

// Load categories from Supabase
async function loadCategories() {
    showCategoryLoading();
    
    try {
        const { data, error } = await window.supabaseClient
            .from('event_categories')
            .select(`
                *,
                event_category_mappings!inner (
                    events!inner (
                        status
                    )
                )
            `)
            .eq('event_category_mappings.events.status', 'published')
            .order('name');

        if (error) throw error;

        allCategories = data;

        const categoryContainer = document.querySelector('#events .flex');
        if (categoryContainer && data.length > 0) {
            const buttons = data.map(cat => `
                <button type="button" class="px-6 py-3 rounded-full glass border border-neutral-200 dark:border-neutral-800 whitespace-nowrap hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-sm" data-category="${cat.name}">
                    ${cat.name}
                </button>
            `).join('');
            
            categoryContainer.innerHTML = `
                <button type="button" class="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black whitespace-nowrap transition-all shadow-sm font-medium" data-category="All Events">
                    All Events
                </button>
                ${buttons}
            `;

            attachCategoryListeners();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load events from Supabase
async function loadEvents() {
    showLoading();
    
    try {
        const { data, error } = await window.supabaseClient
            .from('events')
            .select(`
                *,
                ticket_types (
                    id,
                    name,
                    price,
                    available
                ),
                event_category_mappings (
                    event_categories (
                        name
                    )
                )
            `)
            .eq('status', 'published')
            .order('event_date', { ascending: true });

        if (error) throw error;

        events = data.map(event => {
            // Create SEO-friendly slug from title and ID
            const slug = event.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            return {
                id: event.id,
                slug: `${slug}-${event.id}`,
                title: event.title,
                date: new Date(event.event_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                }),
                location: event.location,
                price: event.ticket_types && event.ticket_types.length > 0 
                    ? `$${Math.min(...event.ticket_types.map(t => t.price))}`
                    : '$0',
                category: event.event_category_mappings && event.event_category_mappings.length > 0
                    ? event.event_category_mappings[0].event_categories.name
                    : 'Other',
                status: event.ticket_types && event.ticket_types.some(t => t.available < 10) 
                    ? 'Almost Sold Out' 
                    : event.ticket_types && event.ticket_types.some(t => t.available < 50)
                    ? 'Selling Fast'
                    : 'Available',
                image: event.image_url
            };
        });

        renderEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        showError('Please check your connection and try again.');
    }
}

// Attach category listeners
function attachCategoryListeners() {
    const categoryButtons = document.querySelectorAll('#events button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => {
                btn.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black', 'font-medium');
                btn.classList.add('glass', 'border', 'border-neutral-200', 'dark:border-neutral-800');
            });
            
            button.classList.remove('glass', 'border', 'border-neutral-200', 'dark:border-neutral-800');
            button.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black', 'font-medium');
            
            currentCategory = button.dataset.category || button.textContent.trim();
            filterEvents();
        });
    });
}

// Search functionality
const searchInput = document.querySelector('input[type="text"][placeholder="Search events..."]');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterEvents();
    });
}

// Initialize
if (document.getElementById('eventsGrid')) {
    loadCategories();
    loadEvents();
}
