// Ticket Scanner Script

let html5QrCode = null;
let selectedEventId = null;
let eventData = null;
let recentScans = [];
let isProcessing = false;
let currentFilter = 'all';

// Initialize
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '/login/';
        return;
    }
    
    await loadEvents();
    setupEventListeners();
    
    // Check if event is pre-selected from URL
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedEventId = urlParams.get('event');
    if (preSelectedEventId) {
        document.getElementById('eventSelect').value = preSelectedEventId;
        await handleEventSelect({ target: { value: preSelectedEventId } });
    }
}

// Load organizer's events
async function loadEvents() {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('id, title, event_date, status')
            .eq('organizer_id', (await supabase.auth.getUser()).data.user.id)
            .order('event_date', { ascending: false });
        
        if (error) throw error;
        
        const select = document.getElementById('eventSelect');
        
        if (events.length === 0) {
            select.innerHTML = '<option value="">No events found</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Select an event...</option>' +
            events.map(event => {
                const date = new Date(event.event_date).toLocaleDateString();
                return `<option value="${event.id}">${event.title} - ${date}</option>`;
            }).join('');
        
    } catch (error) {
        console.error('Error loading events:', error);
        alert('Failed to load events');
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('eventSelect').addEventListener('change', handleEventSelect);
    document.getElementById('manualCheckBtn').addEventListener('click', handleManualCheck);
    document.getElementById('manualTicketId').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleManualCheck();
    });
    
    // Filter buttons
    document.querySelectorAll('.activity-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');
            setFilter(filter);
        });
    });
}

// Set activity filter
function setFilter(filter) {
    currentFilter = filter;
    
    // Update button states
    document.querySelectorAll('.activity-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.remove('text-neutral-600', 'dark:text-neutral-400', 'hover:bg-neutral-100', 'dark:hover:bg-neutral-800');
            btn.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
        } else {
            btn.classList.add('text-neutral-600', 'dark:text-neutral-400', 'hover:bg-neutral-100', 'dark:hover:bg-neutral-800');
            btn.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
        }
    });
    
    // Re-render scans with filter
    renderRecentScans();
}

// Handle event selection
async function handleEventSelect(e) {
    selectedEventId = e.target.value;
    
    if (!selectedEventId) {
        document.getElementById('scannerSection').classList.add('hidden');
        if (html5QrCode) {
            html5QrCode.stop();
        }
        return;
    }
    
    await loadEventData();
    await loadScanLogs(); // Load scan history from database
    document.getElementById('scannerSection').classList.remove('hidden');
    startScanner();
}

// Load event data and stats
async function loadEventData() {
    try {
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('id, checked_in_at, status')
            .eq('event_id', selectedEventId);
        
        if (error) throw error;
        
        const checkedIn = tickets.filter(t => t.checked_in_at).length;
        const total = tickets.length;
        
        document.getElementById('checkedInCount').textContent = checkedIn;
        document.getElementById('totalTickets').textContent = total;
        
    } catch (error) {
        console.error('Error loading event data:', error);
    }
}

// Start QR scanner
function startScanner() {
    if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
    }
    
    html5QrCode = new Html5Qrcode("qr-reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).catch(err => {
        console.error('Scanner start error:', err);
        alert('Failed to start camera. Please check permissions.');
    });
}

// Handle successful QR scan
async function onScanSuccess(decodedText, decodedResult) {
    if (isProcessing) return;
    isProcessing = true;
    
    // Vibrate on scan (mobile)
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
    
    // Extract ticket ID from URL or use QR code directly
    let ticketId = decodedText;
    let isQrCode = false;
    
    if (decodedText.includes('verify?t=')) {
        // It's a URL with ticket ID
        const url = new URL(decodedText);
        ticketId = url.searchParams.get('t');
    } else if (decodedText.length === 32 && /^[A-F0-9]+$/i.test(decodedText)) {
        // It's a QR code (32 character hex string)
        isQrCode = true;
    }
    
    await processTicket(ticketId, isQrCode);
    
    // Reset processing after delay
    setTimeout(() => {
        isProcessing = false;
    }, 2000);
}

// Handle scan errors (silent)
function onScanError(error) {
    // Ignore scan errors (they happen constantly while scanning)
}

