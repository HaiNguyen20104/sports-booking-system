// Profile Page Handler
const errorDiv = document.getElementById('error-message');
const profileContent = document.getElementById('profile-content');

// Check if user is logged in
const accessToken = localStorage.getItem('accessToken');
if (!accessToken) {
  window.location.href = '/login';
}

// Fetch user profile
async function loadProfile() {
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayProfile(data.data);
    } else {
      // Token invalid or expired
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        errorDiv.textContent = data.message || 'Không thể tải thông tin';
        errorDiv.style.display = 'block';
        profileContent.innerHTML = '';
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    errorDiv.textContent = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
    errorDiv.style.display = 'block';
    profileContent.innerHTML = '';
  }
}

// Display profile information
function displayProfile(user) {
  profileContent.innerHTML = `
    <div class="profile-info">
      <div class="info-row">
        <span class="info-label">ID:</span>
        <span class="info-value">${user.id}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Họ và tên:</span>
        <span class="info-value">${user.full_name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${user.email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Vai trò:</span>
        <span class="info-value badge badge-${user.role}">${getRoleName(user.role)}</span>
      </div>
    </div>
  `;
}

// Get role display name
function getRoleName(role) {
  const roles = {
    'customer': 'Người dùng',
    'manager': 'Chủ sân',
    'admin': 'Quản trị viên'
  };
  return roles[role] || role;
}

// Logout handler
document.getElementById('logout-btn').addEventListener('click', () => {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
});

// Load profile on page load
loadProfile();
