const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  async register(req, res) {
    try {
      const { full_name, email, phone, password, role } = req.body;

      const result = await authService.register({
        full_name,
        email,
        phone,
        password,
        role
      });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          email,
          full_name,
          result.verificationToken
        );
        
        return ApiResponse.success(
          res,
          {
            user: result.user,
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.'
          },
          'User registered successfully',
          201
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Still return success but with token in response as fallback
        return ApiResponse.success(
          res,
          {
            user: result.user,
            message: 'Đăng ký thành công! Không thể gửi email xác thực. Vui lòng sử dụng token bên dưới.',
            verificationToken: result.verificationToken
          },
          'User registered successfully',
          201
        );
      }
    } catch (error) {
      if (error.message === 'Email already registered') {
        return ApiResponse.badRequest(res, error.message);
      }
      console.error('Register error:', error);
      return ApiResponse.error(res, 'Registration failed');
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return ApiResponse.success(
        res,
        result,
        'Login successful'
      );
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        return ApiResponse.unauthorized(res, error.message);
      }
      if (error.message === 'Please verify your email before logging in') {
        return ApiResponse.forbidden(res, error.message);
      }
      console.error('Login error:', error);
      return ApiResponse.error(res, 'Login failed');
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const user = await authService.verifyEmail(token);

      return ApiResponse.success(
        res,
        {
          id: user.id,
          email: user.email,
          is_verified: user.is_verified
        },
        'Email verified successfully'
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === 'Email already verified') {
        return ApiResponse.badRequest(res, error.message);
      }
      if (error.message === 'Verification link has expired') {
        return ApiResponse.badRequest(res, error.message);
      }
      console.error('Verify email error:', error);
      return ApiResponse.error(res, 'Email verification failed');
    }
  }

  async getProfile(req, res) {
    try {
      // req.user is set by auth middleware
      return ApiResponse.success(res, req.user, 'Profile retrieved successfully');
    } catch (error) {
      console.error('Get profile error:', error);
      return ApiResponse.error(res, 'Failed to get profile');
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(
          result.email,
          result.full_name,
          result.resetToken
        );

        return ApiResponse.success(
          res,
          {
            message: 'Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.'
          },
          'Password reset email sent successfully'
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Still return success but with token in response as fallback
        return ApiResponse.success(
          res,
          {
            message: 'Không thể gửi email. Vui lòng sử dụng token bên dưới để đặt lại mật khẩu.',
            resetToken: result.resetToken
          },
          'Password reset token generated'
        );
      }
    } catch (error) {
      if (error.message === 'No user found with this email') {
        return ApiResponse.notFound(res, error.message);
      }
      console.error('Forgot password error:', error);
      return ApiResponse.error(res, 'Failed to process forgot password request');
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      const user = await authService.resetPassword(token, password);

      return ApiResponse.success(
        res,
        {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          message: 'Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập với mật khẩu mới.'
        },
        'Password reset successfully'
      );
    } catch (error) {
      if (error.message === 'User not found') {
        return ApiResponse.notFound(res, error.message);
      }
      if (
        error.message === 'Invalid or expired reset token' ||
        error.message === 'Reset token has expired' ||
        error.message === 'Invalid reset token' ||
        error.message === 'Invalid token purpose'
      ) {
        return ApiResponse.badRequest(res, error.message);
      }
      console.error('Reset password error:', error);
      return ApiResponse.error(res, 'Failed to reset password');
    }
  }
}

module.exports = new AuthController();
