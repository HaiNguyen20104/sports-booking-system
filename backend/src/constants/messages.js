const MESSAGES = {
  // Success messages
  SUCCESS: {
    // Auth
    REGISTER: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
    LOGIN: 'Đăng nhập thành công',
    EMAIL_VERIFIED: 'Xác thực email thành công',
    PASSWORD_RESET_EMAIL_SENT: 'Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.',
    PASSWORD_RESET: 'Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập với mật khẩu mới.',
    PROFILE_FETCHED: 'Lấy thông tin hồ sơ thành công',

    // Booking
    BOOKING_CREATED: 'Đặt sân thành công!',
    BOOKING_LIST_FETCHED: 'Lấy danh sách đặt sân thành công',
    BOOKING_FETCHED: 'Lấy thông tin đặt sân thành công',
    BOOKING_CANCELLED: 'Hủy đặt sân thành công',

    // Court
    COURT_CREATED: 'Thêm sân thành công!',
    COURT_UPDATED: 'Cập nhật sân thành công!',
    COURT_DELETED: 'Xóa sân thành công!',
    COURT_LIST_FETCHED: 'Lấy danh sách sân thành công',
    COURT_FETCHED: 'Lấy thông tin sân thành công',
    MY_COURTS_FETCHED: 'Lấy danh sách sân của bạn thành công',

    // Payment
    CHECKOUT_CREATED: 'Tạo phiên thanh toán thành công',
    PAYMENT_STATUS_FETCHED: 'Lấy trạng thái thanh toán thành công',
    PAYMENT_VERIFIED: 'Xác nhận thanh toán thành công',
  },

  // Error messages
  ERROR: {
    // Common
    INTERNAL_ERROR: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
    PERMISSION_DENIED: 'Bạn không có quyền thực hiện hành động này',
    VALIDATION_FAILED: 'Dữ liệu không hợp lệ',
    
    // Auth
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
    EMAIL_NOT_VERIFIED: 'Vui lòng xác thực email trước khi đăng nhập',
    EMAIL_ALREADY_EXISTS: 'Email đã được đăng ký',
    EMAIL_ALREADY_VERIFIED: 'Email đã được xác thực',
    UNAUTHORIZED: 'Vui lòng đăng nhập',
    TOKEN_REQUIRED: 'Access token là bắt buộc',
    TOKEN_EXPIRED: 'Token đã hết hạn',
    TOKEN_INVALID: 'Token không hợp lệ',
    AUTH_REQUIRED: 'Yêu cầu xác thực',
    ACCESS_DENIED: 'Truy cập bị từ chối. Bạn không có quyền.',
    REGISTER_FAILED: 'Đăng ký thất bại',
    LOGIN_FAILED: 'Đăng nhập thất bại',
    VERIFICATION_FAILED: 'Xác thực email thất bại',
    VERIFICATION_EXPIRED: 'Link xác thực đã hết hạn',
    PROFILE_FAILED: 'Không thể lấy thông tin hồ sơ',
    FORGOT_PASSWORD_FAILED: 'Không thể xử lý yêu cầu quên mật khẩu',
    RESET_PASSWORD_FAILED: 'Không thể đặt lại mật khẩu',
    INVALID_RESET_TOKEN: 'Token đặt lại mật khẩu không hợp lệ',
    RESET_TOKEN_EXPIRED: 'Token đặt lại mật khẩu đã hết hạn',

    // Email
    EMAIL_SEND_FAILED: 'Không thể gửi email. Vui lòng thử lại sau.',
    EMAIL_VERIFICATION_SEND_FAILED: 'Không thể gửi email xác thực. Vui lòng thử lại sau.',
    EMAIL_RESET_SEND_FAILED: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.',

    // Court
    COURT_NOT_FOUND: 'Không tìm thấy sân',
    COURT_REQUIRED_FIELDS: 'Tên sân và địa điểm là bắt buộc',
    COURT_CREATE_FAILED: 'Không thể tạo sân. Vui lòng thử lại.',
    COURT_UPDATE_FAILED: 'Không thể cập nhật sân',
    COURT_DELETE_FAILED: 'Không thể xóa sân',
    COURT_LIST_FAILED: 'Không thể lấy danh sách sân',
    COURT_PERMISSION_DENIED: 'Bạn không có quyền chỉnh sửa sân này',
    NO_CHANGES: 'Không có thay đổi nào để cập nhật',

    // User
    USER_NOT_FOUND: 'Không tìm thấy người dùng',

    // Booking
    BOOKING_NOT_FOUND: 'Không tìm thấy đặt sân',
    BOOKING_CONFLICT: 'Khung giờ này đã có người đặt',
    BOOKING_CREATE_FAILED: 'Không thể đặt sân. Vui lòng thử lại.',
    BOOKING_LIST_FAILED: 'Không thể lấy danh sách đặt sân',
    BOOKING_DETAIL_FAILED: 'Không thể lấy thông tin đặt sân',
    BOOKING_CANCEL_FAILED: 'Không thể hủy đặt sân',

    // Payment
    BOOKING_ALREADY_PAID: 'Đặt sân này đã được thanh toán',
    PAYMENT_CREATE_FAILED: 'Không thể tạo phiên thanh toán',
    PAYMENT_STATUS_FAILED: 'Không thể lấy trạng thái thanh toán',
    PAYMENT_NOT_COMPLETED: 'Thanh toán chưa hoàn tất',
    PAYMENT_VERIFY_FAILED: 'Không thể xác nhận thanh toán',
    INVALID_WEBHOOK_SIGNATURE: 'Chữ ký webhook không hợp lệ',
  }
};

module.exports = MESSAGES;
