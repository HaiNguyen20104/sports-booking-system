'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate ID with prefix (same logic as generateId util)
const generateId = (prefix = '', length = 10) => {
  const randomStr = crypto.randomBytes(8).toString('hex');
  const combined = (prefix + randomStr).substring(0, length);
  return combined.toUpperCase();
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    await queryInterface.bulkInsert('tblUser', [
      {
        id: generateId('U'),
        email: 'admin@sportbooking.com',
        password: hashedPassword,
        full_name: 'System Administrator',
        phone: '0900000000',
        role: 'admin',
        is_verified: true,
        created_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tblUser', {
      email: 'admin@sportbooking.com'
    }, {});
  }
};
