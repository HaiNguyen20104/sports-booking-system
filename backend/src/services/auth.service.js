const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { generateId } = require('../utils/generateId');
const config = require('../config');

class AuthService {
  async register(userData) {
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

    // Create user
    const user = await db.User.create({
      id: userId,
      full_name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: role || 'customer',
      is_verified: false
    });

    // Generate verification token (for email verification)
    const verificationToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified
      },
      verificationToken
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
}

module.exports = new AuthService();
