// Customer Profile Script

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

async function initCustomerProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const customerEmail = urlParams.get('email');

  if (!customerEmail) {
    window.location.href = '/dashboard/organizer/customers/';
    return;
  }

  await loadCustomerProfile(session.user.id, customerEmail);
  
  // Email modal handlers
  document.getElementById('sendEmailBtn').addEventListener('click', openEmailModal);
  document.getElementById('cancelEmail').addEventListener('click', closeEmailModal);
  document.getElementById('confirmSendEmail').addEventListener('click', sendEmail);
}

async function loadCustomerProfile(organizerId, customerEmail) {
  try {
    // Get customer orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        events!inner(organizer_id, title, event_date, image_url),
        tickets(id, ticket_number, status)
      `)
      .eq('events.organizer_id', organizerId)
      .eq('customer_email', customerEmail)
      .in('status', ['paid', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      alert('Customer not found');
      window.location.href = '/dashboard/organizer/customers/';
      return;
    }

    // Update customer info
    const customerName = orders[0].customer_name || 'Unknown';
    document.getElementById('customerName').textContent = customerName;
    document.getElementById('customerEmail').textContent = customerEmail;
    document.getElementById('customerAvatar').textContent = customerName.charAt(0).toUpperCase();
    document.getElementById('emailTo').value = customerEmail;

    // Calculate stats
    const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const totalTickets = orders.reduce((sum, o) => sum + (o.tickets?.length || 0), 0);

    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('totalTickets').textContent = totalTickets;

    // Display purchase history
    displayPurchaseHistory(orders);

    // Load communication history
    await loadCommunicationHistory(organizerId, customerEmail);

  } catch (error) {
    console.error('Error loading customer profile:', error);
  }
}

function displayPurchaseHistory(orders) {
  const container = document.getElementById('purchaseHistory');
  
  container.innerHTML = orders.map(order => {
    const eventDate = new Date(order.events.event_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        ${order.events.image_url ? `
          <img src="${order.events.image_url}" alt="${order.events.title}" class="w-20 h-20 rounded-lg object-cover" />
        ` : `
          <div class="w-20 h-20 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
            <svg class="w-8 h-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            </svg>
          </div>
        `}
        <div class="flex-1">
          <h3 class="font-semibold mb-1">${order.events.title}</h3>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">Event: ${eventDate}</p>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">Purchased: ${orderDate}</p>
        </div>
        <div class="text-right">
          <div class="font-semibold">${formatCurrency(order.total)}</div>
          <div class="text-sm text-neutral-600 dark:text-neutral-400">${order.tickets?.length || 0} ticket${order.tickets?.length !== 1 ? 's' : ''}</div>
          <a href="/dashboard/mytickets/order/?id=${order.id}" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">View Order</a>
        </div>
      </div>
    `;
  }).join('');
}

async function loadCommunicationHistory(organizerId, customerEmail) {
  try {
    const { data: communications, error } = await supabase
      .from('customer_communications')
      .select('*')
      .eq('organizer_id', organizerId)
      .eq('customer_email', customerEmail)
      .order('sent_at', { ascending: false });

    if (error) throw error;

    const container = document.getElementById('communicationHistory');
    
    if (!communications || communications.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-neutral-600 dark:text-neutral-400">No communications yet</div>';
      return;
    }

    container.innerHTML = communications.map(comm => {
      const date = new Date(comm.sent_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const statusColors = {
        sent: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        failed: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      };

      return `
        <div class="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div class="flex items-start justify-between mb-2">
            <div class="font-medium">${comm.subject}</div>
            <span class="text-xs px-2 py-1 rounded-full ${statusColors[comm.status] || statusColors.sent}">
              ${comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
            </span>
          </div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-2">${comm.message}</p>
          <div class="text-xs text-neutral-500 dark:text-neutral-500">${date}</div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading communications:', error);
  }
}

function openEmailModal() {
  document.getElementById('emailModal').classList.remove('hidden');
}

function closeEmailModal() {
  document.getElementById('emailModal').classList.add('hidden');
  document.getElementById('emailSubject').value = '';
  document.getElementById('emailMessage').value = '';
}

async function sendEmail() {
  const subject = document.getElementById('emailSubject').value.trim();
  const message = document.getElementById('emailMessage').value.trim();
  const customerEmail = document.getElementById('emailTo').value;

  if (!subject || !message) {
    alert('Please fill in both subject and message');
    return;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Save communication record
    const { error } = await supabase
      .from('customer_communications')
      .insert({
        organizer_id: session.user.id,
        customer_email: customerEmail,
        subject: subject,
        message: message,
        type: 'email',
        status: 'sent'
      });

    if (error) throw error;

    alert('Email logged successfully! Note: Actual email sending requires email service integration.');
    closeEmailModal();
    
    // Reload communication history
    const urlParams = new URLSearchParams(window.location.search);
    await loadCommunicationHistory(session.user.id, urlParams.get('email'));

  } catch (error) {
    console.error('Error sending email:', error);
    alert('Failed to log email communication');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', initCustomerProfile);
