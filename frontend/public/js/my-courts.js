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
    alert('Bạn không có quyền truy cập trang này. Chỉ chủ sân (manager) mới được xem.');
    window.location.href = '/';
    return;
  }

  const courtsList = document.getElementById('courts-list');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  
  // Edit modal elements
  const editModal = document.getElementById('edit-court-modal');
  const editForm = document.getElementById('edit-court-form');
  const editErrorMessage = document.getElementById('edit-error-message');
  const editSubmitBtn = document.getElementById('edit-submit-btn');

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

  function showEditError(message) {
    editErrorMessage.textContent = message;
    editErrorMessage.style.display = 'block';
  }

  function hideEditError() {
    editErrorMessage.style.display = 'none';
  }

  function getStatusBadge(status) {
    const statusMap = {
      active: { text: 'Hoạt động', class: 'badge-active' },
      inactive: { text: 'Tạm ngưng', class: 'badge-inactive' },
      maintenance: { text: 'Bảo trì', class: 'badge-maintenance' },
    };
    const statusInfo = statusMap[status] || { text: status, class: '' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
  }

  function renderCourts(courts) {
    if (courts.length === 0) {
      courtsList.innerHTML = `
        <div class="empty-state">
          <p>Bạn chưa có sân nào.</p>
          <a href="/add-court" class="btn btn-primary">Thêm sân đầu tiên</a>
        </div>
      `;
      return;
    }

    courtsList.innerHTML = courts
      .map(
        (court) => `
      <div class="court-item" data-id="${court.id}">
        <div class="court-info">
          <h3 class="court-name">${court.name}</h3>
          <p class="court-location">${court.location}</p>
          ${court.description ? `<p class="court-description">${court.description}</p>` : ''}
          <div class="court-meta">
            <span>${court.slot_duration} phút/slot</span>
            ${getStatusBadge(court.status)}
          </div>
        </div>
        <div class="court-actions">
          <button class="btn btn-small btn-secondary" onclick="editCourt('${court.id}')">Sửa</button>
          <button class="btn btn-small btn-danger" onclick="deleteCourt('${court.id}')">Xóa</button>
        </div>
      </div>
    `
      )
      .join('');
  }

  async function loadCourts() {
    try {
      const response = await fetch('/api/courts/my-courts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        renderCourts(data.data);
      } else {
        showError(data.message || 'Không thể tải danh sách sân');
      }
    } catch (error) {
      console.error('Load courts error:', error);
      showError('Đã xảy ra lỗi khi tải danh sách sân');
    }
  }

  // Delete court function
  window.deleteCourt = async function (courtId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sân này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Xóa sân thành công!');
        loadCourts(); // Reload list
      } else {
        showError(data.message || 'Không thể xóa sân');
      }
    } catch (error) {
      console.error('Delete court error:', error);
      showError('Đã xảy ra lỗi khi xóa sân');
    }
  };

  // Edit court function - open modal and load court data
  window.editCourt = async function (courtId) {
    hideEditError();
    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const court = data.data;
        document.getElementById('edit-court-id').value = court.id;
        document.getElementById('edit-name').value = court.name;
        document.getElementById('edit-location').value = court.location;
        document.getElementById('edit-description').value = court.description || '';
        document.getElementById('edit-slot_duration').value = court.slot_duration;
        document.getElementById('edit-status').value = court.status;
      } else {
        showEditError(data.message || 'Không thể tải thông tin sân');
      }
    } catch (error) {
      console.error('Load court error:', error);
      showEditError('Đã xảy ra lỗi khi tải thông tin sân');
    }
  };

  // Close edit modal
  window.closeEditModal = function () {
    editModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    editForm.reset();
    hideEditError();
  };

  // Close modal when clicking overlay
  editModal.querySelector('.modal-overlay').addEventListener('click', closeEditModal);

  // Handle edit form submit
  editForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideEditError();

    const courtId = document.getElementById('edit-court-id').value;
    const name = document.getElementById('edit-name').value.trim();
    const location = document.getElementById('edit-location').value.trim();
    const description = document.getElementById('edit-description').value.trim();
    const slot_duration = parseInt(document.getElementById('edit-slot_duration').value);
    const status = document.getElementById('edit-status').value;

    if (!name || !location) {
      showEditError('Vui lòng điền đầy đủ tên sân và địa điểm');
      return;
    }

    editSubmitBtn.disabled = true;
    editSubmitBtn.textContent = 'Đang lưu...';

    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'PUT',
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
        closeEditModal();
        showSuccess('Cập nhật sân thành công!');
        loadCourts(); // Reload list
      } else {
        showEditError(data.message || 'Không thể cập nhật sân');
      }
    } catch (error) {
      console.error('Update court error:', error);
      showEditError('Đã xảy ra lỗi khi cập nhật sân');
    } finally {
      editSubmitBtn.disabled = false;
      editSubmitBtn.textContent = 'Lưu thay đổi';
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && editModal.style.display === 'flex') {
      closeEditModal();
    }
  });

  // Load courts on page load
  loadCourts();
});
