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
                            <div class="flex items-center justify-end gap-2">
                                ${venue.seat_map ? `
                                <button onclick="viewSeatMap('${venue.id}')" class="px-3 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 text-sm font-medium">
                                    View Map
                                </button>
                                ` : ''}
                                <button onclick="editVenue('${venue.id}')" class="px-3 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 text-sm font-medium">
                                    Edit
                                </button>
                            </div>
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

function viewSeatMap(venueId) {
    const venue = allVenues.find(v => v.id === venueId);
    if (!venue || !venue.seat_map) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const seatMap = venue.seat_map;
    const sections = seatMap.sections || [];
    
    // Generate SVG - pixel perfect layout matching the image
    let svgContent = '';
    
    // Stage at bottom (y=750)
    const stageY = 750;
    const stageHeight = 60;
    svgContent += `<rect x="200" y="${stageY}" width="800" height="${stageHeight}" class="fill-neutral-400 dark:fill-neutral-600"/>`;
    svgContent += `<text x="600" y="${stageY + 38}" class="fill-neutral-900 dark:fill-white font-bold text-2xl" text-anchor="middle">STAGE</text>`;
    
    // Seat dimensions
    const seatSize = 22;
    const seatGap = 4;
    const rowHeight = seatSize + seatGap;
    const seatSpacing = seatSize + seatGap;
    
    // Starting Y position (Row A closest to stage, working upward)
    const startY = stageY - 60; // Gap between stage and Row A
    
    sections.forEach((section, sectionIndex) => {
        let xOffset;
        let labelOffset;
        
        // Position sections: House Right (left), House Centre (middle), House Left (right)
        if (section.id === 'house-right') {
            xOffset = 50;
            labelOffset = -35;
        } else if (section.id === 'house-centre') {
            xOffset = 350;
            labelOffset = -35;
        } else if (section.id === 'house-left') {
            xOffset = 750;
            labelOffset = -35;
        }
        
        // Section title at top
        svgContent += `<text x="${xOffset + 100}" y="30" class="fill-neutral-900 dark:fill-white font-bold text-base">${section.name}</text>`;
        
        const rows = section.rows || [];
        
        // Reverse rows so A is at bottom (closest to stage)
        const reversedRows = [...rows].reverse();
        
        reversedRows.forEach((row, rowIndex) => {
            const seats = section.seats[row] || [];
            const rowY = startY - (rowIndex * rowHeight);
            
            // Row label on left
            svgContent += `<text x="${xOffset + labelOffset}" y="${rowY + 16}" class="fill-neutral-700 dark:fill-neutral-300 text-sm font-semibold">${row}</text>`;
            
            // Seats
            seats.forEach((seatNum, seatIndex) => {
                const seatX = xOffset + (seatIndex * seatSpacing);
                
                // Check if wheelchair accessible seat
                const isWheelchair = seatMap.accessibility?.wheelchair_seats?.includes(`${row}-${seatNum}`);
                
                svgContent += `<rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}" rx="3" class="${isWheelchair ? 'fill-red-500' : 'fill-neutral-300 dark:fill-neutral-700'} stroke-neutral-500 dark:stroke-neutral-500" stroke-width="1"/>`;
                svgContent += `<text x="${seatX + seatSize/2}" y="${rowY + 15}" class="fill-neutral-900 dark:fill-white text-[10px] font-medium" text-anchor="middle">${seatNum}</text>`;
            });
        });
    });

    modal.innerHTML = `
        <div class="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div class="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-950 z-10">
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
            <div class="p-6">
                <div class="bg-neutral-50 dark:bg-black rounded-xl p-8 overflow-auto">
                    <svg viewBox="0 0 1200 850" class="w-full" style="max-height: 70vh;">
                        ${svgContent}
                    </svg>
                </div>
                <div class="mt-4 flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded bg-neutral-300 dark:bg-neutral-700 border border-neutral-500"></div>
                        <span class="text-neutral-600 dark:text-neutral-400">Available Seat</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded bg-red-500"></div>
                        <span class="text-neutral-600 dark:text-neutral-400">Wheelchair Accessible</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-16 h-6 rounded bg-neutral-400 dark:bg-neutral-600"></div>
                        <span class="text-neutral-600 dark:text-neutral-400">Stage</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

window.openAddModal = openAddModal;
window.editVenue = editVenue;
window.viewSeatMap = viewSeatMap;
window.closeModal = closeModal;

document.getElementById('venueForm').addEventListener('submit', saveVenue);

loadVenues();
