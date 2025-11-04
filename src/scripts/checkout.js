// Checkout page functionality
// Theme and auth are handled by shared.js

// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('event');

// State
let eventData = null;
let ticketSelections = {}; // { ticketTypeId: quantity }
const SERVICE_FEE_PERCENTAGE = 0.10; // 10% service fee

// Format currency
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

// Calculate totals
function calculateTotals() {
    let subtotal = 0;
    
    Object.entries(ticketSelections).forEach(([ticketTypeId, quantity]) => {
        const ticketType = eventData.ticket_types.find(t => t.id === ticketTypeId);
        if (ticketType && quantity > 0) {
            subtotal += ticketType.price * quantity;
        }
    });
    
    const serviceFee = subtotal * SERVICE_FEE_PERCENTAGE;
    const total = subtotal + serviceFee;
    
    return { subtotal, serviceFee, total };
}

// Update order summary
function updateOrderSummary() {
    const orderItems = document.getElementById('orderItems');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Get selected tickets
    const selectedTickets = Object.entries(ticketSelections)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketTypeId, quantity]) => {
            const ticketType = eventData.ticket_types.find(t => t.id === ticketTypeId);
            return { ticketType, quantity };
        });
    
    // Update order items
    if (selectedTickets.length === 0) {
        orderItems.innerHTML = `
            <p class="text-neutral-600 dark:text-neutral-400 text-sm text-center py-8">
                No tickets selected
            </p>
        `;
        checkoutBtn.disabled = true;
    } else {
        orderItems.innerHTML = selectedTickets.map(({ ticketType, quantity }) => `
            <div class="flex justify-between text-sm">
                <span>${quantity}x ${ticketType.name}</span>
                <span>${formatCurrency(ticketType.price * quantity)}</span>
            </div>
        `).join('');
        checkoutBtn.disabled = false;
    }
    
    // Update totals
    const { subtotal, serviceFee, total } = calculateTotals();
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('serviceFee').textContent = formatCurrency(serviceFee);
    document.getElementById('total').textContent = formatCurrency(total);
}

// Update ticket quantity
function updateTicketQuantity(ticketTypeId, change) {
    const ticketType = eventData.ticket_types.find(t => t.id === ticketTypeId);
    if (!ticketType) return;
    
    const currentQuantity = ticketSelections[ticketTypeId] || 0;
    const newQuantity = Math.max(0, Math.min(ticketType.available, currentQuantity + change));
    
    if (newQuantity === 0) {
        delete ticketSelections[ticketTypeId];
    } else {
        ticketSelections[ticketTypeId] = newQuantity;
    }
    
    // Update UI
    const quantityDisplay = document.querySelector(`[data-ticket-id="${ticketTypeId}"] .quantity-display`);
    if (quantityDisplay) {
        quantityDisplay.textContent = newQuantity;
    }
    
    // Update button states
    const minusBtn = document.querySelector(`[data-ticket-id="${ticketTypeId}"] .minus-btn`);
    const plusBtn = document.querySelector(`[data-ticket-id="${ticketTypeId}"] .plus-btn`);
    
    if (minusBtn) minusBtn.disabled = newQuantity === 0;
    if (plusBtn) plusBtn.disabled = newQuantity >= ticketType.available;
    
    updateOrderSummary();
}

// Render ticket types
function renderTicketTypes() {
    const container = document.getElementById('ticketTypes');
    
    if (!eventData.ticket_types || eventData.ticket_types.length === 0) {
        container.innerHTML = `
            <p class="text-neutral-600 dark:text-neutral-400 text-center py-8">
                No tickets available for this event.
            </p>
        `;
        return;
    }
    
    container.innerHTML = eventData.ticket_types.map(ticket => `
        <div class="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all" data-ticket-id="${ticket.id}">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="font-semibold text-lg mb-1">${ticket.name}</h3>
                    ${ticket.description ? `<p class="text-sm text-neutral-600 dark:text-neutral-400">${ticket.description}</p>` : ''}
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold font-display">${formatCurrency(ticket.price)}</div>
                    <div class="text-xs text-neutral-600 dark:text-neutral-400">
                        ${ticket.available > 0 ? `${ticket.available} available` : 'Sold Out'}
                    </div>
                </div>
            </div>
            
            ${ticket.available > 0 ? `
                <div class="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">Quantity</span>
                    <div class="flex items-center gap-3">
                        <button type="button" class="minus-btn w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                            <svg class="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14"/>
                            </svg>
                        </button>
                        <span class="quantity-display w-8 text-center font-semibold">0</span>
                        <button type="button" class="plus-btn w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <svg class="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                        </button>
                    </div>
                </div>
            ` : `
                <div class="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <span class="text-sm text-red-500 dark:text-red-400 font-medium">Sold Out</span>
                </div>
            `}
        </div>
    `).join('');
    
    // Attach event listeners
    eventData.ticket_types.forEach(ticket => {
        if (ticket.available > 0) {
            const ticketElement = document.querySelector(`[data-ticket-id="${ticket.id}"]`);
            const minusBtn = ticketElement.querySelector('.minus-btn');
            const plusBtn = ticketElement.querySelector('.plus-btn');
            
            minusBtn.addEventListener('click', () => updateTicketQuantity(ticket.id, -1));
            plusBtn.addEventListener('click', () => updateTicketQuantity(ticket.id, 1));
        }
    });
}

// Load event data
async function loadEvent() {
    if (!eventId) {
        showError();
        return;
    }
    
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
                )
            `)
            .eq('id', eventId)
            .eq('status', 'published')
            .single();

        if (error) throw error;
        
        if (!data) {
            showError();
            return;
        }

        eventData = data;
        renderEvent();
    } catch (error) {
        console.error('Error loading event:', error);
        showError();
    }
}

// Render event
function renderEvent() {
    // Update page title
    document.title = `Checkout - ${eventData.title} - ticketsale.ca`;
    
    // Format date
    const eventDate = new Date(eventData.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
    
    // Update event info
    document.getElementById('eventImage').src = eventData.image_url;
    document.getElementById('eventImage').alt = eventData.title;
    document.getElementById('eventTitle').textContent = eventData.title;
    document.getElementById('eventDate').textContent = formattedDate;
    document.getElementById('eventLocation').textContent = eventData.location;
    
    // Create slug for back button
    const slug = eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    document.getElementById('backToEvent').href = `../events/?event=${slug}-${eventData.id}`;
    
    // Render ticket types
    renderTicketTypes();
    
    // Show content
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('checkoutContent').classList.remove('hidden');
}

// Show error
function showError() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
}

// Checkout button handler
document.getElementById('checkoutBtn').addEventListener('click', async () => {
    const btn = document.getElementById('checkoutBtn');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = `../login/?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return;
        }
        
        // Track checkout start
        if (window.eventTracking) {
            window.eventTracking.trackConversion(eventId, 'checkout_start', {
                ticket_count: totalQuantity,
                subtotal: totals.subtotal
            });
        }
        
        // Call Edge Function to create Stripe checkout session
        const { data, error } = await window.supabaseClient.functions.invoke('create-checkout-session', {
            body: {
                eventId: eventId,
                ticketSelections: ticketSelections
            }
        });
        
        if (error) throw error;
        
        if (data.url) {
            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } else {
            throw new Error('No checkout URL returned');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to process checkout. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Proceed to Payment';
    }
});

// Check authentication
async function checkAuth() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (!session) {
        // Redirect to login with return URL
        window.location.href = `../login/?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
}

// Initialize
checkAuth().then(() => {
    loadEvent();
});
