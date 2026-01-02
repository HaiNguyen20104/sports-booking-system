const crypto = require('crypto');

/**
 * Generate unique ID with prefix
 * @param {string} prefix 
 * @param {number} length 
 * @returns {string} Generated ID
 */
const generateId = (prefix = '', length = 10) => {
  // Use more random bytes to ensure uniqueness even when called rapidly
  const randomStr = crypto.randomBytes(8).toString('hex');
  const combined = (prefix + randomStr).substring(0, length);
  return combined.toUpperCase();
};

module.exports = { generateId };
