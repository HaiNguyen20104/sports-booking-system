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
  
  // Detail modal elements
  const detailModal = document.getElementById('court-detail-modal');
  const detailContent = document.getElementById('court-detail-content');
  
  // Edit modal elements
  const editModal = document.getElementById('edit-court-modal');
  const editForm = document.getElementById('edit-court-form');
  const editErrorMessage = document.getElementById('edit-error-message');
  const editSubmitBtn = document.getElementById('edit-submit-btn');
  const editAddSlotBtn = document.getElementById('edit-add-slot-btn');
  const editPriceSlotsContainer = document.getElementById('edit-price-slots-list');

  // Store edit price slots
  let editPriceSlots = [];

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

  function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  function formatTime(time) {
    if (!time) return '';
    // Handle HH:MM:SS or HH:MM format
    return time.substring(0, 5);
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

  function renderPriceSlotsList(priceSlots) {
    if (!priceSlots || priceSlots.length === 0) {
      return '<p class="empty-slots">Chưa có khung giờ nào</p>';
    }

    return priceSlots
      .map(slot => `
        <div class="price-slot-item">
          <div class="slot-info">
            <span class="slot-time">${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}</span>
            <span class="slot-price">${formatPrice(slot.price)}</span>
          </div>
        </div>
      `)
      .join('');
  }

  function renderEditPriceSlots() {
    if (editPriceSlots.length === 0) {
      editPriceSlotsContainer.innerHTML = '<p class="empty-slots">Chưa có khung giờ nào. Thêm khung giờ ở trên.</p>';
      return;
    }

    editPriceSlotsContainer.innerHTML = editPriceSlots
      .map((slot, index) => `
        <div class="price-slot-item" data-index="${index}">
          <div class="slot-info">
            <span class="slot-time">${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}</span>
            <span class="slot-price">${formatPrice(slot.price)}</span>
          </div>
          <button type="button" class="btn btn-small btn-danger edit-remove-slot-btn" data-index="${index}">Xóa</button>
        </div>
      `)
      .join('');

    // Add event listeners to remove buttons
    document.querySelectorAll('.edit-remove-slot-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        editPriceSlots.splice(index, 1);
        renderEditPriceSlots();
      });
    });
  }

  // Add price slot in edit modal
  editAddSlotBtn.addEventListener('click', function() {
    const startTime = document.getElementById('edit-slot-start').value;
    const endTime = document.getElementById('edit-slot-end').value;
    const price = parseInt(document.getElementById('edit-slot-price').value);

    if (!startTime || !endTime || !price) {
      showEditError('Vui lòng điền đầy đủ thông tin khung giờ');
      return;
    }

    if (startTime >= endTime) {
      showEditError('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
      return;
    }

    if (price < 0) {
      showEditError('Giá phải lớn hơn hoặc bằng 0');
      return;
    }

    // Check for overlapping time slots
    const hasOverlap = editPriceSlots.some(slot => {
      const slotStart = formatTime(slot.start_time);
      const slotEnd = formatTime(slot.end_time);
      return (startTime < slotEnd && endTime > slotStart);
    });

    if (hasOverlap) {
      showEditError('Khung giờ này bị trùng với khung giờ đã có');
      return;
    }

    hideEditError();
    editPriceSlots.push({
      start_time: startTime,
      end_time: endTime,
      price: price
    });

    // Sort by start time
    editPriceSlots.sort((a, b) => formatTime(a.start_time).localeCompare(formatTime(b.start_time)));
    
    renderEditPriceSlots();
    
    // Reset inputs
    document.getElementById('edit-slot-price').value = '';
  });

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
        <div class="court-info" onclick="viewCourtDetail('${court.id}')" style="cursor: pointer;">
          <h3 class="court-name">${court.name}</h3>
          <p class="court-location">${court.location}</p>
          ${court.description ? `<p class="court-description">${court.description}</p>` : ''}
          <div class="court-meta">
            <span>${court.slot_duration} phút/slot</span>
            ${getStatusBadge(court.status)}
            ${court.priceSlots && court.priceSlots.length > 0 ? `<span class="price-slots-count">${court.priceSlots.length} khung giờ</span>` : ''}
          </div>
        </div>
        <div class="court-actions">
          <button class="btn btn-small btn-info" onclick="viewCourtDetail('${court.id}')">Chi tiết</button>
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

  // View court detail
  window.viewCourtDetail = async function (courtId) {
    detailModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    detailContent.innerHTML = '<div class="loading-spinner">Đang tải thông tin sân...</div>';

    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const court = data.data;
        detailContent.innerHTML = `
          <div class="detail-section">
            <h4 class="detail-section-title">Thông tin cơ bản</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Tên sân:</span>
                <span class="detail-value">${court.name}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Địa điểm:</span>
                <span class="detail-value">${court.location}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Mô tả:</span>
                <span class="detail-value">${court.description || 'Không có mô tả'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Thời lượng slot:</span>
                <span class="detail-value">${court.slot_duration} phút</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Trạng thái:</span>
                <span class="detail-value">${getStatusBadge(court.status)}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">Bảng giá theo khung giờ</h4>
            <div class="price-slots-detail">
              ${renderPriceSlotsList(court.priceSlots)}
            </div>
          </div>
        `;
      } else {
        detailContent.innerHTML = `<p class="error-text">${data.message || 'Không thể tải thông tin sân'}</p>`;
      }
    } catch (error) {
      console.error('Load court detail error:', error);
      detailContent.innerHTML = '<p class="error-text">Đã xảy ra lỗi khi tải thông tin sân</p>';
    }
  };

  // Close detail modal
  window.closeDetailModal = function () {
    detailModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  // Close detail modal when clicking overlay
  detailModal.querySelector('.modal-overlay').addEventListener('click', closeDetailModal);

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
        
        // Load price slots
        editPriceSlots = (court.priceSlots || []).map(slot => ({
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: parseFloat(slot.price)
        }));
        renderEditPriceSlots();
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
    editPriceSlots = [];
    renderEditPriceSlots();
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
      // Format price slots for API
      const formattedPriceSlots = editPriceSlots.map(slot => ({
        start_time: formatTime(slot.start_time),
        end_time: formatTime(slot.end_time),
        price: slot.price
      }));

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
          price_slots: formattedPriceSlots,
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
    if (e.key === 'Escape') {
      if (editModal.style.display === 'flex') {
        closeEditModal();
      }
      if (detailModal.style.display === 'flex') {
        closeDetailModal();
      }
    }
  });

  // Load courts on page load
  loadCourts();
});
