// Admin Users Management

let allUsers = [];
let filteredUsers = [];

async function loadUsers() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allUsers = users || [];
        filteredUsers = allUsers;
        renderTable();
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTable').innerHTML = 
            '<div class="text-center py-8 text-red-500">Error loading users</div>';
    }
}

function filterUsers() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    filteredUsers = allUsers.filter(user => {
        const matchesSearch = !search || 
            (user.full_name?.toLowerCase().includes(search)) ||
            (user.email?.toLowerCase().includes(search));
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesType = !typeFilter || user.user_type === typeFilter;

        return matchesSearch && matchesRole && matchesType;
    });

    renderTable();
}

function renderTable() {
    const container = document.getElementById('usersTable');

    if (filteredUsers.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-neutral-500">No users found</div>';
        return;
    }

    const tableHtml = `
        <table class="w-full">
            <thead>
                <tr class="border-b border-neutral-200 dark:border-neutral-800">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">User</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Role</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Type</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Joined</th>
                </tr>
            </thead>
            <tbody>
                ${filteredUsers.map(user => {
                    const date = new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });

                    return `
                        <tr class="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer" onclick="openEditSidebar('${user.id}')">
                            <td class="py-4 px-4">
                                <div class="font-medium">${user.full_name || 'No name'}</div>
                                <div class="text-sm text-neutral-600 dark:text-neutral-400">${user.email}</div>
                            </td>
                            <td class="py-4 px-4">
                                <span class="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                                    ${user.role || 'buyer'}
                                </span>
                            </td>
                            <td class="py-4 px-4">
                                <span class="px-3 py-1 rounded-full text-xs font-medium ${user.user_type === 'super_admin' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-neutral-100 dark:bg-neutral-800'}">
                                    ${user.user_type || 'user'}
                                </span>
                            </td>
                            <td class="py-4 px-4 text-sm text-neutral-600 dark:text-neutral-400">${date}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHtml;
}

// Edit sidebar functions
function openEditSidebar(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editFullName').value = user.full_name || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editRole').value = user.role || 'buyer';
    document.getElementById('editUserType').value = user.user_type || 'user';
    document.getElementById('editCreatedAt').value = new Date(user.created_at).toLocaleString();

    document.getElementById('editSidebar').classList.remove('translate-x-full');
    document.getElementById('sidebarOverlay').classList.remove('hidden');
}

function closeSidebar() {
    document.getElementById('editSidebar').classList.add('translate-x-full');
    document.getElementById('sidebarOverlay').classList.add('hidden');
}

async function saveUser(e) {
    e.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const updates = {
        full_name: document.getElementById('editFullName').value,
        role: document.getElementById('editRole').value,
        user_type: document.getElementById('editUserType').value
    };

    try {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;

        alert('User updated successfully!');
        closeSidebar();
        await loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user: ' + error.message);
    }
}

// Make functions global
window.openEditSidebar = openEditSidebar;
window.closeSidebar = closeSidebar;

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterUsers);
document.getElementById('roleFilter').addEventListener('change', filterUsers);
document.getElementById('typeFilter').addEventListener('change', filterUsers);
document.getElementById('editForm').addEventListener('submit', saveUser);

// Initialize
loadUsers();
