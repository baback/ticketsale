// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'dark');
    html.classList.add('dark');
}

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

// Check if user is logged in and update nav
async function updateNavAuth() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    const signInLink = document.querySelector('a[href="../login/"]');
    
    if (session && signInLink) {
        // User is logged in, change to Dashboard
        signInLink.href = '../dashboard/';
        signInLink.textContent = 'Dashboard';
    }
}

// Initialize auth check
updateNavAuth();

// Get event ID from URL (extracts ID from slug format: event-name-uuid)
function getEventId() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('event');
    
    if (!slug) return null;
    
    // Extract UUID from the end of the slug (last 36 characters)
    // Format: event-name-10000000-0000-0000-0000-000000000001
    const parts = slug.split('-');
    if (parts.length >= 5) {
        // UUID is the last 5 parts joined with hyphens
        const uuid = parts.slice(-5).join('-');
        return uuid;
    }
    
    return null;
}

// Show skeleton loading
function showSkeleton() {
    const content = document.getElementById('eventContent');
    content.innerHTML = `
        <div class="space-y-8 animate-pulse">
            <!-- Hero Image Skeleton -->
            <div class="w-full h-[400px] md:h-[500px] rounded-3xl bg-neutral-200 dark:bg-neutral-800"></div>
            
            <!-- Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Main Content -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-3/4"></div>
                    <div class="flex gap-4">
                        <div class="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-32"></div>
                        <div class="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-40"></div>
                    </div>
                    <div class="space-y-3">
                        <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
                        <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
                        <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
                    </div>
                </div>
                
                <!-- Sidebar -->
                <div class="space-y-6">
                    <div class="glass rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 space-y-6">
                        <div class="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2"></div>
                        <div class="space-y-4">
                            <div class="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
                            <div class="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
                        </div>
                        <div class="h-14 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show error
function showError(message) {
    const content = document.getElementById('eventContent');
    content.innerHTML = `
        <div class="text-center py-20">
            <svg class="w-16 h-16 mx-auto mb-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="text-2xl font-bold mb-2">Event Not Found</h3>
            <p class="text-neutral-600 dark:text-neutral-400 mb-6">${message}</p>
            <a href="/" class="inline-block px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:scale-105 transition-transform">
                Browse Events
            </a>
        </div>
    `;
}

// Render event
function renderEvent(event) {
    const content = document.getElementById('eventContent');
    
    // Update page title
    document.title = `${event.title} - ticketsale.ca`;
    
    // Format date
    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
    
    // Get categories
    const categories = event.event_category_mappings?.map(m => m.event_categories.name).join(', ') || 'General';
    
    content.innerHTML = `
        <div class="space-y-8">
            <!-- Hero Image -->
            <div class="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            
            <!-- Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Main Content -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Title & Meta -->
                    <div class="space-y-4">
                        <h1 class="text-4xl md:text-5xl font-bold font-display">${event.title}</h1>
                        <div class="flex flex-wrap gap-4 text-neutral-600 dark:text-neutral-400">
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <path d="M16 2v4M8 2v4M3 10h18"/>
                                </svg>
                                <span>${formattedDate}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span>${event.location}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                                </svg>
                                <span>${categories}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Description -->
                    <div class="glass rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-lg">
                        <h2 class="text-2xl font-bold mb-4 font-display">About This Event</h2>
                        <p class="text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">${event.description || 'No description available.'}</p>
                    </div>
                    
                    <!-- Organizer Info -->
                    ${event.users ? `
                    <div class="glass rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-lg">
                        <h2 class="text-2xl font-bold mb-4 font-display">Organizer</h2>
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold">${event.users.full_name || 'Event Organizer'}</div>
                                <div class="text-sm text-neutral-600 dark:text-neutral-400">${event.users.email}</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Sidebar - Ticket Selection -->
                <div class="space-y-6">
                    <div class="glass rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-lg sticky top-24">
                        <h2 class="text-2xl font-bold mb-6 font-display">Select Tickets</h2>
                        
                        ${event.ticket_types && event.ticket_types.length > 0 ? `
                        <div class="space-y-4 mb-6">
                            ${event.ticket_types.map(ticket => `
                                <div class="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <div class="font-semibold">${ticket.name}</div>
                                            <div class="text-sm text-neutral-600 dark:text-neutral-400">${ticket.description || ''}</div>
                                        </div>
                                        <div class="text-xl font-bold font-display">$${ticket.price}</div>
                                    </div>
                                    <div class="text-xs text-neutral-600 dark:text-neutral-400">
                                        ${ticket.available > 0 ? `${ticket.available} available` : 'Sold Out'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ` : `
                        <div class="text-center py-8 text-neutral-600 dark:text-neutral-400">
                            No tickets available at this time.
                        </div>
                        `}
                        
                        <a href="../login/" class="block w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-center hover:scale-105 transition-transform shadow-lg">
                            Get Tickets
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load event data
async function loadEvent() {
    const eventId = getEventId();
    
    if (!eventId) {
        showError('No event ID provided.');
        return;
    }
    
    showSkeleton();
    
    try {
        const { data, error } = await window.supabaseClient
            .from('events')
            .select(`
                *,
                ticket_types (
                    id,
                    name,
                    description,
                    price,
                    available
                ),
                event_category_mappings (
                    event_categories (
                        name
                    )
                ),
                users (
                    full_name,
                    email
                )
            `)
            .eq('id', eventId)
            .eq('status', 'published')
            .single();

        if (error) throw error;
        
        if (!data) {
            showError('This event could not be found or is no longer available.');
            return;
        }

        renderEvent(data);
    } catch (error) {
        console.error('Error loading event:', error);
        showError('Unable to load event details. Please try again later.');
    }
}

// Initialize
loadEvent();
