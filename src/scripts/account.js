// Account Page Script
// Handles account management functionality

(async function initAccountPage() {
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }

  // Load user data
  loadUserData();

  // Save profile
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

  // Change password
  document.getElementById('changePasswordBtn').addEventListener('click', changePassword);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);
})();

async function loadUserData() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    document.getElementById('email').value = session.user.email || '';
    document.getElementById('fullName').value = session.user.user_metadata?.full_name || '';
  }
}

async function saveProfile() {
  const fullName = document.getElementById('fullName').value.trim();
  
  if (!fullName) {
    alert('Please enter your full name');
    return;
  }

  const btn = document.getElementById('saveProfileBtn');
  const originalText = btn.textContent;
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });

    if (error) throw error;

    alert('Profile updated successfully!');
    
    // Reload to update sidebar
    setTimeout(() => location.reload(), 500);
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Error updating profile: ' + error.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function changePassword() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!newPassword || !confirmPassword) {
    alert('Please fill in both password fields');
    return;
  }

  if (newPassword.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  const btn = document.getElementById('changePasswordBtn');
  const originalText = btn.textContent;
  btn.textContent = 'Updating...';
  btn.disabled = true;

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    alert('Password updated successfully!');
    
    // Clear password fields
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (error) {
    console.error('Error updating password:', error);
    alert('Error updating password: ' + error.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function logout() {
  if (confirm('Are you sure you want to logout?')) {
    await supabase.auth.signOut();
    window.location.href = '/';
  }
}
