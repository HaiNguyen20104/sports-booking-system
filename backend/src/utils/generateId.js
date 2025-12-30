const crypto = require('crypto');

/**
 * Generate unique ID with prefix
 * @param {string} prefix 
 * @param {number} length 
 * @returns {string} Generated ID
 */
const generateId = (prefix = '', length = 10) => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  const combined = (prefix + timestamp + randomStr).substring(0, length);
  return combined.toUpperCase();
};

module.exports = { generateId };
