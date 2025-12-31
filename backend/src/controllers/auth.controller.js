const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const ApiResponse = require('../utils/apiResponse');
const { ERROR_CODES, MESSAGES } = require('../constants');

class AuthController {
  async register(req, res) {
    try {
      const { full_name, email, phone, password, role } = req.body;

      const result = await authService.prepareRegistration({
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
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // If email fails, don't create user - return error
        return ApiResponse.error(
          res,
          MESSAGES.ERROR.EMAIL_VERIFICATION_SEND_FAILED,
          500
        );
      }

      // Only save user to DB if email was sent successfully
      const user = await authService.saveUser(result.userPreparedData);
        
      return ApiResponse.success(
        res,
        {
          user: user,
          message: MESSAGES.SUCCESS.REGISTER
        },
        'User registered successfully',
        201
      );
    } catch (error) {
      if (error.code === ERROR_CODES.EMAIL_ALREADY_EXISTS) {
        return ApiResponse.badRequest(res, MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
      }
      console.error('Register error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.REGISTER_FAILED);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return ApiResponse.success(
        res,
        result,
        MESSAGES.SUCCESS.LOGIN
      );
    } catch (error) {
      if (error.code === ERROR_CODES.INVALID_CREDENTIALS) {
        return ApiResponse.unauthorized(res, MESSAGES.ERROR.INVALID_CREDENTIALS);
      }
      if (error.code === ERROR_CODES.EMAIL_NOT_VERIFIED) {
        return ApiResponse.forbidden(res, MESSAGES.ERROR.EMAIL_NOT_VERIFIED);
      }
      console.error('Login error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.LOGIN_FAILED);
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
        MESSAGES.SUCCESS.EMAIL_VERIFIED
      );
    } catch (error) {
      if (error.code === ERROR_CODES.USER_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.USER_NOT_FOUND);
      }
      if (error.code === ERROR_CODES.EMAIL_ALREADY_VERIFIED) {
        return ApiResponse.badRequest(res, MESSAGES.ERROR.EMAIL_ALREADY_VERIFIED);
      }
      if (error.code === ERROR_CODES.TOKEN_EXPIRED) {
        return ApiResponse.badRequest(res, MESSAGES.ERROR.VERIFICATION_EXPIRED);
      }
      console.error('Verify email error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.VERIFICATION_FAILED);
    }
  }

  async getProfile(req, res) {
    try {
      // req.user is set by auth middleware
      return ApiResponse.success(res, req.user, MESSAGES.SUCCESS.PROFILE_FETCHED);
    } catch (error) {
      console.error('Get profile error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.PROFILE_FAILED);
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
            message: MESSAGES.SUCCESS.PASSWORD_RESET_EMAIL_SENT
          },
          'Password reset email sent successfully'
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // If email fails, clear the reset token and return error
        await authService.clearResetToken(result.email);
        return ApiResponse.error(
          res,
          MESSAGES.ERROR.EMAIL_RESET_SEND_FAILED,
          500
        );
      }
    } catch (error) {
      if (error.code === ERROR_CODES.USER_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.USER_NOT_FOUND);
      }
      console.error('Forgot password error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.FORGOT_PASSWORD_FAILED);
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
          message: MESSAGES.SUCCESS.PASSWORD_RESET
        },
        'Password reset successfully'
      );
    } catch (error) {
      if (error.code === ERROR_CODES.USER_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.USER_NOT_FOUND);
      }
      if (error.code === ERROR_CODES.INVALID_RESET_TOKEN || error.code === ERROR_CODES.RESET_TOKEN_EXPIRED) {
        return ApiResponse.badRequest(res, error.message);
      }
      console.error('Reset password error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.RESET_PASSWORD_FAILED);
    }
  }
}

module.exports = new AuthController();