// Process ticket
async function processTicket(ticketId, isQrCode = false) {
    try {
        // Fetch ticket details - search by QR code or ID
        let query = supabase
            .from('tickets')
            .select(`
                *,
                ticket_types (name, price),
                orders (customer_name, customer_email, status),
                events (id, title)
            `);
        
        if (isQrCode) {
            query = query.eq('qr_code', ticketId);
        } else {
            query = query.eq('id', ticketId);
        }
        
        const { data: ticket, error } = await query.single();
        
        if (error || !ticket) {
            console.error('Ticket lookup error:', error, 'Searched for:', ticketId, 'Is QR Code:', isQrCode);
            showError('Ticket not found');
            flashScanner('error');
            playSound('error');
            return;
        }
        
        console.log('Ticket found:', ticket.id, 'QR Code:', ticket.qr_code);
        
        // Validate ticket
        const validation = validateTicket(ticket);
        
        if (!validation.valid) {
            showError(validation.message);
            flashScanner('error');
            playSound('error');
            addToRecentScans(ticket, 'error', validation.message);
            return;
        }
        
        // Show ticket details modal
        showTicketModal(ticket);
        flashScanner('success');
        playSound('success');
        
    } catch (error) {
        console.error('Error processing ticket:', error);
        showError('Failed to process ticket');
        flashScanner('error');
        playSound('error');
    }
}

// Validate ticket
function validateTicket(ticket) {
    // Check if ticket belongs to selected event
    if (ticket.event_id !== selectedEventId) {
        return {
            valid: false,
            message: `This ticket is for "${ticket.events.title}", not the selected event`
        };
    }
    
    // Check if order is completed
    if (ticket.orders.status !== 'completed' && ticket.orders.status !== 'paid') {
        return {
            valid: false,
            message: 'Order not completed'
        };
    }
    
    // Check if already checked in
    if (ticket.checked_in_at) {
        const checkedInDate = new Date(ticket.checked_in_at).toLocaleString();
        return {
            valid: false,
            message: `Already checked in at ${checkedInDate}`
        };
    }
    
    // Check ticket status
    if (ticket.status !== 'valid') {
        return {
            valid: false,
            message: `Ticket status: ${ticket.status}`
        };
    }
    
    return { valid: true };
}

