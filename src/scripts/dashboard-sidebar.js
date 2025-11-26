// Dashboard Sidebar Component Script
// This script handles all sidebar functionality across dashboard pages

(async function initDashboardSidebar() {
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }

  // Track that we're in buyer mode
  localStorage.setItem('lastMode', 'buyer');

  // Load sidebar HTML
  const sidebarContainer = document.getElementById('dashboardSidebar');
  if (sidebarContainer) {
    try {
      const response = await fetch('/dashboard/sidebar.html');
      const sidebarHTML = await response.text();
      sidebarContainer.innerHTML = sidebarHTML;
      
      // Initialize sidebar after loading
      initSidebarFunctionality();
    } catch (error) {
      console.error('Error loading sidebar:', error);
    }
  }

  function initSidebarFunctionality() {
    // Load user info
    loadUserInfo();
    
    // Highlight active nav item
    highlightActiveNav();
    
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
    
    // Mobile theme toggle
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    if (mobileThemeToggle) {
      mobileThemeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      });
    }
    
    // Mobile logout
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      });
    }
    
    // User dropdown toggle
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.add('hidden');
        }
      });
    }

    // Theme toggle
    const themeToggle = document.getElementById('dropdownThemeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      });
    }

    // Switch mode button is now a link, no JS needed

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
      });
    }
  }

  async function loadUserInfo() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
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
    }
  }

  function highlightActiveNav() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('[data-nav]');
    
    navLinks.forEach(link => {
      link.classList.remove('bg-neutral-100', 'dark:bg-neutral-800');
      
      const navType = link.getAttribute('data-nav');
      if (
        (navType === 'overview' && path === '/dashboard') ||
        (navType === 'overview' && path === '/dashboard/') ||
        (navType === 'mytickets' && path.includes('/dashboard/mytickets')) ||
        (navType === 'events' && path.includes('/dashboard/events'))
      ) {
        link.classList.add('bg-neutral-100', 'dark:bg-neutral-800');
      }
    });
  }
})();
