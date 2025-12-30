// Verify Email Handler
const errorDiv = document.getElementById('error-message');
const successDiv = document.getElementById('success-message');
const tokenInput = document.getElementById('token');

// Auto-fill token from localStorage if available
const savedToken = localStorage.getItem('verificationToken');
if (savedToken) {
  tokenInput.value = savedToken;
}

// Auto-verify if token in URL query params
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');
if (tokenFromUrl) {
  tokenInput.value = tokenFromUrl;
  // Auto submit
  setTimeout(() => {
    document.getElementById('verify-form').dispatchEvent(new Event('submit'));
  }, 500);
}

// Verify Form Handler
document.getElementById('verify-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Hide previous messages
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  
  // Get token
  const token = tokenInput.value.trim();
  
  if (!token) {
    errorDiv.textContent = 'Vui lòng nhập mã xác thực';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang xác thực...';
  
  try {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      successDiv.textContent = 'Xác thực email thành công! Đang chuyển đến trang đăng nhập...';
      successDiv.style.display = 'block';
      
      // Clear saved token
      localStorage.removeItem('verificationToken');
      
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } else {
      // Show error message
      errorDiv.textContent = data.message || 'Xác thực thất bại';
      errorDiv.style.display = 'block';
      
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Xác thực Email';
    }
    
  } catch (error) {
    console.error('Error:', error);
    errorDiv.textContent = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
    errorDiv.style.display = 'block';
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Xác thực Email';
  }
});
