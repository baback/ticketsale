// Event Invite Script

// Initialize theme
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.remove('dark');
}

// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

// Toast notifications
const toast = {
  success: (message) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(to right, #10b981, #059669)",
      }
    }).showToast();
  },
  error: (message) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(to right, #ef4444, #dc2626)",
      }
    }).showToast();
  },
  loading: (message) => {
    return Toastify({
      text: message,
      duration: -1,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(to right, #3b82f6, #2563eb)",
      }
    }).showToast();
  }
};

let currentEvent = null;
let ticketTypes = [];
let selectedTickets = {}; // { ticketTypeId: quantity }

// Initialize
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }

  if (!eventId) {
    toast.error('Event ID is required');
    setTimeout(() => window.location.href = '/dashboard/organizer/events/', 2000);
    return;
  }

  await loadEventData();
  await loadInvitations();
  setupEventListeners();
}

// Load event data
async function loadEventData() {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        ticket_types (*)
      `)
      .eq('id', eventId)
      .single();

    if (error) throw error;

    currentEvent = event;
    ticketTypes = event.ticket_types || [];

    // Update UI
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('backToEvent').href = `/dashboard/organizer/events/edit/?id=${eventId}`;

    // Render ticket types in modal
    renderTicketTypes();

  } catch (error) {
    console.error('Error loading event:', error);
    toast.error('Failed to load event data');
    setTimeout(() => window.location.href = '/dashboard/organizer/events/', 2000);
  }
}

// Render ticket types in modal
function renderTicketTypes() {
  const container = document.getElementById('ticketTypesList');
  
  container.innerHTML = ticketTypes.map(type => `
    <div class="glass rounded-xl p-4 border border-neutral-200 dark:border-neutral-800" data-ticket-id="${type.id}">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <h3 class="font-semibold text-lg">${type.name}</h3>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            $${parseFloat(type.price).toFixed(2)} per ticket
          </p>
          ${type.description ? `
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">${type.description}</p>
          ` : ''}
        </div>
      </div>
      
      <div class="flex items-center justify-between">
        <span class="text-sm text-neutral-600 dark:text-neutral-400">
          ${type.available} available
        </span>
        <div class="flex items-center gap-3">
          <button 
            type="button"
            onclick="decrementTicket('${type.id}')"
            class="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
          </button>
          <span id="quantity-${type.id}" class="text-lg font-semibold w-8 text-center">0</span>
          <button 
            type="button"
            onclick="incrementTicket('${type.id}')"
            class="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Increment ticket quantity
window.incrementTicket = function(ticketTypeId) {
  const type = ticketTypes.find(t => t.id === ticketTypeId);
  if (!type) return;
  
  const current = selectedTickets[ticketTypeId] || 0;
  if (current < type.available && current < 10) {
    selectedTickets[ticketTypeId] = current + 1;
    document.getElementById(`quantity-${ticketTypeId}`).textContent = current + 1;
  }
};

// Decrement ticket quantity
window.decrementTicket = function(ticketTypeId) {
  const current = selectedTickets[ticketTypeId] || 0;
  if (current > 0) {
    selectedTickets[ticketTypeId] = current - 1;
    document.getElementById(`quantity-${ticketTypeId}`).textContent = current - 1;
    
    if (current - 1 === 0) {
      delete selectedTickets[ticketTypeId];
    }
  }
}

// Load invitations
async function loadInvitations() {
  try {
    const { data: invitations, error } = await supabase
      .from('event_invitations')
      .select(`
        *,
        ticket_types (name, price)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderInvitations(invitations || []);

  } catch (error) {
    console.error('Error loading invitations:', error);
    toast.error('Failed to load invitations');
  }
}

// Render invitations
function renderInvitations(invitations) {
  const loading = document.getElementById('invitationsLoading');
  const list = document.getElementById('invitationsList');
  const empty = document.getElementById('invitationsEmpty');

  loading.classList.add('hidden');

  if (invitations.length === 0) {
    list.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  list.classList.remove('hidden');

  const statusColors = {
    invited: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    accepted: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    declined: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    expired: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
  };

  list.innerHTML = invitations.map(inv => `
    <div class="glass rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <h3 class="font-semibold">${inv.invitee_name}</h3>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">${inv.invitee_email}</p>
        </div>
        <span class="text-xs px-2 py-1 rounded-full ${statusColors[inv.status]} font-medium">
          ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
        </span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-neutral-600 dark:text-neutral-400">
          ${inv.quantity}x ${inv.ticket_types?.name || 'Unknown'}
        </span>
        <span class="text-neutral-600 dark:text-neutral-400">
          ${new Date(inv.invited_at).toLocaleDateString()}
        </span>
      </div>
      ${inv.status === 'invited' ? `
        <button 
          onclick="resendInvitation('${inv.id}')"
          class="mt-3 w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Resend Invitation
        </button>
      ` : ''}
    </div>
  `).join('');
}

// Setup event listeners
function setupEventListeners() {
  const form = document.getElementById('invitationForm');
  form.addEventListener('submit', handleSubmit);
  
  // Ticket selection modal
  const selectTicketsBtn = document.getElementById('selectTicketsBtn');
  const editTicketsBtn = document.getElementById('editTicketsBtn');
  const closeTicketModal = document.getElementById('closeTicketModal');
  const confirmTicketsBtn = document.getElementById('confirmTicketsBtn');
  const ticketModal = document.getElementById('ticketModal');
  
  selectTicketsBtn.addEventListener('click', () => {
    ticketModal.classList.remove('hidden');
  });
  
  editTicketsBtn.addEventListener('click', () => {
    ticketModal.classList.remove('hidden');
  });
  
  closeTicketModal.addEventListener('click', () => {
    ticketModal.classList.add('hidden');
  });
  
  confirmTicketsBtn.addEventListener('click', () => {
    confirmTicketSelection();
  });
  
  // Close modal on backdrop click
  ticketModal.addEventListener('click', (e) => {
    if (e.target === ticketModal) {
      ticketModal.classList.add('hidden');
    }
  });
}

// Confirm ticket selection
function confirmTicketSelection() {
  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  
  if (totalTickets === 0) {
    toast.error('Please select at least one ticket');
    return;
  }
  
  // Update UI
  const selectedText = document.getElementById('selectedTicketsText');
  const summary = document.getElementById('selectedTicketsSummary');
  const summaryText = document.getElementById('ticketsSummaryText');
  
  // Build summary text
  const ticketSummary = Object.entries(selectedTickets)
    .map(([typeId, qty]) => {
      const type = ticketTypes.find(t => t.id === typeId);
      return `${qty}x ${type?.name || 'Unknown'}`;
    })
    .join(', ');
  
  selectedText.textContent = ticketSummary;
  selectedText.classList.remove('text-neutral-600', 'dark:text-neutral-400');
  selectedText.classList.add('text-black', 'dark:text-white', 'font-medium');
  
  summaryText.textContent = `${totalTickets} ticket${totalTickets !== 1 ? 's' : ''} selected`;
  summary.classList.remove('hidden');
  
  // Close modal
  document.getElementById('ticketModal').classList.add('hidden');
  
  toast.success('Tickets selected');
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('inviteeName').value.trim();
  const email = document.getElementById('inviteeEmail').value.trim();

  if (!name || !email) {
    toast.error('Please enter guest name and email');
    return;
  }

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  if (totalTickets === 0) {
    toast.error('Please select tickets');
    return;
  }

  const loadingToast = toast.loading('Sending invitation...');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Create invitations for each ticket type
    const invitations = [];
    for (const [ticketTypeId, quantity] of Object.entries(selectedTickets)) {
      if (quantity > 0) {
        const { data: invitation, error } = await supabase
          .from('event_invitations')
          .insert({
            event_id: eventId,
            organizer_id: user.id,
            invitee_name: name,
            invitee_email: email,
            ticket_type_id: ticketTypeId,
            quantity: quantity,
            status: 'invited'
          })
          .select()
          .single();

        if (error) throw error;
        invitations.push(invitation);
      }
    }

    // Send invitation email (send once with all tickets)
    if (invitations.length > 0) {
      await sendInvitationEmail(invitations[0]); // Use first invitation for email
    }

    loadingToast.hideToast();
    toast.success('Invitation sent successfully!');

    // Reset form
    document.getElementById('invitationForm').reset();
    selectedTickets = {};
    document.getElementById('selectedTicketsText').textContent = 'Select tickets...';
    document.getElementById('selectedTicketsText').classList.remove('text-black', 'dark:text-white', 'font-medium');
    document.getElementById('selectedTicketsText').classList.add('text-neutral-600', 'dark:text-neutral-400');
    document.getElementById('selectedTicketsSummary').classList.add('hidden');
    
    // Reset modal quantities
    ticketTypes.forEach(type => {
      const qtyEl = document.getElementById(`quantity-${type.id}`);
      if (qtyEl) qtyEl.textContent = '0';
    });

    // Reload invitations
    await loadInvitations();

  } catch (error) {
    console.error('Error sending invitation:', error);
    loadingToast.hideToast();
    toast.error('Failed to send invitation');
  }
}

// Send invitation email
async function sendInvitationEmail(invitation) {
  try {
    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        invitation_id: invitation.id
      }
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      throw error;
    }

    console.log('Invitation email sent successfully:', data);
    
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - invitation is created, email is secondary
  }
}

// Legacy email template (kept for reference)
async function sendInvitationEmailLegacy(invitation) {
  try {
    const inviteUrl = `${window.location.origin}/invite/?id=${invitation.invitation_token}`;
    
    // Get event and organizer details
    const eventDate = new Date(currentEvent.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const ticketType = ticketTypes.find(t => t.id === invitation.ticket_type_id);
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: organizer } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const organizerName = organizer?.full_name || user.email.split('@')[0];

    // Prepare email data
    const emailData = {
      to: invitation.invitee_email,
      subject: `You're invited to ${currentEvent.title}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #000000;">You're Invited!</h1>
                      <p style="margin: 10px 0 0; font-size: 16px; color: #666666;">${organizerName} has invited you to an event</p>
                    </td>
                  </tr>
                  ${currentEvent.image_url ? `
                  <tr>
                    <td style="padding: 0 40px;">
                      <img src="${currentEvent.image_url}" alt="${currentEvent.title}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; display: block;">
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 30px 40px;">
                      <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: bold; color: #000000;">${currentEvent.title}</h2>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 16px; color: #333333;">
                            📅 ${eventDate}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 16px; color: #333333;">
                            📍 ${currentEvent.location}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; font-size: 16px; color: #333333;">
                            🎟️ ${invitation.quantity}x ${ticketType?.name || 'Ticket'}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 40px; text-align: center;">
                      <a href="${inviteUrl}" style="display: inline-block; padding: 16px 48px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: 600;">
                        RSVP Now
                      </a>
                      <p style="margin: 20px 0 0; font-size: 14px; color: #999999;">
                        Or copy this link: ${inviteUrl}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 14px; color: #666666;">
                        This invitation was sent by ${organizerName} via ticketsale.ca
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${window.RESEND_API_KEY || 're_123'}`, // Use your Resend API key
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ticketsale.ca <noreply@ticketsale.ca>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html
      })
    });

    if (!response.ok) {
      console.error('Failed to send email:', await response.text());
    }
    
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - invitation is created, email is secondary
  }
}

