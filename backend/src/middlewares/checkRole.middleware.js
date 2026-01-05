const { MESSAGES } = require('../constants');

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.AUTH_REQUIRED
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: MESSAGES.ERROR.ACCESS_DENIED
      });
    }

    next();
  };
};

module.exports = checkRole;
