'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tblTransaction', {
      id: {
        type: Sequelize.STRING(11),
        primaryKey: true,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(19, 0),
        allowNull: false
      },
      payment_method: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      status: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_provider: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      transaction_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      tblBookingId: {
        type: Sequelize.STRING(11),
        allowNull: false,
        references: {
          model: 'tblBooking',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    await queryInterface.addIndex('tblTransaction', ['tblBookingId']);
    await queryInterface.addIndex('tblTransaction', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tblTransaction');
  }
};