// Resend invitation
window.resendInvitation = async function(invitationId) {
  const loadingToast = toast.loading('Resending invitation...');

  try {
    const { data: invitation, error } = await supabase
      .from('event_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (error) throw error;

    await sendInvitationEmail(invitation);

    loadingToast.hideToast();
    toast.success('Invitation resent successfully!');

  } catch (error) {
    console.error('Error resending invitation:', error);
    loadingToast.hideToast();
    toast.error('Failed to resend invitation');
  }
};

// Initialize on page load
init();

// CRM Contacts Modal
let crmContacts = [];
let filteredCrmContacts = [];

async function loadCrmContacts() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: contacts, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    crmContacts = contacts || [];
    filteredCrmContacts = crmContacts;
    renderCrmContacts();
  } catch (error) {
    console.error('Error loading CRM contacts:', error);
    document.getElementById('crmContactsList').innerHTML = `
      <div class="text-center py-8 text-neutral-600 dark:text-neutral-400">
        <p>Failed to load contacts</p>
      </div>
    `;
  }
}

function renderCrmContacts() {
  const contactsList = document.getElementById('crmContactsList');
  
  if (filteredCrmContacts.length === 0) {
    contactsList.innerHTML = `
      <div class="text-center py-8 text-neutral-600 dark:text-neutral-400">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <p>No contacts found</p>
        <a href="/dashboard/organizer/crm/" class="text-blue-600 dark:text-blue-400 hover:underline text-sm mt-2 inline-block">
          Add contacts to CRM
        </a>
      </div>
    `;
    return;
  }
  
  contactsList.innerHTML = filteredCrmContacts.map(contact => `
    <button 
      type="button"
      class="w-full p-4 rounded-lg glass border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left crm-contact-item"
      data-name="${contact.name}"
      data-email="${contact.email}"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
          ${contact.name.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">${contact.name}</div>
          <div class="text-sm text-neutral-600 dark:text-neutral-400 truncate">${contact.email}</div>
        </div>
        <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </div>
    </button>
  `).join('');
  
  // Add click handlers
  document.querySelectorAll('.crm-contact-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.name;
      const email = item.dataset.email;
      
      // Fill the form
      document.getElementById('inviteeName').value = name;
      document.getElementById('inviteeEmail').value = email;
      
      // Close modal
      document.getElementById('crmModal').classList.add('hidden');
      
      toast.success('Contact selected');
    });
  });
}

function filterCrmContacts(searchQuery) {
  const query = searchQuery.toLowerCase();
  filteredCrmContacts = crmContacts.filter(contact => 
    contact.name.toLowerCase().includes(query) ||
    contact.email.toLowerCase().includes(query)
  );
  renderCrmContacts();
}

// CRM Modal Event Listeners
document.getElementById('selectFromCrmBtn')?.addEventListener('click', () => {
  document.getElementById('crmModal').classList.remove('hidden');
  loadCrmContacts();
});

document.getElementById('closeCrmModal')?.addEventListener('click', () => {
  document.getElementById('crmModal').classList.add('hidden');
});

document.getElementById('crmSearchInput')?.addEventListener('input', (e) => {
  filterCrmContacts(e.target.value);
});

// Close modal on backdrop click
document.getElementById('crmModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'crmModal') {
    document.getElementById('crmModal').classList.add('hidden');
  }
});
