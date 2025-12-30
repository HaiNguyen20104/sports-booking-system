const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { generateId } = require('../utils/generateId');
const config = require('../config');

class AuthService {
  async prepareRegistration(userData) {
    const { full_name, email, phone, password, role } = userData;

    // Check if email already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
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
      role: role || 'customer',
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
      throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if user is verified
    if (!user.is_verified) {
      throw new Error('Please verify your email before logging in');
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
        throw new Error('User not found');
      }

      if (user.is_verified) {
        throw new Error('Email already verified');
      }

      // Update user verification status
      user.is_verified = true;
      await user.save();

      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Verification link has expired');
      }
      throw error;
    }
  }

  async forgotPassword(email) {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      throw new Error('No user found with this email');
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
        throw new Error('Invalid token purpose');
      }

      // Find user by ID and check token
      const user = await db.User.findByPk(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if token matches and hasn't expired
      if (user.reset_password_token !== token) {
        throw new Error('Invalid or expired reset token');
      }

      if (user.reset_password_expires && new Date() > new Date(user.reset_password_expires)) {
        throw new Error('Reset token has expired');
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
        throw new Error('Reset token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid reset token');
      }
      throw error;
    }
  }
}

module.exports = new AuthService();
