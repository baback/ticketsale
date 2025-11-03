/** @format */

// Initialize theme
if (!localStorage.getItem('theme')) {
  localStorage.setItem('theme', 'dark');
  document.documentElement.classList.add('dark');
}

if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Dashboard functionality
let currentMode = 'buyer'; // 'buyer' or 'organizer'
let userProfile = null;
const supabase = window.supabaseClient;

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
    const userName = document.getElementById('userName');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmailShort = document.getElementById('userEmailShort');
    const userAvatar = document.getElementById('userAvatar');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsName = document.getElementById('settingsName');
    
    const displayName = userProfile.full_name || user.email.split('@')[0];
    const initials = getInitials(displayName);
    
    if (userName) userName.textContent = displayName;
    if (userDisplayName) userDisplayName.textContent = displayName;
    if (userEmailShort) userEmailShort.textContent = user.email;
    if (userAvatar) userAvatar.textContent = initials;
    if (settingsEmail) settingsEmail.textContent = user.email;
    if (settingsName) settingsName.textContent = userProfile.full_name || 'Not set';
    
  } catch (error) {
    console.error('Error loading profile:', error);
    // If profile doesn't exist, user info from auth is still available
    const user = (await supabase.auth.getUser()).data.user;
    const userName = document.getElementById('userName');
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmailShort = document.getElementById('userEmailShort');
    const userAvatar = document.getElementById('userAvatar');
    const settingsEmail = document.getElementById('settingsEmail');
    
    const displayName = user.email.split('@')[0];
    const initials = getInitials(displayName);
    
    if (userName) userName.textContent = displayName;
    if (userDisplayName) userDisplayName.textContent = displayName;
    if (userEmailShort) userEmailShort.textContent = user.email;
    if (userAvatar) userAvatar.textContent = initials;
    if (settingsEmail) settingsEmail.textContent = user.email;
  }
}

// Get user initials
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Set up event listeners
function setupEventListeners() {
  // User menu dropdown
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      userDropdown.classList.add('hidden');
    });
  }
  
  // Mode switch button in dropdown
  const switchModeBtn = document.getElementById('switchModeBtn');
  if (switchModeBtn) {
    switchModeBtn.addEventListener('click', () => {
      const newMode = currentMode === 'buyer' ? 'organizer' : 'buyer';
      switchMode(newMode);
      userDropdown.classList.add('hidden');
    });
  }
  
  // Theme toggle in dropdown
  const dropdownThemeToggle = document.getElementById('dropdownThemeToggle');
  if (dropdownThemeToggle) {
    dropdownThemeToggle.addEventListener('click', toggleTheme);
  }
  
  // Navigation items
  const navOverview = document.getElementById('navOverview');
  const navTickets = document.getElementById('navTickets');
  const navEvents = document.getElementById('navEvents');
  const navSettings = document.getElementById('navSettings');
  
  if (navOverview) navOverview.addEventListener('click', (e) => { e.preventDefault(); showSection('overview'); });
  if (navTickets) navTickets.addEventListener('click', (e) => { e.preventDefault(); showSection('tickets'); });
  if (navEvents) navEvents.addEventListener('click', (e) => { e.preventDefault(); showSection('events'); });
  if (navSettings) navSettings.addEventListener('click', (e) => { e.preventDefault(); showSection('settings'); });
  
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
  
  const buyerContent = document.getElementById('buyerContent');
  const organizerContent = document.getElementById('organizerContent');
  const switchModeText = document.getElementById('switchModeText');
  const currentModeText = document.getElementById('currentModeText');
  const navTickets = document.getElementById('navTickets');
  const navEvents = document.getElementById('navEvents');
  
  if (mode === 'buyer') {
    // Show/hide content
    buyerContent.classList.remove('hidden');
    organizerContent.classList.add('hidden');
    
    // Update UI text
    if (switchModeText) switchModeText.textContent = 'Switch to Organizer';
    if (currentModeText) currentModeText.textContent = 'Buyer Mode';
    
    // Update navigation
    if (navTickets) navTickets.classList.remove('hidden');
    if (navEvents) navEvents.classList.add('hidden');
  } else {
    // Show/hide content
    organizerContent.classList.remove('hidden');
    buyerContent.classList.add('hidden');
    
    // Update UI text
    if (switchModeText) switchModeText.textContent = 'Switch to Buyer';
    if (currentModeText) currentModeText.textContent = 'Organizer Mode';
    
    // Update navigation
    if (navTickets) navTickets.classList.add('hidden');
    if (navEvents) navEvents.classList.remove('hidden');
  }
  
  // Load content for the selected mode
  loadContent();
}

// Show different sections
function showSection(section) {
  // This will be expanded later for different views
  console.log('Showing section:', section);
}

// Toggle theme
function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  const theme = html.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
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
    console.log('Loading tickets...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User ID:', user.id);
    
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (
          title,
          location,
          event_date
        ),
        ticket_types (
          name,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log('Tickets query result:', { tickets, error });
    
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
              <h3 class="font-semibold mb-1">${ticket.events.title}</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">${ticket.events.location}</p>
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
