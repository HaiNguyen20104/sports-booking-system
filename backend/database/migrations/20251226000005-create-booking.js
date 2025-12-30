'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tblBooking', {
      id: {
        type: Sequelize.STRING(11),
        primaryKey: true,
        allowNull: false
      },
      start_datetime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_datetime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL(19, 0),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'pending'
      },
      booking_type: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'single'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
      },
      tblCourtId: {
        type: Sequelize.STRING(11),
        allowNull: false,
        references: {
          model: 'tblCourts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    await queryInterface.addIndex('tblBooking', ['tblUserId']);
    await queryInterface.addIndex('tblBooking', ['tblCourtId']);
    await queryInterface.addIndex('tblBooking', ['status']);
    await queryInterface.addIndex('tblBooking', ['start_datetime']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tblBooking');
  }
};
