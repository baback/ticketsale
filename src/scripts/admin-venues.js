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
    
    // Seat dimensions
    const seatSize = 22;
    const seatGap = 4;
    const rowHeight = seatSize + seatGap;
    const seatSpacing = seatSize + seatGap;
    
    // Find the earliest row (A is earliest) across all sections to position stage
    const allRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    let earliestRowIndex = allRows.length;
    sections.forEach(section => {
        section.rows.forEach(row => {
            const idx = allRows.indexOf(row);
            if (idx !== -1 && idx < earliestRowIndex) {
                earliestRowIndex = idx;
            }
        });
    });
    
    // Layout configuration
    const topMargin = 80;
    const sectionGap = 80; // Gap between sections
    const stageWidth = 900;
    const stageHeight = 60;
    
    // Calculate section widths based on max seat number
    const houseRightWidth = 8 * seatSpacing + 50; // Max 8 seats
    const houseCentreWidth = 24 * seatSpacing + 50; // Max seat 24
    const houseLeftWidth = 32 * seatSpacing + 50; // Max seat 32
    
    // Total width needed
    const totalWidth = houseRightWidth + sectionGap + houseCentreWidth + sectionGap + houseLeftWidth + 100;
    
    // Calculate stage position - centered and below Row A
    const stageY = topMargin + (allRows.length * rowHeight) + 40;
    const stageX = (totalWidth - stageWidth) / 2;
    
    // Draw stage at bottom
    svgContent += `<rect x="${stageX}" y="${stageY}" width="${stageWidth}" height="${stageHeight}" class="fill-neutral-400 dark:fill-neutral-600"/>`;
    svgContent += `<text x="${stageX + stageWidth/2}" y="${stageY + 38}" class="fill-neutral-900 dark:fill-white font-bold text-2xl" text-anchor="middle">STAGE</text>`;
    
    // Position sections
    let currentX = 50;
    
    sections.forEach((section) => {
        let xOffset, sectionWidth, alignment;
        
        if (section.id === 'house-right') {
            xOffset = currentX;
            sectionWidth = houseRightWidth;
            alignment = 'right'; // Right-align seats
        } else if (section.id === 'house-centre') {
            xOffset = currentX + houseRightWidth + sectionGap;
            sectionWidth = houseCentreWidth;
            alignment = 'center'; // Center-align seats
        } else if (section.id === 'house-left') {
            xOffset = currentX + houseRightWidth + sectionGap + houseCentreWidth + sectionGap;
            sectionWidth = houseLeftWidth;
            alignment = 'left'; // Left-align seats
        }
        
        // Section title at top
        svgContent += `<text x="${xOffset + sectionWidth/2}" y="50" class="fill-neutral-900 dark:fill-white font-bold text-lg" text-anchor="middle">${section.name}</text>`;
        
        const rows = section.rows || [];
        
        // Render rows from top to bottom (P to A visually, but A is at bottom near stage)
        rows.forEach((row) => {
            const seats = section.seats[row] || [];
            
            // Calculate Y position: later rows (P, O, N...) at top, earlier rows (A, B, C...) at bottom
            const rowIndexInAllRows = allRows.indexOf(row);
            const rowY = topMargin + ((allRows.length - 1 - rowIndexInAllRows) * rowHeight);
            
            // Calculate seat positioning based on alignment
            let seatsStartX;
            if (alignment === 'right') {
                // Right-align: seats end at right edge
                const maxSeat = Math.max(...seats);
                seatsStartX = xOffset;
            } else if (alignment === 'center') {
                // Center-align
                seatsStartX = xOffset;
            } else {
                // Left-align
                seatsStartX = xOffset;
            }
            
            // Row label
            svgContent += `<text x="${xOffset - 25}" y="${rowY + 16}" class="fill-neutral-700 dark:fill-neutral-300 text-sm font-semibold">${row}</text>`;
            
            // Seats - position based on actual seat number for alignment
            seats.forEach((seatNum) => {
                const seatX = seatsStartX + ((seatNum - 1) * seatSpacing);
                
                // Check if wheelchair accessible seat
                const isWheelchair = seatMap.accessibility?.wheelchair_seats?.includes(`${row}-${seatNum}`);
                
                svgContent += `<rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}" rx="3" class="${isWheelchair ? 'fill-red-500' : 'fill-neutral-300 dark:fill-neutral-700'} stroke-neutral-500 dark:stroke-neutral-500" stroke-width="1"/>`;
                svgContent += `<text x="${seatX + seatSize/2}" y="${rowY + 15}" class="fill-neutral-900 dark:fill-white text-[10px] font-medium" text-anchor="middle">${seatNum}</text>`;
            });
        });
    });

    const viewBoxWidth = totalWidth;
    const viewBoxHeight = stageY + stageHeight + 50;
    
    modal.innerHTML = `
        <div class="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-7xl max-h-[90vh] flex flex-col">
            <div class="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold">${venue.name}</h2>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">${venue.capacity} seats</p>
                </div>
                <div class="flex items-center gap-2">
                    <button id="zoomOut" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg" title="Zoom Out">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/>
                        </svg>
                    </button>
                    <button id="zoomReset" class="px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg text-sm font-medium" title="Reset Zoom">
                        100%
                    </button>
                    <button id="zoomIn" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg" title="Zoom In">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg ml-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-hidden relative">
                <div id="seatMapContainer" class="w-full h-full overflow-auto bg-neutral-50 dark:bg-black cursor-grab active:cursor-grabbing">
                    <svg id="seatMapSvg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" class="w-full h-full" style="min-width: 100%; min-height: 100%;">
                        ${svgContent}
                    </svg>
                </div>
            </div>
            <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-6 text-sm">
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
                <div class="ml-auto text-neutral-500 text-xs">
                    💡 Scroll to zoom, drag to pan
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Add zoom and pan functionality
    const container = modal.querySelector('#seatMapContainer');
    const svg = modal.querySelector('#seatMapSvg');
    const zoomInBtn = modal.querySelector('#zoomIn');
    const zoomOutBtn = modal.querySelector('#zoomOut');
    const zoomResetBtn = modal.querySelector('#zoomReset');
    
    let scale = 1;
    let panning = false;
    let pointX = 0;
    let pointY = 0;
    let start = { x: 0, y: 0 };
    
    function setTransform() {
        svg.style.transform = `scale(${scale})`;
        zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
    }
    
    // Zoom with buttons
    zoomInBtn.onclick = (e) => {
        e.stopPropagation();
        scale = Math.min(scale * 1.2, 3);
        setTransform();
    };
    
    zoomOutBtn.onclick = (e) => {
        e.stopPropagation();
        scale = Math.max(scale / 1.2, 0.5);
        setTransform();
    };
    
    zoomResetBtn.onclick = (e) => {
        e.stopPropagation();
        scale = 1;
        container.scrollLeft = 0;
        container.scrollTop = 0;
        setTransform();
    };
    
    // Zoom with mouse wheel
    container.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        scale = Math.min(Math.max(scale * delta, 0.5), 3);
        setTransform();
    };
    
    // Pan with mouse drag
    container.onmousedown = (e) => {
        if (e.target === container || e.target === svg || e.target.tagName === 'rect' || e.target.tagName === 'text') {
            panning = true;
            start = { x: e.clientX - pointX, y: e.clientY - pointY };
            container.style.cursor = 'grabbing';
        }
    };
    
    container.onmousemove = (e) => {
        if (!panning) return;
        e.preventDefault();
        pointX = e.clientX - start.x;
        pointY = e.clientY - start.y;
        container.scrollLeft = -pointX;
        container.scrollTop = -pointY;
    };
    
    container.onmouseup = () => {
        panning = false;
        container.style.cursor = 'grab';
    };
    
    container.onmouseleave = () => {
        panning = false;
        container.style.cursor = 'grab';
    };
}

window.openAddModal = openAddModal;
window.editVenue = editVenue;
window.viewSeatMap = viewSeatMap;
window.closeModal = closeModal;

document.getElementById('venueForm').addEventListener('submit', saveVenue);

loadVenues();
