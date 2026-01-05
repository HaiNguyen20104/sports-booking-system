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
  
  // Price slots elements
  const addSlotBtn = document.getElementById('add-slot-btn');
  const priceSlotsContainer = document.getElementById('price-slots-list');
  
  // Store price slots
  let priceSlots = [];

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

  function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  }

  function formatTime(time) {
    return time.substring(0, 5); // Format HH:MM
  }

  function renderPriceSlots() {
    if (priceSlots.length === 0) {
      priceSlotsContainer.innerHTML = '<p class="empty-slots">Chưa có khung giờ nào. Thêm khung giờ ở trên.</p>';
      return;
    }

    priceSlotsContainer.innerHTML = priceSlots
      .map((slot, index) => `
        <div class="price-slot-item" data-index="${index}">
          <div class="slot-info">
            <span class="slot-time">${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}</span>
            <span class="slot-price">${formatPrice(slot.price)}</span>
          </div>
          <button type="button" class="btn btn-small btn-danger remove-slot-btn" data-index="${index}">Xóa</button>
        </div>
      `)
      .join('');

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-slot-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        priceSlots.splice(index, 1);
        renderPriceSlots();
      });
    });
  }

  // Add price slot
  addSlotBtn.addEventListener('click', function() {
    const startTime = document.getElementById('slot-start').value;
    const endTime = document.getElementById('slot-end').value;
    const price = parseInt(document.getElementById('slot-price').value);

    if (!startTime || !endTime || !price) {
      showError('Vui lòng điền đầy đủ thông tin khung giờ');
      return;
    }

    if (startTime >= endTime) {
      showError('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
      return;
    }

    if (price < 0) {
      showError('Giá phải lớn hơn hoặc bằng 0');
      return;
    }

    // Check for overlapping time slots
    const hasOverlap = priceSlots.some(slot => {
      return (startTime < slot.end_time && endTime > slot.start_time);
    });

    if (hasOverlap) {
      showError('Khung giờ này bị trùng với khung giờ đã có');
      return;
    }

    hideMessages();
    priceSlots.push({
      start_time: startTime,
      end_time: endTime,
      price: price
    });

    // Sort by start time
    priceSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    renderPriceSlots();
    
    // Reset inputs
    document.getElementById('slot-price').value = '';
  });

  // Initialize empty slots display
  renderPriceSlots();

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
          price_slots: priceSlots,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(data.data.message || 'Thêm sân thành công! Đang chuyển hướng...');
        form.reset();
        priceSlots = [];
        renderPriceSlots();

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
