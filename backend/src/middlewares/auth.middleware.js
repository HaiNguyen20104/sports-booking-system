const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../models');
const { MESSAGES } = require('../constants');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.TOKEN_REQUIRED
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    
    const user = await db.User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.USER_NOT_FOUND
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.TOKEN_EXPIRED
      });
    }
    
    return res.status(401).json({
      success: false,
      message: MESSAGES.ERROR.TOKEN_INVALID
    });
  }
};

module.exports = authMiddleware;
