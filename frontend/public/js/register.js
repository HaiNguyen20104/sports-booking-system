// Register Form Handler
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Hide previous messages
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  
  // Get form data
  const formData = {
    full_name: document.getElementById('full_name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim() || null,
    password: document.getElementById('password').value,
    confirmPassword: document.getElementById('confirmPassword').value,
    role: document.getElementById('role').value
  };
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang xử lý...';
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      successDiv.textContent = data.message + ' Bạn sẽ được chuyển đến trang xác thực email...';
      successDiv.style.display = 'block';
      
      // Store verification token
      if (data.data.verificationToken) {
        localStorage.setItem('verificationToken', data.data.verificationToken);
      }
      
      // Redirect to verify page after 2 seconds
      setTimeout(() => {
        window.location.href = '/verify-email';
      }, 2000);
      
    } else {
      // Show error message
      if (data.errors && data.errors.length > 0) {
        errorDiv.textContent = data.errors.map(err => err.message).join(', ');
      } else {
        errorDiv.textContent = data.message || 'Đăng ký thất bại';
      }
      errorDiv.style.display = 'block';
      
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đăng ký';
    }
    
  } catch (error) {
    console.error('Error:', error);
    errorDiv.textContent = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
    errorDiv.style.display = 'block';
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Đăng ký';
  }
});
