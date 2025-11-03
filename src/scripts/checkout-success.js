// Checkout success page
// Theme is handled by shared.js

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');

async function verifyPayment() {
    if (!sessionId) {
        showError();
        return;
    }

    try {
        // Get session to verify user is logged in
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (!session) {
            window.location.href = '../../login/';
            return;
        }

        // Find the order by Stripe session ID
        const { data: order, error: orderError } = await window.supabaseClient
            .from('orders')
            .select(`
                *,
                events (title, event_date, location, image_url),
                order_items (
                    quantity,
                    unit_price,
                    ticket_types (name)
                )
            `)
            .eq('stripe_checkout_session_id', sessionId)
            .eq('user_id', session.user.id)
            .single();

        if (orderError || !order) {
            console.error('Order not found:', orderError);
            showError();
            return;
        }

        // Show success
        showSuccess(order);
    } catch (error) {
        console.error('Error verifying payment:', error);
        showError();
    }
}

function showSuccess(order) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('successState').classList.remove('hidden');

    // Format date
    const eventDate = new Date(order.events.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    // Build order details
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = `
        <div class="flex items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <img src="${order.events.image_url}" alt="${order.events.title}" class="w-20 h-20 rounded-xl object-cover" />
            <div>
                <div class="font-semibold text-lg text-black dark:text-white">${order.events.title}</div>
                <div class="text-sm">${formattedDate}</div>
                <div class="text-sm">${order.events.location}</div>
            </div>
        </div>
        
        <div class="space-y-2 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div class="font-semibold text-black dark:text-white mb-2">Tickets</div>
            ${order.order_items.map(item => `
                <div class="flex justify-between text-sm">
                    <span>${item.quantity}x ${item.ticket_types.name}</span>
                    <span>$${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="space-y-2 pt-4">
            <div class="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>$${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span>Service Fee</span>
                <span>$${parseFloat(order.service_fee).toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-lg font-bold text-black dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <span>Total Paid</span>
                <span>$${parseFloat(order.total).toFixed(2)}</span>
            </div>
        </div>
        
        <div class="pt-4 text-sm">
            <div class="text-black dark:text-white font-semibold mb-1">Order Number</div>
            <div class="font-mono">${order.id}</div>
        </div>
    `;
}

function showError() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
}

// Initialize
verifyPayment();
