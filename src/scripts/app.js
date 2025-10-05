// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Set dark mode as default
if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'dark');
    html.classList.add('dark');
}

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    html.classList.add('dark');
} else {
    html.classList.remove('dark');
}

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const theme = html.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Events will be loaded from Supabase
let events = [];
let allCategories = [];

// Show loading state
function showLoading() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;
    
    eventsGrid.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20">
            <div class="animate-spin rounded-full h-16 w-16 border-4 border-neutral-200 dark:border-neutral-800 border-t-black dark:border-t-white mb-4"></div>
            <p class="text-neutral-600 dark:text-neutral-400">Loading events...</p>
        </div>
    `;
}

// Show error state
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

// REMOVED FALLBACK DATA - Now only loads from Supabase

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
                <p class="text-neutral-600 dark:text-neutral-400">Check back soon for upcoming events</p>
            </div>
        `;
        return;
    }

    eventsGrid.innerHTML = eventsToRender.map(event => `
        <div class="group cursor-pointer rounded-3xl overflow-hidden relative h-[400px] border border-neutral-200 dark:border-neutral-800 hover:shadow-2xl transition-all duration-500">
            <!-- Background Image with Grayscale -->
            <div class="absolute inset-0">
                <img src="${event.image}" alt="${event.title}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" loading="lazy" />
            </div>
            
            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent dark:from-neutral-950/95 dark:via-neutral-950/60"></div>
            
            <!-- Content -->
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
                        <a href="./login/" class="px-6 py-3 rounded-full bg-white text-black font-medium hover:scale-105 transition-transform shadow-lg inline-block">
                            Get Tickets
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// REMOVED OLD FALLBACK EVENTS DATA

// Load categories from Supabase (only those with events)
async function loadCategories() {
    try {
        const { data, error } = await window.supabaseClient
            .from('event_categories')
            .select(`
                *,
                event_category_mappings (
                    event_id,
                    events!inner (
                        status
                    )
                )
            `)
            .order('name');

        if (error) throw error;

        // Filter categories that have published events
        const categoriesWithEvents = data.filter(cat => 
            cat.event_category_mappings && 
            cat.event_category_mappings.some(mapping => 
                mapping.events && mapping.events.status === 'published'
            )
        );

        allCategories = categoriesWithEvents;

        // Update category buttons
        const categoryContainer = document.querySelector('#categories .flex');
        if (categoryContainer && categoriesWithEvents.length > 0) {
            const buttons = categoriesWithEvents.map(cat => `
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

            // Re-attach event listeners
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
        const { data, error} = await window.supabaseClient
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

        // Transform Supabase data to match our format
        events = data.map(event => ({
            id: event.id,
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
        }));

        renderEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        showError('Please check your connection and try again.');
    }
}


    if (!eventsGrid) return;

    eventsGrid.innerHTML = eventsToRender.map(event => `
        <div class="group cursor-pointer rounded-3xl overflow-hidden relative h-[400px] border border-neutral-200 dark:border-neutral-800 hover:shadow-2xl transition-all duration-500">
            <!-- Background Image -->
            <div class="absolute inset-0">
                <img src="${event.image}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" loading="lazy" />
            </div>
            
            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent dark:from-neutral-950/95 dark:via-neutral-950/60"></div>
            
            <!-- Content -->
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
                        <a href="./login/" class="px-6 py-3 rounded-full bg-white text-black font-medium hover:scale-105 transition-transform shadow-lg inline-block">
                            Get Tickets
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter state
let currentCategory = 'All Events';
let searchQuery = '';

// Filter events based on category and search
function filterEvents() {
    let filtered = events;

    // Filter by category
    if (currentCategory !== 'All Events') {
        filtered = filtered.filter(event => event.category === currentCategory);
    }

    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(event =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    renderEvents(filtered);

    // Show message if no results
    if (filtered.length === 0) {
        document.getElementById('eventsGrid').innerHTML = `
            <div class="col-span-full text-center py-20">
                <svg class="w-16 h-16 mx-auto mb-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-2xl font-bold mb-2">No events found</h3>
                <p class="text-neutral-600 dark:text-neutral-400">Try adjusting your search or filters</p>
            </div>
        `;
    }
}

// Search functionality
const searchInput = document.querySelector('input[type="text"][placeholder="Search events..."]');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterEvents();
    });
}

// Category buttons
const categoryButtons = document.querySelectorAll('#categories button');
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active state
        categoryButtons.forEach(btn => {
            btn.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
            btn.classList.add('glass', 'border', 'border-neutral-200', 'dark:border-neutral-800');
        });

        button.classList.remove('glass', 'border', 'border-neutral-200', 'dark:border-neutral-800');
        button.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');

        // Update category and filter
        currentCategory = button.textContent.trim();
        filterEvents();
    });
});

// Load categories from Supabase
async function loadCategories() {
    try {
        const { data, error } = await window.supabaseClient
            .from('event_categories')
            .select('*')
            .order('name');

        if (error) throw error;

        // Update category buttons
        const categoryContainer = document.querySelector('#categories .flex');
        if (categoryContainer && data) {
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

            // Re-attach event listeners
            attachCategoryListeners();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load events from Supabase
async function loadEvents() {
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

        // Transform Supabase data to match our format
        events = data.map(event => ({
            id: event.id,
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
                : event.category || 'Other',
            status: event.ticket_types && event.ticket_types.some(t => t.available < 10)
                ? 'Almost Sold Out'
                : event.ticket_types && event.ticket_types.some(t => t.available < 50)
                    ? 'Selling Fast'
                    : 'Available',
            image: event.image_url
        }));

        renderEvents();
    } catch (error) {
        console.error('Error loading events:', error);
        // Use fallback data if Supabase fails
        events = fallbackEvents;
        renderEvents();
    }
}

// Attach category button listeners
function attachCategoryListeners() {
    const categoryButtons = document.querySelectorAll('#categories button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            categoryButtons.forEach(btn => {
                btn.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black', 'font-medium');
                btn.classList.add('glass', 'border', 'border-neutral-200', 'dark:border-neutral-800');
            });

            button.classList.remove('glass', 'border', 'border-neutral-200', 'dark:border-neutral-800');
            button.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black', 'font-medium');

            // Update category and filter
            currentCategory = button.dataset.category || button.textContent.trim();
            filterEvents();
        });
    });
}

// Initialize on page load
if (document.getElementById('eventsGrid')) {
    loadCategories();
    loadEvents();
}
