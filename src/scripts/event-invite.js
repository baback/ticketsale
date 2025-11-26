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

    // Populate ticket types dropdown
    const ticketTypeSelect = document.getElementById('ticketType');
    ticketTypeSelect.innerHTML = '<option value="">Select ticket type...</option>';
    
    ticketTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.id;
      option.textContent = `${type.name} - $${parseFloat(type.price).toFixed(2)}`;
      ticketTypeSelect.appendChild(option);
    });

  } catch (error) {
    console.error('Error loading event:', error);
    toast.error('Failed to load event data');
    setTimeout(() => window.location.href = '/dashboard/organizer/events/', 2000);
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
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('inviteeName').value.trim();
  const email = document.getElementById('inviteeEmail').value.trim();
  const ticketTypeId = document.getElementById('ticketType').value;
  const quantity = parseInt(document.getElementById('quantity').value);

  if (!name || !email || !ticketTypeId || !quantity) {
    toast.error('Please fill in all fields');
    return;
  }

  const loadingToast = toast.loading('Sending invitation...');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Create invitation
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

    // Send invitation email
    await sendInvitationEmail(invitation);

    loadingToast.hideToast();
    toast.success('Invitation sent successfully!');

    // Reset form
    document.getElementById('invitationForm').reset();

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
