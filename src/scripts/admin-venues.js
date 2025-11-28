// Admin Venues Management

let allVenues = [];

async function loadVenues() {
    try {
        const { data: venues, error } = await supabase
            .from('venues')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allVenues = venues || [];
        renderTable();
    } catch (error) {
        console.error('Error loading venues:', error);
        document.getElementById('venuesTable').innerHTML = 
            '<div class="text-center py-8 text-red-500">Error loading venues</div>';
    }
}

function renderTable() {
    const container = document.getElementById('venuesTable');

    if (allVenues.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-neutral-500">No venues found. Click "Add Venue" to create one.</div>';
        return;
    }

    const tableHtml = `
        <table class="w-full">
            <thead>
                <tr class="border-b border-neutral-200 dark:border-neutral-800">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Venue</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Location</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Capacity</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Seat Map</th>
                </tr>
            </thead>
            <tbody>
                ${allVenues.map(venue => `
                    <tr class="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer" onclick="openEditSidebar('${venue.id}')">
                        <td class="py-4 px-4">
                            <div class="font-medium">${venue.name}</div>
                            <div class="text-sm text-neutral-600 dark:text-neutral-400">${venue.description || 'No description'}</div>
                        </td>
                        <td class="py-4 px-4 text-sm">
                            ${venue.city || 'N/A'}${venue.city && venue.country ? ', ' : ''}${venue.country || ''}
                        </td>
                        <td class="py-4 px-4 text-sm">${venue.capacity || 'N/A'}</td>
                        <td class="py-4 px-4">
                            ${venue.seat_map ? `
                                <span class="px-3 py-1 rounded-full text-xs font-medium bg-black dark:bg-white text-white dark:text-black">
                                    Configured
                                </span>
                            ` : `
                                <span class="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                                    Not Set
                                </span>
                            `}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHtml;
}

function openAddModal() {
    openEditSidebar(null);
}

function openEditSidebar(venueId) {
    const sidebar = document.getElementById('editSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const venue = venueId ? allVenues.find(v => v.id === venueId) : null;
    
    sidebar.innerHTML = `
        <div class="h-full flex flex-col">
            <div class="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h2 class="text-xl font-bold">${venue ? 'Edit Venue' : 'Add Venue'}</h2>
                <button onclick="closeSidebar()" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <form id="venueForm" class="space-y-6">
                    <input type="hidden" id="venueId" value="${venue?.id || ''}">
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Venue Name</label>
                        <input type="text" id="venueName" value="${venue?.name || ''}" required
                            class="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Description</label>
                        <textarea id="venueDescription" rows="3"
                            class="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">${venue?.description || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Address</label>
                        <input type="text" id="venueAddress" value="${venue?.address || ''}"
                            class="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">City</label>
                            <input type="text" id="venueCity" value="${venue?.city || ''}"
                                class="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Country</label>
                            <input type="text" id="venueCountry" value="${venue?.country || 'Canada'}"
                                class="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Capacity</label>
                        <input type="number" id="venueCapacity" value="${venue?.capacity || ''}"
                            class="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                    </div>
                    
                    ${venue?.seat_map ? `
                        <div class="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <button type="button" onclick="viewSeatMap('${venue.id}')" 
                                class="w-full px-4 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition-transform font-medium">
                                View Seat Map
                            </button>
                        </div>
                    ` : ''}
                </form>
            </div>
            
            <div class="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-3">
                <button onclick="closeSidebar()" class="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900">
                    Cancel
                </button>
                <button onclick="saveVenue(event)" class="flex-1 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:scale-105 transition-transform font-medium">
                    ${venue ? 'Save Changes' : 'Create Venue'}
                </button>
            </div>
        </div>
    `;
    
    sidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
}

function closeSidebar() {
    document.getElementById('editSidebar').classList.add('translate-x-full');
    document.getElementById('sidebarOverlay').classList.add('hidden');
}

async function saveVenue(e) {
    if (e) e.preventDefault();

    const venueId = document.getElementById('venueId').value;
    const venueData = {
        name: document.getElementById('venueName').value,
        address: document.getElementById('venueAddress').value,
        city: document.getElementById('venueCity').value,
        country: document.getElementById('venueCountry').value,
        capacity: parseInt(document.getElementById('venueCapacity').value) || null,
        description: document.getElementById('venueDescription').value
    };

    try {
        if (venueId) {
            // Update existing venue
            const { error } = await supabase
                .from('venues')
                .update(venueData)
                .eq('id', venueId);

            if (error) throw error;
        } else {
            // Create new venue
            const { error } = await supabase
                .from('venues')
                .insert([venueData]);

            if (error) throw error;
        }

        closeSidebar();
        await loadVenues();
    } catch (error) {
        console.error('Error saving venue:', error);
        alert('Failed to save venue: ' + error.message);
    }
}

function viewSeatMap(venueId) {
    const venue = allVenues.find(v => v.id === venueId);
    if (!venue || !venue.seat_map) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-7xl h-[90vh] flex flex-col" onclick="event.stopPropagation()">
            <div class="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold">${venue.name}</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">${venue.capacity} seats</p>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="flex-1 overflow-hidden" id="seatMapRendererContainer"></div>
            <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded bg-neutral-300 dark:bg-neutral-700 border border-neutral-500"></div>
                    <span class="text-neutral-600 dark:text-neutral-400">Available</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded bg-red-600"></div>
                    <span class="text-neutral-600 dark:text-neutral-400">Wheelchair Accessible</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize seat map renderer
    const container = modal.querySelector('#seatMapRendererContainer');
    new SeatMapRenderer(container, venue.seat_map, {
        interactive: false,
        mode: 'view'
    });
}

window.openAddModal = openAddModal;
window.openEditSidebar = openEditSidebar;
window.closeSidebar = closeSidebar;
window.viewSeatMap = viewSeatMap;
window.saveVenue = saveVenue;

loadVenues();
