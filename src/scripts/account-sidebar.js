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
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Load organizer sidebar script
    const script = document.createElement('script');
    script.src = '/src/scripts/organizer-sidebar.js';
    script.onload = () => {
      console.log('Organizer sidebar script loaded');
    };
    document.body.appendChild(script);
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
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Load buyer sidebar script
    const script = document.createElement('script');
    script.src = '/src/scripts/dashboard-sidebar.js';
    script.onload = () => {
      console.log('Buyer sidebar script loaded');
    };
    document.body.appendChild(script);
  } catch (error) {
    console.error('Error loading buyer sidebar:', error);
  }
}
