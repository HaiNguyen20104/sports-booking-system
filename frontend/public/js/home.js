// Home page dynamic content
(function() {
  const accessToken = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const welcomeMessage = document.getElementById('welcome-message');
  const ctaButtons = document.getElementById('cta-buttons');
  const authOnlyButtons = document.querySelectorAll('.auth-only');
  
  if (accessToken && user.id) {
    // User is logged in
    welcomeMessage.textContent = `Xin chào, ${user.full_name}! Sẵn sàng đặt sân?`;
    
    // Hide register button for logged in users
    authOnlyButtons.forEach(btn => btn.style.display = 'none');
    
    // Add booking button for logged in users
    const bookingBtn = document.createElement('a');
    bookingBtn.href = '/bookings';
    bookingBtn.className = 'btn btn-secondary';
    bookingBtn.textContent = 'Đặt Sân Ngay';
    ctaButtons.appendChild(bookingBtn);
  } else {
    // User is not logged in - show default state
    welcomeMessage.textContent = 'Sẵn sàng đặt sân?';
  }
})();
