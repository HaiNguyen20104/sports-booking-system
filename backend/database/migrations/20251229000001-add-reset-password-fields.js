'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tblUser', 'reset_password_token', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'is_verified'
    });

    await queryInterface.addColumn('tblUser', 'reset_password_expires', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'reset_password_token'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tblUser', 'reset_password_token');
    await queryInterface.removeColumn('tblUser', 'reset_password_expires');
  }
};
