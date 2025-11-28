// Reusable Seat Map Renderer
// Can be used for: viewing, selecting seats, showing availability, etc.

class SeatMapRenderer {
    constructor(container, seatMapData, options = {}) {
        this.container = container;
        this.seatMapData = seatMapData;
        this.options = {
            interactive: options.interactive || false,
            showAvailability: options.showAvailability || false,
            soldSeats: options.soldSeats || [],
            selectedSeats: options.selectedSeats || [],
            onSeatClick: options.onSeatClick || null,
            onSeatHover: options.onSeatHover || null,
            mode: options.mode || 'view' // 'view', 'select', 'admin'
        };
        
        this.scale = 1;
        this.render();
    }
    
    render() {
        const sections = this.seatMapData.sections || [];
        const allRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
        
        // Create main container with simple pan/zoom
        this.container.innerHTML = `
            <div class="seat-map-wrapper relative w-full h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                <div class="seat-map-controls absolute top-4 right-4 z-10 flex gap-2">
                    <button class="zoom-out px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/>
                        </svg>
                    </button>
                    <button class="zoom-reset px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                        100%
                    </button>
                    <button class="zoom-in px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                    </button>
                </div>
                <div class="seat-map-container w-full h-full cursor-grab" style="overflow: hidden;">
                    <div class="seat-map-content transition-transform duration-200" style="transform-origin: center center;">
                        ${this.renderSeatMap(sections, allRows)}
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    renderSeatMap(sections, allRows) {
        // Wrap everything in a centered container with large padding for panning
        let html = '<div class="seat-map-canvas" style="padding: 400px; display: flex; flex-direction: column; align-items: center;">';
        
        html += '<div class="flex gap-12 items-start justify-center">';
        
        // Render each section
        sections.forEach((section) => {
            html += this.renderSection(section, allRows);
        });
        
        html += '</div>';
        
        // Add stage
        html += `
            <div class="mt-8" style="width: 800px;">
                <div class="bg-neutral-400 dark:bg-neutral-600 rounded-lg py-6 text-center">
                    <span class="text-2xl font-bold text-neutral-900 dark:text-white">STAGE</span>
                </div>
            </div>
        `;
        
        html += '</div>'; // Close canvas wrapper
        
        return html;
    }
    
    renderSection(section, allRows) {
        const rows = section.rows || [];
        
        // Determine alignment based on section
        let alignClass = 'items-center'; // default center
        if (section.id === 'house-right') {
            alignClass = 'items-end'; // right align
        } else if (section.id === 'house-left') {
            alignClass = 'items-start'; // left align
        }
        
        let html = `<div class="seat-section flex flex-col ${alignClass}">`;
        
        // Section title
        html += `<h3 class="text-lg font-bold mb-6 text-neutral-900 dark:text-white">${section.name}</h3>`;
        
        // Render rows from P to A (top to bottom visually)
        html += `<div class="flex flex-col gap-1 ${alignClass}">`;
        
        // Render ALL rows (A-P) but show empty space for missing rows
        // This ensures all sections align horizontally
        const reversedAllRows = [...allRows].reverse();
        
        reversedAllRows.forEach((row) => {
            if (rows.includes(row)) {
                // This section has this row - render it
                html += this.renderRow(row, section.seats[row] || [], section.id);
            } else {
                // This section doesn't have this row - render empty space
                html += `<div class="seat-row-empty" style="height: 32px;"></div>`;
            }
        });
        
        html += '</div></div>';
        
        return html;
    }
    
    renderRow(rowLabel, seats, sectionId) {
        // Determine row layout based on section
        let rowLayout = 'flex items-center gap-1';
        
        if (sectionId === 'house-right') {
            // House Right: label on left, seats on right
            rowLayout = 'flex items-center gap-1 justify-end';
        } else if (sectionId === 'house-left') {
            // House Left: label on left, seats on right
            rowLayout = 'flex items-center gap-1 justify-start';
        } else {
            // House Centre: centered
            rowLayout = 'flex items-center gap-1 justify-center';
        }
        
        let html = `<div class="seat-row ${rowLayout}">`;
        
        // Row label on LEFT
        html += `<span class="row-label w-8 text-sm font-semibold text-neutral-700 dark:text-neutral-300 text-right mr-2">${rowLabel}</span>`;
        
        // Seats container - just render the actual seats, no spacers
        html += '<div class="seats-container flex gap-1">';
        
        // Only render actual seats, no spacers
        seats.forEach((seatNum) => {
            const seatId = `${rowLabel}-${seatNum}`;
            const isWheelchair = this.seatMapData.accessibility?.wheelchair_seats?.includes(seatId);
            const isSold = this.options.soldSeats.includes(seatId);
            const isSelected = this.options.selectedSeats.includes(seatId);
            
            let seatClass = 'seat available';
            if (isSold) seatClass = 'seat sold';
            else if (isSelected) seatClass = 'seat selected';
            else if (isWheelchair) seatClass = 'seat wheelchair';
            
            html += `
                <button 
                    class="${seatClass} ${this.options.interactive ? 'interactive' : ''}"
                    data-seat-id="${seatId}"
                    data-row="${rowLabel}"
                    data-seat="${seatNum}"
                    data-section="${sectionId}"
                    ${isSold ? 'disabled' : ''}
                    title="Seat ${seatId}${isWheelchair ? ' (Wheelchair Accessible)' : ''}"
                >
                    <span class="seat-number">${seatNum}</span>
                </button>
            `;
        });
        
        html += '</div>';
        
        // Row label on RIGHT
        html += `<span class="row-label w-8 text-sm font-semibold text-neutral-700 dark:text-neutral-300 text-left ml-2">${rowLabel}</span>`;
        
        html += '</div>';
        
        return html;
    }
    
    attachEventListeners() {
        const mapContainer = this.container.querySelector('.seat-map-container');
        const mapContent = this.container.querySelector('.seat-map-content');
        const zoomInBtn = this.container.querySelector('.zoom-in');
        const zoomOutBtn = this.container.querySelector('.zoom-out');
        const zoomResetBtn = this.container.querySelector('.zoom-reset');
        
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        
        const updateTransform = () => {
            mapContent.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
        };
        
        // Zoom controls
        zoomInBtn.onclick = () => {
            scale = Math.min(scale * 1.2, 3);
            updateTransform();
        };
        
        zoomOutBtn.onclick = () => {
            scale = Math.max(scale / 1.2, 0.3);
            updateTransform();
        };
        
        zoomResetBtn.onclick = () => {
            scale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
        };
        
        // Mouse wheel zoom
        mapContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const oldScale = scale;
            scale = Math.min(Math.max(scale * delta, 0.3), 3);
            
            // Zoom towards mouse position
            const rect = mapContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            translateX = mouseX - (mouseX - translateX) * (scale / oldScale);
            translateY = mouseY - (mouseY - translateY) * (scale / oldScale);
            
            updateTransform();
        });
        
        // Pan with mouse drag
        mapContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('seat') || e.target.closest('.seat')) return;
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            mapContainer.style.cursor = 'grabbing';
        });
        
        mapContainer.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        });
        
        mapContainer.addEventListener('mouseup', () => {
            isDragging = false;
            mapContainer.style.cursor = 'grab';
        });
        
        mapContainer.addEventListener('mouseleave', () => {
            isDragging = false;
            mapContainer.style.cursor = 'grab';
        });
        
        // Initial fit to view
        setTimeout(() => {
            const canvas = mapContent.querySelector('.seat-map-canvas');
            if (canvas) {
                const containerRect = mapContainer.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                
                const scaleX = (containerRect.width * 0.85) / canvasRect.width;
                const scaleY = (containerRect.height * 0.85) / canvasRect.height;
                scale = Math.min(scaleX, scaleY, 1);
                
                // Center it
                translateX = (containerRect.width - canvasRect.width * scale) / 2;
                translateY = (containerRect.height - canvasRect.height * scale) / 2;
                
                updateTransform();
            }
        }, 100);
        
        // Seat interactions
        if (this.options.interactive) {
            const seats = this.container.querySelectorAll('.seat.interactive');
            
            seats.forEach(seat => {
                seat.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.options.onSeatClick) {
                        const seatId = seat.dataset.seatId;
                        const row = seat.dataset.row;
                        const seatNum = seat.dataset.seat;
                        const section = seat.dataset.section;
                        this.options.onSeatClick({ seatId, row, seat: seatNum, section }, seat);
                    }
                });
                
                seat.addEventListener('mouseenter', (e) => {
                    if (this.options.onSeatHover) {
                        const seatId = seat.dataset.seatId;
                        this.options.onSeatHover({ seatId }, seat);
                    }
                });
            });
        }
    }
    
    // Public methods for updating seat states
    updateSeatState(seatId, state) {
        const seat = this.container.querySelector(`[data-seat-id="${seatId}"]`);
        if (!seat) return;
        
        seat.className = `seat ${state} ${this.options.interactive ? 'interactive' : ''}`;
        if (state === 'sold') {
            seat.disabled = true;
        }
    }
    
    getSelectedSeats() {
        const selected = this.container.querySelectorAll('.seat.selected');
        return Array.from(selected).map(s => s.dataset.seatId);
    }
}

// Export for use in other scripts
window.SeatMapRenderer = SeatMapRenderer;
