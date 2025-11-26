// Organizer Settings Script

let currentUser = null;

// Initialize
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '/login/';
        return;
    }
    
    currentUser = session.user;
    
    setupTabs();
    setupEventListeners();
    await loadTeamMembers();
}

// Setup tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabBtns.length === 0) return;
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update buttons
            tabBtns.forEach(b => {
                b.classList.remove('border-black', 'dark:border-white');
                b.classList.add('border-transparent', 'text-neutral-600', 'dark:text-neutral-400');
            });
            btn.classList.add('border-black', 'dark:border-white');
            btn.classList.remove('border-transparent', 'text-neutral-600', 'dark:text-neutral-400');
            
            // Update content
            tabContents.forEach(content => content.classList.add('hidden'));
            const targetTab = document.getElementById(`${tabName}Tab`);
            if (targetTab) targetTab.classList.remove('hidden');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    const inviteBtn = document.getElementById('inviteBtn');
    if (inviteBtn) {
        inviteBtn.addEventListener('click', inviteTeamMember);
    }
}

// Load team members
async function loadTeamMembers() {
    try {
        const { data, error } = await supabase
            .from('team_members')
            .select('*, users(full_name, email)')
            .eq('organizer_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('teamMembers');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-neutral-600 dark:text-neutral-400">No team members yet</div>';
            return;
        }
        
        const statusColors = {
            pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400',
            active: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
            inactive: 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400'
        };
        
        const roleColors = {
            admin: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400',
            staff: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
            scanner: 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400'
        };
        
        container.innerHTML = data.map(member => {
            const displayName = member.users?.full_name || member.email;
            const displayEmail = member.users?.email || member.email;
            
            return `
                <div class="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div class="flex-1">
                        <div class="font-semibold">${displayName}</div>
                        <div class="text-sm text-neutral-600 dark:text-neutral-400">${displayEmail}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}">
                            ${member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[member.status]}">
                            ${member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                        <button type="button" onclick="removeTeamMember('${member.id}')" class="p-2 hover:bg-red-100 dark:hover:bg-red-950 rounded-lg transition-colors">
                            <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

// Invite team member
async function inviteTeamMember() {
    const email = document.getElementById('inviteEmail').value.trim();
    const role = document.getElementById('inviteRole').value;
    
    if (!email) {
        alert('Please enter an email address');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('team_members')
            .insert([{
                organizer_id: currentUser.id,
                email: email,
                role: role
            }]);
        
        if (error) throw error;
        
        alert('Team member invited successfully');
        document.getElementById('inviteEmail').value = '';
        await loadTeamMembers();
        
    } catch (error) {
        console.error('Error inviting team member:', error);
        if (error.code === '23505') {
            alert('This email is already invited');
        } else {
            alert('Failed to invite team member');
        }
    }
}

// Remove team member
window.removeTeamMember = async function(memberId) {
    if (!confirm('Are you sure you want to remove this team member?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId);
        
        if (error) throw error;
        
        await loadTeamMembers();
        
    } catch (error) {
        console.error('Error removing team member:', error);
        alert('Failed to remove team member');
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
