// Account Page Dynamic Sidebar Script
// This script loads the appropriate sidebar based on user role

(async function initAccountSidebar() {
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }

  try {
    // Get user role from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      // Default to buyer if error
      await loadBuyerSidebar();
      return;
    }

    const userRole = userData?.role || 'buyer';

    // Load appropriate sidebar based on role
    if (userRole === 'organizer') {
      await loadOrganizerSidebar();
    } else {
      await loadBuyerSidebar();
    }
  } catch (error) {
    console.error('Error initializing account sidebar:', error);
    // Default to buyer sidebar on error
    await loadBuyerSidebar();
  }
})();

async function loadOrganizerSidebar() {
  const sidebarContainer = document.getElementById('dynamicSidebar');
  if (!sidebarContainer) return;

  try {
    const response = await fetch('/dashboard/organizer-sidebar.html');
    const sidebarHTML = await response.text();
    sidebarContainer.innerHTML = sidebarHTML;
    
    // Wait for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize sidebar functionality directly
    await initOrganizerSidebarFunctionality();
  } catch (error) {
    console.error('Error loading organizer sidebar:', error);
  }
}

async function loadBuyerSidebar() {
  const sidebarContainer = document.getElementById('dynamicSidebar');
  if (!sidebarContainer) return;

  try {
    const response = await fetch('/dashboard/sidebar.html');
    const sidebarHTML = await response.text();
    sidebarContainer.innerHTML = sidebarHTML;
    
    // Wait for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initialize sidebar functionality directly
    await initBuyerSidebarFunctionality();
  } catch (error) {
    console.error('Error loading buyer sidebar:', error);
  }
}

// Initialize organizer sidebar functionality
async function initOrganizerSidebarFunctionality() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // Load user info
  const email = session.user.email || '';
  const name = session.user.user_metadata?.full_name || email.split('@')[0] || 'User';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  // Desktop sidebar
  const userDisplayName = document.getElementById('userDisplayName');
  const userEmailShort = document.getElementById('userEmailShort');
  const userAvatar = document.getElementById('userAvatar');
  
  if (userDisplayName) {
    userDisplayName.className = 'text-sm font-medium truncate';
    userDisplayName.textContent = name;
  }
  if (userEmailShort) {
    userEmailShort.className = 'text-xs text-neutral-600 dark:text-neutral-400 truncate';
    userEmailShort.textContent = email;
  }
  if (userAvatar) {
    userAvatar.className = 'w-10 h-10 shrink-0 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-semibold text-sm';
    userAvatar.textContent = initials;
  }
  
  // Mobile bottom nav
  const mobileUserAvatar = document.getElementById('mobileUserAvatar');
  if (mobileUserAvatar) {
    mobileUserAvatar.textContent = initials;
  }
  
  // Mobile modal
  const modalUserAvatar = document.getElementById('modalUserAvatar');
  const modalUserName = document.getElementById('modalUserName');
  const modalUserEmail = document.getElementById('modalUserEmail');
  
  if (modalUserAvatar) modalUserAvatar.textContent = initials;
  if (modalUserName) modalUserName.textContent = name;
  if (modalUserEmail) modalUserEmail.textContent = email;

  // Setup event listeners
  setupOrganizerSidebarEvents();
}

// Initialize buyer sidebar functionality
async function initBuyerSidebarFunctionality() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // Load user info
  const email = session.user.email || '';
  const name = session.user.user_metadata?.full_name || email.split('@')[0] || 'User';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  // Desktop sidebar
  const userDisplayName = document.getElementById('userDisplayName');
  const userEmailShort = document.getElementById('userEmailShort');
  const userAvatar = document.getElementById('userAvatar');
  
  if (userDisplayName) {
    userDisplayName.className = 'text-sm font-medium truncate';
    userDisplayName.textContent = name;
  }
  if (userEmailShort) {
    userEmailShort.className = 'text-xs text-neutral-600 dark:text-neutral-400 truncate';
    userEmailShort.textContent = email;
  }
  if (userAvatar) {
    userAvatar.className = 'w-10 h-10 shrink-0 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-semibold text-sm';
    userAvatar.textContent = initials;
  }
  
  // Mobile bottom nav
  const mobileUserAvatar = document.getElementById('mobileUserAvatar');
  if (mobileUserAvatar) {
    mobileUserAvatar.textContent = initials;
  }
  
  // Mobile modal
  const modalUserAvatar = document.getElementById('modalUserAvatar');
  const modalUserName = document.getElementById('modalUserName');
  const modalUserEmail = document.getElementById('modalUserEmail');
  
  if (modalUserAvatar) modalUserAvatar.textContent = initials;
  if (modalUserName) modalUserName.textContent = name;
  if (modalUserEmail) modalUserEmail.textContent = email;

  // Setup event listeners
  setupBuyerSidebarEvents();
}

// Setup organizer sidebar event listeners
function setupOrganizerSidebarEvents() {
  // Mobile user menu
  const mobileUserMenuBtn = document.getElementById('mobileUserMenuBtn');
  const mobileUserModal = document.getElementById('mobileUserModal');
  const closeMobileUserModal = document.getElementById('closeMobileUserModal');
  
  if (mobileUserMenuBtn && mobileUserModal) {
    mobileUserMenuBtn.addEventListener('click', () => {
      mobileUserModal.classList.remove('hidden');
    });
    
    if (closeMobileUserModal) {
      closeMobileUserModal.addEventListener('click', () => {
        mobileUserModal.classList.add('hidden');
      });
    }
    
    mobileUserModal.addEventListener('click', (e) => {
      if (e.target === mobileUserModal) {
        mobileUserModal.classList.add('hidden');
      }
    });
  }
  
  // Theme toggles
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', () => {
      if (typeof window.toggleTheme === 'function') {
        window.toggleTheme();
      }
    });
  }
  
  const themeToggle = document.getElementById('dropdownThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (typeof window.toggleTheme === 'function') {
        window.toggleTheme();
      }
    });
  }
  
  // User dropdown
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });
  }
  
  // Logout buttons
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
    });
  }
  
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
    });
  }
}

// Setup buyer sidebar event listeners
function setupBuyerSidebarEvents() {
  // Similar to organizer but for buyer sidebar
  const mobileUserMenuBtn = document.getElementById('mobileUserMenuBtn');
  const mobileUserModal = document.getElementById('mobileUserModal');
  const closeMobileUserModal = document.getElementById('closeMobileUserModal');
  
  if (mobileUserMenuBtn && mobileUserModal) {
    mobileUserMenuBtn.addEventListener('click', () => {
      mobileUserModal.classList.remove('hidden');
    });
    
    if (closeMobileUserModal) {
      closeMobileUserModal.addEventListener('click', () => {
        mobileUserModal.classList.add('hidden');
      });
    }
    
    mobileUserModal.addEventListener('click', (e) => {
      if (e.target === mobileUserModal) {
        mobileUserModal.classList.add('hidden');
      }
    });
  }
  
  // Theme toggles
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', () => {
      if (typeof window.toggleTheme === 'function') {
        window.toggleTheme();
      }
    });
  }
  
  const themeToggle = document.getElementById('dropdownThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (typeof window.toggleTheme === 'function') {
        window.toggleTheme();
      }
    });
  }
  
  // User dropdown
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });
  }
  
  // Logout buttons
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
    });
  }
  
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
    });
  }
}
