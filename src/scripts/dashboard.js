/** @format */

// Dashboard functionality
let currentMode = 'buyer'; // 'buyer' or 'organizer'
let userProfile = null;

// Initialize dashboard
async function initDashboard() {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      window.location.href = '../login/';
      return;
    }

    // Load user profile
    await loadUserProfile(session.user);
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial content
    await loadContent();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showError('Failed to load dashboard');
  }
}

// Load user profile from database
async function loadUserProfile(user) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    userProfile = data;
    
    // Update UI with user info
    const userEmail = document.getElementById('userEmail');
    const userName = document.getElementById('userName');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsName = document.getElementById('settingsName');
    
    if (userEmail) userEmail.textContent = user.email;
    if (userName) userName.textContent = userProfile.full_name || user.email.split('@')[0];
    if (settingsEmail) settingsEmail.textContent = user.email;
    if (settingsName) settingsName.textContent = userProfile.full_name || 'Not set';
    
  } catch (error) {
    console.error('Error loading profile:', error);
    // If profile doesn't exist, user info from auth is still available
    const user = (await supabase.auth.getUser()).data.user;
    const userEmail = document.getElementById('userEmail');
    const userName = document.getElementById('userName');
    const settingsEmail = document.getElementById('settingsEmail');
    
    if (userEmail) userEmail.textContent = user.email;
    if (userName) userName.textContent = user.email.split('@')[0];
    if (settingsEmail) settingsEmail.textContent = user.email;
  }
}

