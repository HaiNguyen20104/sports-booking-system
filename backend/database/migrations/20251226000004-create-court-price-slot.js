'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tblCourtPriceSlots', {
      id: {
        type: Sequelize.STRING(11),
        primaryKey: true,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(19, 0),
        allowNull: false
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

    await queryInterface.addIndex('tblCourtPriceSlots', ['tblCourtId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tblCourtPriceSlots');
  }
};
