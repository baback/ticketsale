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
    
    // TODO: Implement email sending via Supabase Edge Function or Resend
    // For now, we'll just log the URL
    console.log('Invitation URL:', inviteUrl);
    
    // You can call your email service here
    // await fetch('/api/send-invitation-email', { ... });
    
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
