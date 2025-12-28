// Auth Check - Run on every page to update nav menu
(function() {
  const accessToken = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const authLinks = document.querySelectorAll('.auth-links');
  const userMenuItems = document.querySelectorAll('.user-menu');
  
  if (accessToken && user.id) {
    // User is logged in - show user menu, hide auth links
    authLinks.forEach(link => link.style.display = 'none');
    userMenuItems.forEach(item => item.style.display = 'block');
    
    // Update profile link text with user name
    const profileLink = document.querySelector('.user-menu a[href="/profile"] span');
    if (profileLink && user.full_name) {
      profileLink.textContent = `👤 ${user.full_name}`;
    }
  } else {
    // User is not logged in - show auth links, hide user menu
    authLinks.forEach(link => link.style.display = 'block');
    userMenuItems.forEach(item => item.style.display = 'none');
  }
  
  // Logout handler
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    });
  }
})();