// Set up event listeners
function setupEventListeners() {
  // Mode toggle buttons
  const buyerModeBtn = document.getElementById('buyerModeBtn');
  const organizerModeBtn = document.getElementById('organizerModeBtn');
  
  if (buyerModeBtn) {
    buyerModeBtn.addEventListener('click', () => switchMode('buyer'));
  }
  
  if (organizerModeBtn) {
    organizerModeBtn.addEventListener('click', () => switchMode('organizer'));
  }
  
  // Create event buttons
  const createEventBtn = document.getElementById('createEventBtn');
  const createEventBtnEmpty = document.getElementById('createEventBtnEmpty');
  
  if (createEventBtn) {
    createEventBtn.addEventListener('click', () => {
      alert('Create Event feature coming soon!');
    });
  }
  
  if (createEventBtnEmpty) {
    createEventBtnEmpty.addEventListener('click', () => {
      alert('Create Event feature coming soon!');
    });
  }
  
  // Account settings buttons
  const editNameBtn = document.getElementById('editNameBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  
  if (editNameBtn) {
    editNameBtn.addEventListener('click', editName);
  }
  
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', changePassword);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Switch between buyer and organizer mode
function switchMode(mode) {
  currentMode = mode;
  
  const buyerModeBtn = document.getElementById('buyerModeBtn');
  const organizerModeBtn = document.getElementById('organizerModeBtn');
  const buyerContent = document.getElementById('buyerContent');
  const organizerContent = document.getElementById('organizerContent');
  
  if (mode === 'buyer') {
    // Update button styles
    buyerModeBtn.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    buyerModeBtn.classList.remove('hover:bg-neutral-100', 'dark:hover:bg-neutral-800');
    organizerModeBtn.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    organizerModeBtn.classList.add('hover:bg-neutral-100', 'dark:hover:bg-neutral-800');
    
    // Show/hide content
    buyerContent.classList.remove('hidden');
    organizerContent.classList.add('hidden');
  } else {
    // Update button styles
    organizerModeBtn.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    organizerModeBtn.classList.remove('hover:bg-neutral-100', 'dark:hover:bg-neutral-800');
    buyerModeBtn.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    buyerModeBtn.classList.add('hover:bg-neutral-100', 'dark:hover:bg-neutral-800');
    
    // Show/hide content
    organizerContent.classList.remove('hidden');
    buyerContent.classList.add('hidden');
  }
  
  // Load content for the selected mode
  loadContent();
}

// Load content based on current mode
async function loadContent() {
  if (currentMode === 'buyer') {
    await loadTickets();
  } else {
    await loadEvents();
  }
}

// Load user's tickets
async function loadTickets() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (
          name,
          venue,
          event_date
        ),
        ticket_types (
          name,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });
    
    if (error) throw error;
    
    const ticketsList = document.getElementById('ticketsList');
    const ticketsEmpty = document.getElementById('ticketsEmpty');
    const ticketCount = document.getElementById('ticketCount');
    
    if (tickets && tickets.length > 0) {
      ticketsList.classList.remove('hidden');
      ticketsEmpty.classList.add('hidden');
      ticketCount.textContent = `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`;
      
      ticketsList.innerHTML = tickets.map(ticket => `
        <div class="glass rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h3 class="font-semibold mb-1">${ticket.events.name}</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">${ticket.events.venue}</p>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">${new Date(ticket.events.event_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <div class="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                ticket.status === 'valid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                ticket.status === 'used' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400' :
                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }">
                ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium">${ticket.ticket_types.name}</p>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">$${ticket.ticket_types.price}</p>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      ticketsList.classList.add('hidden');
      ticketsEmpty.classList.remove('hidden');
      ticketCount.textContent = '0 tickets';
    }
    
  } catch (error) {
    console.error('Error loading tickets:', error);
    showError('Failed to load tickets');
  }
}

// Load organizer's events
async function loadEvents() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user is an organizer
    if (!userProfile || (userProfile.role !== 'organizer' && userProfile.role !== 'both')) {
      document.getElementById('eventsList').classList.add('hidden');
      document.getElementById('eventsEmpty').classList.add('hidden');
      document.getElementById('notOrganizerState').classList.remove('hidden');
      document.getElementById('createEventBtn').disabled = true;
      document.getElementById('createEventBtn').classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const eventsList = document.getElementById('eventsList');
    const eventsEmpty = document.getElementById('eventsEmpty');
    const notOrganizerState = document.getElementById('notOrganizerState');
    
    notOrganizerState.classList.add('hidden');
    
    if (events && events.length > 0) {
      eventsList.classList.remove('hidden');
      eventsEmpty.classList.add('hidden');
      
      eventsList.innerHTML = events.map(event => `
        <div class="glass rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all cursor-pointer">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h3 class="font-semibold mb-1">${event.name}</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">${event.venue}</p>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <div class="mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                event.status === 'published' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                event.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                event.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }">
                ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </div>
            </div>
            <div class="text-right">
              <button type="button" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                View →
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      eventsList.classList.add('hidden');
      eventsEmpty.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('Error loading events:', error);
    showError('Failed to load events');
  }
}

// Edit name
async function editName() {
  const newName = prompt('Enter your full name:', userProfile?.full_name || '');
  
  if (newName === null) return; // User cancelled
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('users')
      .update({ full_name: newName })
      .eq('id', user.id);
    
    if (error) throw error;
    
    // Update UI
    document.getElementById('settingsName').textContent = newName || 'Not set';
    document.getElementById('userName').textContent = newName || user.email.split('@')[0];
    
    if (userProfile) {
      userProfile.full_name = newName;
    }
    
    showSuccess('Name updated successfully');
    
  } catch (error) {
    console.error('Error updating name:', error);
    showError('Failed to update name');
  }
}

// Change password
async function changePassword() {
  const newPassword = prompt('Enter your new password (min 6 characters):');
  
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    showSuccess('Password updated successfully');
    
  } catch (error) {
    console.error('Error updating password:', error);
    showError('Failed to update password');
  }
}

// Handle logout
async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = '../login/';
  } catch (error) {
    console.error('Logout error:', error);
    showError('Failed to logout');
  }
}

// Show error message
function showError(message) {
  alert(message); // Simple for MVP, can be replaced with toast notifications
}

// Show success message
function showSuccess(message) {
  alert(message); // Simple for MVP, can be replaced with toast notifications
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
