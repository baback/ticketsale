// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
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

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const theme = html.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Check authentication
async function checkAuth() {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    
    if (error || !session) {
        // Not logged in, redirect to login
        window.location.href = '/login/';
        return;
    }
    
    // User is logged in, load their data
    loadUserData(session.user);
}

// Load user data
async function loadUserData(user) {
    // Display email in nav
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('dashboardEmail').textContent = user.email;
    
    // Get user role from database
    try {
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();
        
        if (data) {
            document.getElementById('userRole').textContent = data.role;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const { error } = await window.supabaseClient.auth.signOut();
    
    if (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
    } else {
        // Redirect to home
        window.location.href = '/';
    }
});

// Initialize
checkAuth();
