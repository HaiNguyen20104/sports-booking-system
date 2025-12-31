class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true; // Để phân biệt với lỗi hệ thống

    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods để tạo error nhanh
  static badRequest(code, message) {
    return new AppError(code, message, 400);
  }

  static notFound(code, message) {
    return new AppError(code, message, 404);
  }

  static unauthorized(code, message) {
    return new AppError(code, message, 401);
  }

  static forbidden(code, message) {
    return new AppError(code, message, 403);
  }
}

module.exports = AppError;
