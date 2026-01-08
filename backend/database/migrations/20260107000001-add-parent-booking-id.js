'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tblBooking', 'parent_booking_id', {
      type: Sequelize.STRING(11),
      allowNull: true,
      references: {
        model: 'tblBooking',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addIndex('tblBooking', ['parent_booking_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tblBooking', 'parent_booking_id');
  }
};