// Show ticket details modal
function showTicketModal(ticket) {
    const modal = document.getElementById('ticketModal');
    const content = document.getElementById('ticketModalContent');
    
    const alreadyCheckedIn = !!ticket.checked_in_at;
    
    content.innerHTML = `
        <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full ${alreadyCheckedIn ? 'bg-yellow-100 dark:bg-yellow-950' : 'bg-green-100 dark:bg-green-950'} flex items-center justify-center">
                <svg class="w-8 h-8 ${alreadyCheckedIn ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    ${alreadyCheckedIn 
                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>'
                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'
                    }
                </svg>
            </div>
            <h3 class="text-2xl font-bold mb-2">${alreadyCheckedIn ? 'Already Checked In' : 'Valid Ticket'}</h3>
        </div>
        
        <div class="space-y-4 mb-6">
            <div>
                <div class="text-sm text-neutral-600 dark:text-neutral-400">Ticket Type</div>
                <div class="font-semibold">${ticket.ticket_types.name}</div>
            </div>
            <div>
                <div class="text-sm text-neutral-600 dark:text-neutral-400">Customer</div>
                <div class="font-semibold">${ticket.orders.customer_name || ticket.orders.customer_email}</div>
            </div>
            <div>
                <div class="text-sm text-neutral-600 dark:text-neutral-400">Ticket Number</div>
                <div class="font-mono text-sm">${ticket.ticket_number || ticket.id.slice(0, 8)}</div>
            </div>
            ${alreadyCheckedIn ? `
            <div>
                <div class="text-sm text-neutral-600 dark:text-neutral-400">Checked In At</div>
                <div class="font-semibold">${new Date(ticket.checked_in_at).toLocaleString()}</div>
            </div>
            ` : ''}
        </div>
        
        <div class="flex gap-3">
            <button onclick="closeTicketModal()" class="flex-1 px-6 py-3 rounded-full border border-neutral-200 dark:border-neutral-800 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                Cancel
            </button>
            ${!alreadyCheckedIn ? `
            <button onclick="checkInTicket('${ticket.id}')" class="flex-1 px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:scale-105 transition-transform">
                Check In
            </button>
            ` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Check in ticket
window.checkInTicket = async function(ticketId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
            .from('tickets')
            .update({
                checked_in_at: new Date().toISOString(),
                checked_in_by: user.id
            })
            .eq('id', ticketId);
        
        if (error) throw error;
        
        closeTicketModal();
        playSound('success');
        
        // Refresh stats
        await loadEventData();
        
        // Add to recent scans
        const { data: ticket } = await supabase
            .from('tickets')
            .select('*, ticket_types(name), orders(customer_name, customer_email)')
            .eq('id', ticketId)
            .single();
        
        if (ticket) {
            addToRecentScans(ticket, 'success', 'Checked in successfully');
        }
        
    } catch (error) {
        console.error('Error checking in ticket:', error);
        alert('Failed to check in ticket');
    }
};

// Close ticket modal
window.closeTicketModal = function() {
    document.getElementById('ticketModal').classList.add('hidden');
};

// Handle manual ticket check
async function handleManualCheck() {
    const input = document.getElementById('manualTicketId');
    const ticketId = input.value.trim();
    
    if (!ticketId) return;
    
    await processTicket(ticketId);
    input.value = '';
}

// Add to recent scans
async function addToRecentScans(ticket, status, message, errorCode = null) {
    const scan = {
        ticket,
        status,
        message,
        timestamp: new Date()
    };
    
    recentScans.unshift(scan);
    if (recentScans.length > 50) recentScans.pop();
    
    renderRecentScans();
    
    // Save to database
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase
            .from('scan_logs')
            .insert({
                event_id: selectedEventId,
                ticket_id: ticket.id,
                scanner_id: user.id,
                status: status,
                message: message,
                error_code: errorCode
            });
    } catch (error) {
        console.error('Error saving scan log:', error);
        // Don't block the UI if logging fails
    }
}

// Load scan logs from database
async function loadScanLogs() {
    try {
        const { data: logs, error } = await supabase
            .from('scan_logs')
            .select(`
                *,
                tickets (
                    id,
                    qr_code,
                    ticket_types (name),
                    orders (customer_name, customer_email)
                )
            `)
            .eq('event_id', selectedEventId)
            .order('scanned_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        // Convert database logs to scan format
        recentScans = logs.map(log => ({
            ticket: log.tickets,
            status: log.status,
            message: log.message,
            timestamp: new Date(log.scanned_at)
        }));
        
        renderRecentScans();
    } catch (error) {
        console.error('Error loading scan logs:', error);
        // Continue with empty scans if loading fails
        recentScans = [];
        renderRecentScans();
    }
}

// Render recent scans
function renderRecentScans() {
    const container = document.getElementById('recentScans');
    
    // Filter scans based on current filter
    const filteredScans = currentFilter === 'all' 
        ? recentScans 
        : recentScans.filter(scan => scan.status === currentFilter);
    
    if (filteredScans.length === 0) {
        const emptyMessage = currentFilter === 'all' 
            ? 'No activity yet' 
            : currentFilter === 'success' 
                ? 'No check-ins yet' 
                : 'No errors yet';
        container.innerHTML = `<div class="text-center py-8 text-neutral-600 dark:text-neutral-400 text-sm">${emptyMessage}</div>`;
        return;
    }
    
    container.innerHTML = filteredScans.map(scan => {
        const statusColors = {
            success: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
            error: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
        };
        
        return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 gap-2">
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-sm sm:text-base truncate">${scan.ticket.orders?.customer_name || scan.ticket.orders?.customer_email || 'Unknown'}</div>
                    <div class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">${scan.ticket.ticket_types?.name || 'Ticket'}</div>
                    <div class="text-xs text-neutral-500 dark:text-neutral-500">${scan.timestamp.toLocaleTimeString()}</div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[scan.status]} self-start sm:self-center whitespace-nowrap">
                    ${scan.message}
                </span>
            </div>
        `;
    }).join('');
}

// Flash scanner border
function flashScanner(type) {
    const scanner = document.getElementById('qr-reader');
    scanner.classList.add(`scan-${type}`);
    setTimeout(() => {
        scanner.classList.remove(`scan-${type}`);
    }, 500);
}

// Play sound
function playSound(type) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    } else {
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    }
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Show error message
function showError(message) {
    // You can enhance this with a toast notification
    console.error(message);
}

// Initialize on page load
init();
