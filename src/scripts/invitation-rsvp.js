// Invitation RSVP Script

// Initialize theme
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.remove('dark');
}

// Get invitation token from URL
const urlParams = new URLSearchParams(window.location.search);
const invitationToken = urlParams.get('id');

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

let currentInvitation = null;
let currentEvent = null;

// Initialize
async function init() {
  if (!invitationToken) {
    showError('Invalid invitation link');
    return;
  }

  await loadInvitation();
}

// Load invitation data
async function loadInvitation() {
  try {
    const { data: invitation, error } = await supabase
      .from('event_invitations')
      .select(`
        *,
        events (*),
        ticket_types (name, price)
      `)
      .eq('invitation_token', invitationToken)
      .single();

    if (error) throw error;

    if (!invitation) {
      showError('Invitation not found');
      return;
    }

    currentInvitation = invitation;
    currentEvent = invitation.events;

    // Check invitation status
    if (invitation.status === 'accepted') {
      showSuccess();
      return;
    }

    if (invitation.status === 'declined') {
      showDeclined();
      return;
    }

    if (invitation.status === 'expired') {
      showError('This invitation has expired');
      return;
    }

    // Show RSVP form
    renderInvitation();

  } catch (error) {
    console.error('Error loading invitation:', error);
    showError('Failed to load invitation');
  }
}

// Render invitation
function renderInvitation() {
  // Hide loading
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('rsvpContent').classList.remove('hidden');

  // Event image
  const eventImage = document.getElementById('eventImage');
  if (currentEvent.image_url) {
    eventImage.style.backgroundImage = `url(${currentEvent.image_url})`;
    eventImage.style.backgroundSize = 'cover';
    eventImage.style.backgroundPosition = 'center';
  }

  // Event details
  document.getElementById('eventTitle').textContent = currentEvent.title;
  
  const eventDate = new Date(currentEvent.event_date);
  document.getElementById('eventDate').textContent = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  document.getElementById('eventLocation').textContent = currentEvent.location || 'TBA';

  // Invitation details
  document.getElementById('guestName').textContent = currentInvitation.invitee_name;
  document.getElementById('ticketType').textContent = currentInvitation.ticket_types?.name || 'Unknown';
  document.getElementById('ticketQuantity').textContent = currentInvitation.quantity;

  // Setup buttons
  document.getElementById('acceptBtn').addEventListener('click', handleAccept);
  document.getElementById('declineBtn').addEventListener('click', handleDecline);
}

// Handle accept
async function handleAccept() {
  const loadingToast = toast.loading('Processing your RSVP...');

  try {
    // Call Supabase Edge Function to process acceptance
    const { data, error } = await supabase.functions.invoke('process-invitation-rsvp', {
      body: {
        invitation_token: invitationToken,
        action: 'accept'
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to process RSVP');
    }

    if (data && data.error) {
      console.error('RSVP processing error:', data.error);
      throw new Error(data.error);
    }

    loadingToast.hideToast();
    toast.success('RSVP confirmed! Check your email for tickets.');
    
    // Show success state
    showSuccess();

  } catch (error) {
    console.error('Error accepting invitation:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    loadingToast.hideToast();
    
    // Try to extract error message from different possible locations
    let errorMessage = 'Failed to process RSVP. Please try again.';
    
    if (error.context?.body) {
      try {
        const body = JSON.parse(error.context.body);
        errorMessage = body.error || errorMessage;
      } catch (e) {
        // Ignore parse error
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.log('Extracted error message:', errorMessage);
    toast.error(errorMessage);
    
    // If invitation already processed, show appropriate state
    if (errorMessage.includes('already processed') || errorMessage.includes('not found')) {
      showError('This invitation has already been used or is no longer valid.');
    }
  }
}

// Handle decline
async function handleDecline() {
  const loadingToast = toast.loading('Processing your response...');

  try {
    const { error } = await supabase
      .from('event_invitations')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('invitation_token', invitationToken);

    if (error) throw error;

    loadingToast.hideToast();
    toast.success('Response recorded');
    
    // Show declined state
    showDeclined();

  } catch (error) {
    console.error('Error declining invitation:', error);
    loadingToast.hideToast();
    toast.error('Failed to process response');
  }
}

// Show success state
function showSuccess() {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('rsvpContent').classList.add('hidden');
  document.getElementById('declinedState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('successState').classList.remove('hidden');
}

// Show declined state
function showDeclined() {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('rsvpContent').classList.add('hidden');
  document.getElementById('successState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('declinedState').classList.remove('hidden');
}

// Show error state
function showError(message) {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('rsvpContent').classList.add('hidden');
  document.getElementById('successState').classList.add('hidden');
  document.getElementById('declinedState').classList.add('hidden');
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorMessage').textContent = message;
}

// Initialize on page load
init();
