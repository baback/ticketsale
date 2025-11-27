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
                    <th class="text-right py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${allVenues.map(venue => `
                    <tr class="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                        <td class="py-4 px-4">
                            <div class="font-medium">${venue.name}</div>
                            <div class="text-sm text-neutral-600 dark:text-neutral-400">${venue.description || 'No description'}</div>
                        </td>
                        <td class="py-4 px-4 text-sm">
                            ${venue.city || 'N/A'}${venue.city && venue.country ? ', ' : ''}${venue.country || ''}
                        </td>
                        <td class="py-4 px-4 text-sm">${venue.capacity || 'N/A'}</td>
                        <td class="py-4 px-4">
                            <span class="px-3 py-1 rounded-full text-xs font-medium ${venue.seat_map ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-neutral-100 dark:bg-neutral-800'}">
                                ${venue.seat_map ? 'Configured' : 'Not Set'}
                            </span>
                        </td>
                        <td class="py-4 px-4 text-right">
                            <button onclick="editVenue('${venue.id}')" class="px-3 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 text-sm font-medium">
                                Edit
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHtml;
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Venue';
    document.getElementById('venueForm').reset();
    document.getElementById('venueId').value = '';
    document.getElementById('venueModal').classList.remove('hidden');
}

function editVenue(venueId) {
    const venue = allVenues.find(v => v.id === venueId);
    if (!venue) return;

    document.getElementById('modalTitle').textContent = 'Edit Venue';
    document.getElementById('venueId').value = venue.id;
    document.getElementById('venueName').value = venue.name || '';
    document.getElementById('venueAddress').value = venue.address || '';
    document.getElementById('venueCity').value = venue.city || '';
    document.getElementById('venueCountry').value = venue.country || 'Canada';
    document.getElementById('venueCapacity').value = venue.capacity || '';
    document.getElementById('venueDescription').value = venue.description || '';
    
    document.getElementById('venueModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('venueModal').classList.add('hidden');
}

async function saveVenue(e) {
    e.preventDefault();

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
            alert('Venue updated successfully!');
        } else {
            // Create new venue
            const { error } = await supabase
                .from('venues')
                .insert([venueData]);

            if (error) throw error;
            alert('Venue created successfully!');
        }

        closeModal();
        await loadVenues();
    } catch (error) {
        console.error('Error saving venue:', error);
        alert('Failed to save venue: ' + error.message);
    }
}

window.openAddModal = openAddModal;
window.editVenue = editVenue;
window.closeModal = closeModal;

document.getElementById('venueForm').addEventListener('submit', saveVenue);

loadVenues();
