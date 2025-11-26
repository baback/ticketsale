// Theme Management Script
// This script handles dark/light mode across all pages

(function initTheme() {
  // Get stored theme preference or default to dark
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    // Default to system preference if no stored theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
})();

// Function to toggle theme
function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}

// Function to set specific theme
function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else if (theme === 'system') {
    localStorage.removeItem('theme');
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

// Export functions for use in other scripts
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
