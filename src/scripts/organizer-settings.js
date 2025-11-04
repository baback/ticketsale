// Organizer Settings Script

let currentUser = null;
let revenueData = null;

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
    await loadUserProfile();
    await loadRevenueData();
    await loadTeamMembers();
    highlightCurrentTheme();
}

// Setup tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update buttons
            tabBtns.forEach(b => {
                b.classList.remove('active', 'border-black', 'dark:border-white');
                b.classList.add('border-transparent', 'text-neutral-600', 'dark:text-neutral-400');
            });
            btn.classList.add('active', 'border-black', 'dark:border-white');
            btn.classList.remove('border-transparent', 'text-neutral-600', 'dark:text-neutral-400');
            
            // Update content
            tabContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`${tabName}Tab`).classList.remove('hidden');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('withdrawBtn').addEventListener('click', openWithdrawalModal);
    document.getElementById('confirmWithdrawBtn').addEventListener('click', submitWithdrawal);
    document.getElementById('inviteBtn').addEventListener('click', inviteTeamMember);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
    
    // Theme options
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
        });
    });
}

// Load user profile
async function loadUserProfile() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        if (data) {
            document.getElementById('fullName').value = data.full_name || '';
            document.getElementById('email').value = data.email || currentUser.email;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load revenue data
async function loadRevenueData() {
    try {
        // Get total revenue from all orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount, event_id')
            .in('status', ['paid', 'completed'])
            .eq('events.organizer_id', currentUser.id);
        
        if (ordersError) throw ordersError;
        
        // Calculate total revenue
        const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
        
        // Get pending withdrawals
        const { data: withdrawals, error: withdrawalsError } = await supabase
            .from('withdrawal_requests')
            .select('amount')
            .eq('organizer_id', currentUser.id)
            .eq('status', 'pending');
        
        if (withdrawalsError) throw withdrawalsError;
        
        const pendingAmount = withdrawals?.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0) || 0;
        
        // Get completed payouts
        const { data: payouts, error: payoutsError } = await supabase
            .from('payouts')
            .select('amount')
            .eq('organizer_id', currentUser.id);
        
        if (payoutsError) throw payoutsError;
        
        const paidOut = payouts?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
        
        // Calculate available balance
        const availableBalance = totalRevenue - paidOut - pendingAmount;
        
        // Update UI
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('availableBalance').textContent = `$${availableBalance.toFixed(2)}`;
        document.getElementById('pendingWithdrawals').textContent = `$${pendingAmount.toFixed(2)}`;
        document.getElementById('modalAvailableBalance').textContent = `$${availableBalance.toFixed(2)}`;
        
        revenueData = { totalRevenue, availableBalance, pendingAmount };
        
        // Load withdrawal requests
        await loadWithdrawalRequests();
        
        // Load transaction history
        await loadTransactionHistory();
        
    } catch (error) {
        console.error('Error loading revenue data:', error);
    }
}

// Load withdrawal requests
async function loadWithdrawalRequests() {
    try {
        const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('organizer_id', currentUser.id)
            .order('requested_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        const container = document.getElementById('withdrawalRequests');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-neutral-600 dark:text-neutral-400">No withdrawal requests</div>';
            return;
        }
        
        const statusColors = {
            pending: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400',
            processing: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
            completed: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400',
            rejected: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
        };
        
        container.innerHTML = data.map(request => {
            const date = new Date(request.requested_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            return `
                <div class="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div>
                        <div class="font-semibold">$${parseFloat(request.amount).toFixed(2)}</div>
                        <div class="text-sm text-neutral-600 dark:text-neutral-400">${date}</div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}">
                        ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading withdrawal requests:', error);
    }
}

// Load transaction history
async function loadTransactionHistory() {
    try {
        const { data, error } = await supabase
            .from('payouts')
            .select('*')
            .eq('organizer_id', currentUser.id)
            .order('paid_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        const container = document.getElementById('transactionHistory');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-neutral-600 dark:text-neutral-400">No transactions yet</div>';
            return;
        }
        
        container.innerHTML = data.map(payout => {
            const date = new Date(payout.paid_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            return `
                <div class="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <div>
                        <div class="font-semibold">$${parseFloat(payout.amount).toFixed(2)}</div>
                        <div class="text-sm text-neutral-600 dark:text-neutral-400">${payout.description || 'Payout'}</div>
                        <div class="text-xs text-neutral-500 dark:text-neutral-500">${date}</div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
                        Paid
                    </span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading transaction history:', error);
    }
}

// Open withdrawal modal
function openWithdrawalModal() {
    document.getElementById('withdrawalModal').classList.remove('hidden');
}

// Close withdrawal modal
window.closeWithdrawalModal = function() {
    document.getElementById('withdrawalModal').classList.add('hidden');
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawNotes').value = '';
};

// Submit withdrawal request
async function submitWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const notes = document.getElementById('withdrawNotes').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (amount > revenueData.availableBalance) {
        alert('Insufficient balance');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('withdrawal_requests')
            .insert([{
                organizer_id: currentUser.id,
                amount: amount,
                notes: notes
            }]);
        
        if (error) throw error;
        
        alert('Withdrawal request submitted successfully');
        closeWithdrawalModal();
        await loadRevenueData();
        
    } catch (error) {
        console.error('Error submitting withdrawal:', error);
        alert('Failed to submit withdrawal request');
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
                        <button onclick="removeTeamMember('${member.id}')" class="p-2 hover:bg-red-100 dark:hover:bg-red-950 rounded-lg transition-colors">
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

// Save profile
async function saveProfile() {
    const fullName = document.getElementById('fullName').value.trim();
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ full_name: fullName })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        alert('Profile updated successfully');
        
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to update profile');
    }
}

// Change password
async function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword || newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        
        alert('Password updated successfully');
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Failed to update password');
    }
}

// Set theme
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    highlightCurrentTheme();
}

// Highlight current theme
function highlightCurrentTheme() {
    const currentTheme = localStorage.getItem('theme') || 'system';
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        if (btn.dataset.theme === currentTheme) {
            btn.classList.add('border-black', 'dark:border-white');
            btn.classList.remove('border-neutral-200', 'dark:border-neutral-800');
        } else {
            btn.classList.remove('border-black', 'dark:border-white');
            btn.classList.add('border-neutral-200', 'dark:border-neutral-800');
        }
    });
}

// Initialize on page load
init();
