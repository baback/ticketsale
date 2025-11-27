// Admin Guard - Protects all /admin/* pages
// This MUST be included at the top of every admin page

async function checkSuperAdminAccess() {
    try {
        console.log('[Admin Guard] Checking access...');
        
        // Check if user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('[Admin Guard] Session error:', sessionError);
            window.location.href = '/login/?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }
        
        if (!session) {
            console.warn('[Admin Guard] No session found, redirecting to login');
            window.location.href = '/login/?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }

        console.log('[Admin Guard] Session found for user:', session.user.id);

        // Get user profile with user_type (user can always read their own record)
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_type, role, email')
            .eq('id', session.user.id)
            .maybeSingle();

        if (userError) {
            console.error('[Admin Guard] Error fetching user:', userError);
            window.location.href = '/login/';
            return false;
        }
        
        if (!user) {
            console.error('[Admin Guard] User not found in database');
            // If user doesn't exist in users table, create it
            console.log('[Admin Guard] User not in users table, creating...');
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: session.user.id,
                    email: session.user.email,
                    role: 'buyer',
                    user_type: session.user.email === 'babackxyz@gmail.com' ? 'super_admin' : 'user'
                });
            
            if (insertError) {
                console.error('[Admin Guard] Failed to create user:', insertError);
                window.location.href = '/login/';
                return false;
            }
            
            // Retry fetching user
            const { data: newUser, error: retryError } = await supabase
                .from('users')
                .select('user_type, role, email')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (retryError || !newUser) {
                console.error('[Admin Guard] Failed to fetch user after creation');
                window.location.href = '/login/';
                return false;
            }
            
            user = newUser;
        }

        console.log('[Admin Guard] User data:', { email: user.email, user_type: user.user_type, role: user.role });

        // Check if user is super_admin
        if (user.user_type !== 'super_admin') {
            console.warn('[Admin Guard] Access denied: User is not super admin');
            
            // Redirect based on their role
            if (user.role === 'organizer') {
                window.location.href = '/dashboard/organizer/';
            } else {
                window.location.href = '/dashboard/';
            }
            return false;
        }

        // User is super admin - allow access
        console.log('[Admin Guard] ✅ Super admin access granted:', user.email);
        return true;

    } catch (error) {
        console.error('[Admin Guard] Unexpected error:', error);
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
