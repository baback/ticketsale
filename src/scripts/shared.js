/** @format */

// Shared components and utilities for all public pages

// Get user initials
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Check if user is logged in and update nav
async function updateNavAuth() {
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    const signInLink = document.getElementById('signInLink');
    const organizersLink = document.getElementById('organizersLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const userAvatarLink = document.getElementById('userAvatarLink');
    const headerUserAvatar = document.getElementById('headerUserAvatar');
    
    if (session) {
      // User is logged in
      if (signInLink) signInLink.classList.add('hidden');
      if (organizersLink) organizersLink.classList.add('hidden');
      if (dashboardLink) dashboardLink.classList.remove('hidden');
      if (userAvatarLink) userAvatarLink.classList.remove('hidden');
      
      // Get user profile for initials
      const { data: profile } = await window.supabaseClient
        .from('users')
        .select('full_name, email')
        .eq('id', session.user.id)
        .single();
      
      const displayName = profile?.full_name || session.user.email.split('@')[0];
      const initials = getInitials(displayName);
      
      if (headerUserAvatar) {
        headerUserAvatar.textContent = initials;
      }
    } else {
      // User is logged out
      if (signInLink) signInLink.classList.remove('hidden');
      if (organizersLink) organizersLink.classList.remove('hidden');
      if (dashboardLink) dashboardLink.classList.add('hidden');
      if (userAvatarLink) userAvatarLink.classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}

// Initialize theme
function initTheme() {
  const html = document.documentElement;
  
  if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'dark');
    html.classList.add('dark');
  }

  if (localStorage.getItem('theme') === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      html.classList.toggle('dark');
      const theme = html.classList.contains('dark') ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
    });
  }
}

// Smooth scroll for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Initialize all shared functionality
function initShared() {
  initTheme();
  initSmoothScroll();
  updateNavAuth();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShared);
} else {
  initShared();
}
