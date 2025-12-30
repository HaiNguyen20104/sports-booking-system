'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tblUser', {
      id: {
        type: Sequelize.STRING(10),
        primaryKey: true,
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      role: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'customer'
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('tblUser', ['email']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tblUser');
  }
};
