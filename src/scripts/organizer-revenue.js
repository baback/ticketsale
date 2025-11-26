// Organizer Revenue Page Script

// Format currency with commas
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

// Initialize revenue page
async function initRevenuePage() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login/';
      return;
    }

    await loadRevenueData(session.user.id);
  } catch (error) {
    console.error('Error initializing revenue page:', error);
  }
}

async function loadRevenueData(organizerId) {
  try {
    // Get all completed orders for organizer's events
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        events!inner(organizer_id)
      `)
      .eq('events.organizer_id', organizerId)
      .in('status', ['paid', 'completed']);

    if (ordersError) throw ordersError;

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);

    // Get withdrawal requests
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    if (withdrawalsError) throw withdrawalsError;

    // Get payouts
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('paid_at', { ascending: false });

    if (payoutsError) throw payoutsError;

    // Calculate pending withdrawals
    const pendingWithdrawals = withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

    // Calculate total paid out
    const totalPaidOut = payouts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Available balance = total revenue - pending withdrawals - paid out
    const availableBalance = totalRevenue - pendingWithdrawals - totalPaidOut;

    // Update UI
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('availableBalance').textContent = formatCurrency(availableBalance);
    document.getElementById('pendingWithdrawals').textContent = formatCurrency(pendingWithdrawals);
    document.getElementById('modalAvailableBalance').textContent = formatCurrency(availableBalance);

    // Display withdrawal requests
    displayWithdrawalRequests(withdrawals);

    // Display transaction history (orders + payouts)
    displayTransactionHistory(orders, payouts);

  } catch (error) {
    console.error('Error loading revenue data:', error);
  }
}

function displayWithdrawalRequests(withdrawals) {
  const container = document.getElementById('withdrawalRequests');
  
  if (!withdrawals || withdrawals.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-neutral-600 dark:text-neutral-400">No withdrawal requests</div>';
    return;
  }

  container.innerHTML = withdrawals.map(withdrawal => {
    const statusColors = {
      pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      approved: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      rejected: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      completed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
    };

    const date = new Date(withdrawal.requested_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return `
      <div class="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div>
          <div class="font-medium">${formatCurrency(withdrawal.amount)}</div>
          <div class="text-sm text-neutral-600 dark:text-neutral-400">${date}</div>
          ${withdrawal.notes ? `<div class="text-xs text-neutral-500 dark:text-neutral-500 mt-1">${withdrawal.notes}</div>` : ''}
        </div>
        <div class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[withdrawal.status] || statusColors.pending}">
          ${withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
        </div>
      </div>
    `;
  }).join('');
}

function displayTransactionHistory(orders, payouts) {
  const container = document.getElementById('transactionHistory');
  
  // Combine and sort transactions
  const transactions = [
    ...orders.map(o => ({
      type: 'sale',
      amount: parseFloat(o.total || 0),
      date: o.created_at,
      description: `Order #${o.id.slice(0, 8)}`
    })),
    ...payouts.map(p => ({
      type: 'payout',
      amount: -parseFloat(p.amount || 0),
      date: p.paid_at,
      description: p.description || 'Payout'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (transactions.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-neutral-600 dark:text-neutral-400">No transactions yet</div>';
    return;
  }

  container.innerHTML = transactions.slice(0, 10).map(transaction => {
    const date = new Date(transaction.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isPositive = transaction.amount > 0;

    return `
      <div class="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div>
          <div class="font-medium">${transaction.description}</div>
          <div class="text-sm text-neutral-600 dark:text-neutral-400">${date}</div>
        </div>
        <div class="font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
          ${isPositive ? '+' : ''}${formatCurrency(transaction.amount)}
        </div>
      </div>
    `;
  }).join('');
}

// Withdrawal modal functions
function openWithdrawalModal() {
  document.getElementById('withdrawalModal').classList.remove('hidden');
}

function closeWithdrawalModal() {
  document.getElementById('withdrawalModal').classList.add('hidden');
  document.getElementById('withdrawAmount').value = '';
  document.getElementById('withdrawNotes').value = '';
}

async function submitWithdrawalRequest() {
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const notes = document.getElementById('withdrawNotes').value;

  if (!amount || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  // Get available balance
  const availableText = document.getElementById('modalAvailableBalance').textContent;
  const available = parseFloat(availableText.replace(/[$,]/g, ''));

  if (amount > available) {
    alert('Withdrawal amount exceeds available balance');
    return;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({
        organizer_id: session.user.id,
        amount: amount,
        notes: notes,
        status: 'pending'
      });

    if (error) throw error;

    alert('Withdrawal request submitted successfully!');
    closeWithdrawalModal();
    location.reload();
  } catch (error) {
    console.error('Error submitting withdrawal:', error);
    alert('Failed to submit withdrawal request');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initRevenuePage();

  // Withdrawal button
  const withdrawBtn = document.getElementById('withdrawBtn');
  if (withdrawBtn) {
    withdrawBtn.addEventListener('click', openWithdrawalModal);
  }

  // Confirm withdrawal
  const confirmBtn = document.getElementById('confirmWithdrawBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', submitWithdrawalRequest);
  }
});
