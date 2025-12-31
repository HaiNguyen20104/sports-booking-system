const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { generateId } = require('../utils/generateId');
const config = require('../config');
const AppError = require('../utils/AppError');
const { ERROR_CODES, MESSAGES, ROLES } = require('../constants');

class AuthService {
  async prepareRegistration(userData) {
    const { full_name, email, phone, password, role } = userData;

    // Check if email already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      throw AppError.badRequest(ERROR_CODES.EMAIL_ALREADY_EXISTS, MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = generateId('U', 10);

    // Prepare user data (not saved yet)
    const userPreparedData = {
      id: userId,
      full_name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: role || ROLES.CUSTOMER,
      is_verified: false
    };

    // Generate verification token (for email verification)
    const verificationToken = jwt.sign(
      { userId: userId, email: email },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      userPreparedData,
      verificationToken
    };
  }

  async saveUser(userPreparedData) {
    // Create user in database
    const user = await db.User.create(userPreparedData);

    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_verified: user.is_verified
    };
  }

  async login(email, password) {
    // Find user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw AppError.unauthorized(ERROR_CODES.INVALID_CREDENTIALS, MESSAGES.ERROR.INVALID_CREDENTIALS);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized(ERROR_CODES.INVALID_CREDENTIALS, MESSAGES.ERROR.INVALID_CREDENTIALS);
    }

    // Check if user is verified
    if (!user.is_verified) {
      throw AppError.forbidden(ERROR_CODES.EMAIL_NOT_VERIFIED, MESSAGES.ERROR.EMAIL_NOT_VERIFIED);
    }

    // Generate access token
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      accessToken
    };
  }

  async verifyEmail(token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      
      const user = await db.User.findByPk(decoded.userId);
      if (!user) {
        throw AppError.notFound(ERROR_CODES.USER_NOT_FOUND, MESSAGES.ERROR.USER_NOT_FOUND);
      }

      if (user.is_verified) {
        throw AppError.badRequest(ERROR_CODES.EMAIL_ALREADY_VERIFIED, MESSAGES.ERROR.EMAIL_ALREADY_VERIFIED);
      }

      // Update user verification status
      user.is_verified = true;
      await user.save();

      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw AppError.badRequest(ERROR_CODES.TOKEN_EXPIRED, MESSAGES.ERROR.VERIFICATION_EXPIRED);
      }
      throw error;
    }
  }

  async forgotPassword(email) {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw AppError.notFound(ERROR_CODES.USER_NOT_FOUND, MESSAGES.ERROR.USER_NOT_FOUND);
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'reset-password' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Set token and expiry (1 hour from now)
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    user.reset_password_token = resetToken;
    user.reset_password_expires = resetExpires;
    await user.save();

    return {
      resetToken,
      email: user.email,
      full_name: user.full_name
    };
  }

  async clearResetToken(email) {
    const user = await db.User.findOne({ where: { email } });
    if (user) {
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await user.save();
    }
  }

  async resetPassword(token, newPassword) {
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);
      
      if (decoded.purpose !== 'reset-password') {
        throw AppError.badRequest(ERROR_CODES.INVALID_RESET_TOKEN, MESSAGES.ERROR.INVALID_RESET_TOKEN);
      }

      // Find user by ID and check token
      const user = await db.User.findByPk(decoded.userId);
      if (!user) {
        throw AppError.notFound(ERROR_CODES.USER_NOT_FOUND, MESSAGES.ERROR.USER_NOT_FOUND);
      }

      // Check if token matches and hasn't expired
      if (user.reset_password_token !== token) {
        throw AppError.badRequest(ERROR_CODES.INVALID_RESET_TOKEN, MESSAGES.ERROR.INVALID_RESET_TOKEN);
      }

      if (user.reset_password_expires && new Date() > new Date(user.reset_password_expires)) {
        throw AppError.badRequest(ERROR_CODES.RESET_TOKEN_EXPIRED, MESSAGES.ERROR.RESET_TOKEN_EXPIRED);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await user.save();

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw AppError.badRequest(ERROR_CODES.RESET_TOKEN_EXPIRED, MESSAGES.ERROR.RESET_TOKEN_EXPIRED);
      }
      if (error.name === 'JsonWebTokenError') {
        throw AppError.badRequest(ERROR_CODES.INVALID_RESET_TOKEN, MESSAGES.ERROR.INVALID_RESET_TOKEN);
      }
      throw error;
    }
  }
}

module.exports = new AuthService();
