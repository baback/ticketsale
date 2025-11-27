// Admin Guard - Protects all /admin/* pages
// This MUST be included at the top of every admin page

async function checkSuperAdminAccess() {
    try {
        // Check if user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.warn('No session found, redirecting to login');
            window.location.href = '/login/?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }

        // Get user profile with user_type
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_type, role, email')
            .eq('id', session.user.id)
            .single();

        if (userError) {
            console.error('Error fetching user:', userError);
            window.location.href = '/login/';
            return false;
        }

        // Check if user is super_admin
        if (user.user_type !== 'super_admin') {
            console.warn('Access denied: User is not super admin');
            
            // Redirect based on their role
            if (user.role === 'organizer') {
                window.location.href = '/dashboard/organizer/';
            } else {
                window.location.href = '/dashboard/';
            }
            return false;
        }

        // User is super admin - allow access
        console.log('Super admin access granted:', user.email);
        return true;

    } catch (error) {
        console.error('Admin guard error:', error);
        window.location.href = '/login/';
        return false;
    }
}

// Auto-run on page load
(async function() {
    const isAllowed = await checkSuperAdminAccess();
    if (!isAllowed) {
        // Stop page execution
        document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;"><div style="text-align: center;"><h1>Access Denied</h1><p>Redirecting...</p></div></div>';
    }
})();
