'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tblDevice', 'push_endpoint', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('tblDevice', 'push_p256dh', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('tblDevice', 'push_auth', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tblDevice', 'push_endpoint');
    await queryInterface.removeColumn('tblDevice', 'push_p256dh');
    await queryInterface.removeColumn('tblDevice', 'push_auth');
  }
};
