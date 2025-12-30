document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reset-password-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  const tokenInput = document.getElementById('token');

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    tokenInput.value = token;
  } else {
    errorMessage.innerHTML = 'Token không hợp lệ hoặc đã hết hạn. <a href="/forgot-password">Yêu cầu đặt lại mật khẩu mới</a>';
    errorMessage.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const resetToken = tokenInput.value;

    // Clear previous alerts
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Validate passwords match
    if (password !== confirmPassword) {
      errorMessage.textContent = 'Mật khẩu không khớp. Vui lòng thử lại.';
      errorMessage.style.display = 'block';
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      errorMessage.textContent = 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số.';
      errorMessage.style.display = 'block';
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';

    try {
      const response = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          password,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        successMessage.innerHTML = data.data.message + '<br><small>Đang chuyển đến trang đăng nhập...</small>';
        successMessage.style.display = 'block';
        
        // Clear form
        form.reset();

        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        // Show error message
        let errorMsg = data.error || 'Có lỗi xảy ra. Vui lòng thử lại.';
        if (errorMsg.includes('expired') || errorMsg.includes('Invalid')) {
          errorMsg += ' <a href="/forgot-password">Yêu cầu đặt lại mật khẩu mới</a>';
        }
        errorMessage.innerHTML = errorMsg;
        errorMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Reset password error:', error);
      errorMessage.textContent = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
      errorMessage.style.display = 'block';
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
