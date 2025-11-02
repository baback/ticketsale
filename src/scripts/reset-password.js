/** @format */

const resetForm = document.getElementById('resetForm');
const messageDiv = document.getElementById('message');

// Check for token in URL on page load
window.addEventListener('DOMContentLoaded', async () => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const type = hashParams.get('type');
  
  if (accessToken && type === 'recovery') {
    // Token is valid, user can proceed to reset password
    console.log('Valid recovery token found');
  } else {
    // No valid token, show error
    showMessage('Invalid or expired reset link. Please request a new password reset.', true);
    resetForm.querySelector('button[type="submit"]').disabled = true;
  }
});

// Message helpers
function showMessage(text, isError = false) {
  messageDiv.textContent = text;
  messageDiv.classList.remove('hidden');
  if (isError) {
    messageDiv.classList.add('bg-red-100', 'dark:bg-red-900/20', 'text-red-600', 'dark:text-red-400');
    messageDiv.classList.remove('bg-green-100', 'dark:bg-green-900/20', 'text-green-600', 'dark:text-green-400');
  } else {
    messageDiv.classList.add('bg-green-100', 'dark:bg-green-900/20', 'text-green-600', 'dark:text-green-400');
    messageDiv.classList.remove('bg-red-100', 'dark:bg-red-900/20', 'text-red-600', 'dark:text-red-400');
  }
}

function hideMessage() {
  messageDiv.classList.add('hidden');
}

// Reset password handler
resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage();
  
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    showMessage('Passwords do not match', true);
    return;
  }
  
  if (newPassword.length < 6) {
    showMessage('Password must be at least 6 characters', true);
    return;
  }
  
  const submitBtn = resetForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Resetting...';
  
  try {
    const { error } = await window.supabaseClient.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    showMessage('Password reset successful! Redirecting to login...');
    
    // Redirect to login after delay
    setTimeout(() => {
      window.location.href = '/login/';
    }, 2000);
    
  } catch (error) {
    console.error('Password reset error:', error);
    showMessage(error.message || 'Failed to reset password. Please try again.', true);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Reset Password';
  }
});
