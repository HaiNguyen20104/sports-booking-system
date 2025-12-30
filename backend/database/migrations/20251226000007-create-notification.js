'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tblNotification', {
      id: {
        type: Sequelize.STRING(11),
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex('tblNotification', ['tblUserId']);
    await queryInterface.addIndex('tblNotification', ['is_read']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tblNotification');
  }
};
