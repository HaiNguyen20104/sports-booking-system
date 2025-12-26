'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tblDevice', {
      id: {
        type: Sequelize.STRING(11),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      token_device: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      platform: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      last_active: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      tblUserId: {
        type: Sequelize.STRING(10),
        allowNull: false,
        references: {
          model: 'tblUser',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    await queryInterface.addIndex('tblDevice', ['tblUserId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tblDevice');
  }
};
