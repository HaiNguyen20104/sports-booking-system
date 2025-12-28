// Login Form Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Hide previous messages
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  
  // Get form data
  const formData = {
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value
  };
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang đăng nhập...';
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store access token
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Show success message
      successDiv.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
      successDiv.style.display = 'block';
      
      // Redirect to home page
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } else {
      // Show error message
      errorDiv.textContent = data.message || 'Đăng nhập thất bại';
      errorDiv.style.display = 'block';
      
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Đăng nhập';
    }
    
  } catch (error) {
    console.error('Error:', error);
    errorDiv.textContent = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
    errorDiv.style.display = 'block';
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Đăng nhập';
  }
});
