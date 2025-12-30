document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('accessToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Check authentication and role
  if (!token) {
    alert('Vui lòng đăng nhập để tiếp tục');
    window.location.href = '/login';
    return;
  }

  if (user.role !== 'manager' && user.role !== 'admin') {
    alert('Bạn không có quyền truy cập trang này. Chỉ chủ sân (manager) mới được thêm sân.');
    window.location.href = '/';
    return;
  }

  const form = document.getElementById('add-court-form');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  const submitBtn = document.getElementById('submit-btn');

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
  }

  function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideMessages();

    const name = document.getElementById('name').value.trim();
    const location = document.getElementById('location').value.trim();
    const description = document.getElementById('description').value.trim();
    const slot_duration = parseInt(document.getElementById('slot_duration').value);
    const status = document.getElementById('status').value;

    if (!name || !location) {
      showError('Vui lòng điền đầy đủ tên sân và địa điểm');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang xử lý...';

    try {
      const response = await fetch('/api/courts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          location,
          description,
          slot_duration,
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(data.data.message || 'Thêm sân thành công! Đang chuyển hướng...');
        form.reset();

        // Redirect to my courts after 1 second
        setTimeout(() => {
          window.location.href = '/my-courts';
        }, 1000);
      } else {
        showError(data.message || 'Không thể thêm sân. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Add court error:', error);
      showError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Thêm Sân';
    }
  });
});
