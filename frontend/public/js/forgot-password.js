document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-password-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;

    // Clear previous alerts
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        let message = data.data.message;
        if (data.data.resetToken) {
          message += `<br><br><strong>Reset Token:</strong><br><small style="word-break: break-all;">${data.data.resetToken}</small>`;
        }
        successMessage.innerHTML = message;
        successMessage.style.display = 'block';
        
        // Clear form
        form.reset();

        // Redirect to login after 5 seconds if no token shown
        if (!data.data.resetToken) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 5000);
        }
      } else {
        // Show error message
        const errorMsg = data.error || 'Có lỗi xảy ra. Vui lòng thử lại.';
        errorMessage.textContent = errorMsg;
        errorMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      errorMessage.textContent = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
      errorMessage.style.display = 'block';
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
