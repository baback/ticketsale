// Admin Events Management

let allEvents = [];
let filteredEvents = [];

async function loadEvents() {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select(`
                *,
                users!events_organizer_id_fkey (full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allEvents = events || [];
        filteredEvents = allEvents;
        renderTable();
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventsTable').innerHTML = 
            '<div class="text-center py-8 text-red-500">Error loading events</div>';
    }
}

function filterEvents() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    filteredEvents = allEvents.filter(event => {
        const matchesSearch = !search || 
            (event.title?.toLowerCase().includes(search)) ||
            (event.location?.toLowerCase().includes(search));
        const matchesStatus = !statusFilter || event.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderTable();
}

function renderTable() {
    const container = document.getElementById('eventsTable');

    if (filteredEvents.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-neutral-500">No events found</div>';
        return;
    }

    const tableHtml = `
        <table class="w-full">
            <thead>
                <tr class="border-b border-neutral-200 dark:border-neutral-800">
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Event</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Organizer</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Date</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th class="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Location</th>
                </tr>
            </thead>
            <tbody>
                ${filteredEvents.map(event => {
                    const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });

                    return `
                        <tr class="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer" onclick="openEditSidebar('${event.id}')">
                            <td class="py-4 px-4">
                                <div class="font-medium">${event.title}</div>
                                <div class="text-sm text-neutral-600 dark:text-neutral-400">${event.category || 'Uncategorized'}</div>
                            </td>
                            <td class="py-4 px-4">
                                <div class="text-sm">${event.users?.full_name || 'Unknown'}</div>
                                <div class="text-xs text-neutral-600 dark:text-neutral-400">${event.users?.email || ''}</div>
                            </td>
                            <td class="py-4 px-4 text-sm">${eventDate}</td>
                            <td class="py-4 px-4">
                                <span class="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                                    ${event.status || 'draft'}
                                </span>
                            </td>
                            <td class="py-4 px-4 text-sm text-neutral-600 dark:text-neutral-400">${event.location || 'TBA'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = tableHtml;
}

// Edit sidebar functions
function openEditSidebar(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    document.getElementById('editEventId').value = event.id;
    document.getElementById('editTitle').value = event.title || '';
    document.getElementById('editDescription').value = event.description || '';
    document.getElementById('editLocation').value = event.location || '';
    document.getElementById('editEventDate').value = event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '';
    document.getElementById('editCategory').value = event.category || '';
    document.getElementById('editStatus').value = event.status || 'draft';
    document.getElementById('editOrganizer').value = event.users?.full_name || event.users?.email || 'Unknown';

    document.getElementById('editSidebar').classList.remove('translate-x-full');
    document.getElementById('sidebarOverlay').classList.remove('hidden');
}

function closeSidebar() {
    document.getElementById('editSidebar').classList.add('translate-x-full');
    document.getElementById('sidebarOverlay').classList.add('hidden');
}

async function saveEvent(e) {
    e.preventDefault();

    const eventId = document.getElementById('editEventId').value;
    const updates = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        location: document.getElementById('editLocation').value,
        event_date: document.getElementById('editEventDate').value,
        category: document.getElementById('editCategory').value,
        status: document.getElementById('editStatus').value
    };

    try {
        const { error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', eventId);

        if (error) throw error;

        alert('Event updated successfully!');
        closeSidebar();
        await loadEvents();
    } catch (error) {
        console.error('Error updating event:', error);
        alert('Failed to update event: ' + error.message);
    }
}

window.openEditSidebar = openEditSidebar;
window.closeSidebar = closeSidebar;

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterEvents);
document.getElementById('statusFilter').addEventListener('change', filterEvents);
document.getElementById('editForm').addEventListener('submit', saveEvent);

// Initialize
loadEvents();
