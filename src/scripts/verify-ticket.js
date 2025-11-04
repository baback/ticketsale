// Verify Ticket Script (Public - Read Only)

const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('t');

async function verifyTicket() {
    if (!ticketId) {
        showInvalid('No ticket ID provided');
        return;
    }

    try {
        // Fetch ticket details (public read-only)
        const { data: ticket, error } = await window.supabaseClient
            .from('tickets')
            .select(`
                *,
                ticket_types (name, price),
                events (title, event_date, location, image_url),
                orders (customer_name, customer_email, status)
            `)
            .eq('id', ticketId)
            .single();

        if (error || !ticket) {
            showInvalid('Ticket not found');
            return;
        }

        // Check if ticket is valid
        if (ticket.status !== 'valid') {
            showInvalid(`Ticket status: ${ticket.status}`);
            return;
        }

        // Check if order is completed
        if (ticket.orders.status !== 'completed' && ticket.orders.status !== 'paid') {
            showInvalid('Order not completed');
            return;
        }

        // Check if already checked in
        if (ticket.checked_in_at) {
            showUsed(ticket);
            return;
        }

        // Show valid ticket
        showValid(ticket);

    } catch (error) {
        console.error('Error verifying ticket:', error);
        showInvalid('Failed to verify ticket');
    }
}

function showValid(ticket) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('validState').classList.remove('hidden');

    const eventDate = new Date(ticket.events.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    document.getElementById('ticketDetails').innerHTML = `
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Event</div>
            <div class="font-semibold text-lg">${ticket.events.title}</div>
        </div>
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Date & Time</div>
            <div class="font-semibold">${formattedDate}</div>
        </div>
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Location</div>
            <div class="font-semibold">${ticket.events.location}</div>
        </div>
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Ticket Type</div>
            <div class="font-semibold">${ticket.ticket_types.name}</div>
        </div>
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Ticket Number</div>
            <div class="font-mono text-sm">${ticket.ticket_number || ticket.id.slice(0, 8)}</div>
        </div>
    `;
}

function showUsed(ticket) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('usedState').classList.remove('hidden');

    const checkedInDate = new Date(ticket.checked_in_at);
    const formattedCheckedIn = checkedInDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    document.getElementById('usedDetails').innerHTML = `
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Event</div>
            <div class="font-semibold">${ticket.events.title}</div>
        </div>
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Checked In At</div>
            <div class="font-semibold">${formattedCheckedIn}</div>
        </div>
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div class="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Ticket Number</div>
            <div class="font-mono text-sm">${ticket.ticket_number || ticket.id.slice(0, 8)}</div>
        </div>
    `;
}

function showInvalid(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('invalidState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Initialize
verifyTicket();
