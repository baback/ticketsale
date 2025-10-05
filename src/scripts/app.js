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

// Sample events data
const events = [
    {
        id: 1,
        title: "Midnight Jazz Sessions",
        date: "Feb 15, 2025",
        location: "Toronto, ON",
        price: "$45",
        category: "Music",
        status: "Available",
        image: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 2,
        title: "Underground Electronic Night",
        date: "Mar 8, 2025",
        location: "Montreal, QC",
        price: "$35",
        category: "Music",
        status: "Almost Sold Out",
        image: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 3,
        title: "Indie Rock Festival",
        date: "Feb 28, 2025",
        location: "Vancouver, BC",
        price: "$65",
        category: "Music",
        status: "Selling Fast",
        image: "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 4,
        title: "Classical Symphony Night",
        date: "Mar 12, 2025",
        location: "Toronto, ON",
        price: "$80",
        category: "Music",
        status: "Available",
        image: "https://images.pexels.com/photos/210922/pexels-photo-210922.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 5,
        title: "Hip Hop Block Party",
        date: "Apr 5, 2025",
        location: "Calgary, AB",
        price: "$40",
        category: "Music",
        status: "Available",
        image: "https://images.pexels.com/photos/1916824/pexels-photo-1916824.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 6,
        title: "Acoustic Sunset Sessions",
        date: "Feb 20, 2025",
        location: "Ottawa, ON",
        price: "$30",
        category: "Music",
        status: "Available",
        image: "https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 7,
        title: "EDM Warehouse Rave",
        date: "Mar 18, 2025",
        location: "Toronto, ON",
        price: "$50",
        category: "Music",
        status: "Selling Fast",
        image: "https://images.pexels.com/photos/1763067/pexels-photo-1763067.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 8,
        title: "Blues & Soul Night",
        date: "Feb 25, 2025",
        location: "Montreal, QC",
        price: "$38",
        category: "Music",
        status: "Available",
        image: "https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 9,
        title: "Tech Summit 2025",
        date: "Mar 22, 2025",
        location: "Vancouver, BC",
        price: "$120",
        category: "Tech",
        status: "Available",
        image: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 10,
        title: "Punk Rock Showcase",
        date: "Apr 10, 2025",
        location: "Toronto, ON",
        price: "$28",
        category: "Music",
        status: "Available",
        image: "https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 11,
        title: "Latin Music Fiesta",
        date: "Mar 28, 2025",
        location: "Calgary, AB",
        price: "$42",
        category: "Music",
        status: "Selling Fast",
        image: "https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    },
    {
        id: 12,
        title: "Contemporary Art Exhibition",
        date: "Apr 15, 2025",
        location: "Montreal, QC",
        price: "$25",
        category: "Arts",
        status: "Available",
        image: "https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    }
];

// Render events
function renderEvents(eventsToRender = events) {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

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

// Initialize events on page load
if (document.getElementById('eventsGrid')) {
    renderEvents();
}
