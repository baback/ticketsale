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
                        <tr class="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
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

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterUsers);
document.getElementById('roleFilter').addEventListener('change', filterUsers);
document.getElementById('typeFilter').addEventListener('change', filterUsers);

// Initialize
loadUsers();
