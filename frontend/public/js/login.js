// Login Form Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Hide previous messages
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  
  // Lấy thông tin thiết bị (tokenDevice lấy từ localStorage, null nếu chưa có)
  const getDeviceInfo = () => ({
    deviceName: navigator.userAgent,
    platform: navigator.platform,
    tokenDevice: localStorage.getItem('tokenDevice') || null
  });

  // Get form data kèm thông tin thiết bị
  const formData = {
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
    ...getDeviceInfo()
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
      
      // Lưu deviceId và tokenDevice nếu backend trả về
      if (data.data.device && data.data.device.id) {
        localStorage.setItem('deviceId', data.data.device.id);
      }
      if (data.data.device && data.data.device.tokenDevice) {
        localStorage.setItem('tokenDevice', data.data.device.tokenDevice);
      }
      
      // Show success message
      successDiv.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
      successDiv.style.display = 'block';
      
      // Đăng ký push notification (nếu browser hỗ trợ)
      if (window.PushNotification && PushNotification.isSupported()) {
        try {
          const subscribed = await PushNotification.subscribeAndSave();
          if (subscribed) {
            console.log('Push notification subscribed successfully');
          }
        } catch (err) {
          console.warn('Push subscription failed:', err);
        }
      }

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
