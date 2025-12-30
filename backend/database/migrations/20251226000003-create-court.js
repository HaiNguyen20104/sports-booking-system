'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tblCourts', {
      id: {
        type: Sequelize.STRING(11),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: 'active'
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      slot_duration: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: 60,
        comment: 'Thời lượng mỗi slot (phút)'
      },
      owner_id: {
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

    await queryInterface.addIndex('tblCourts', ['owner_id']);
    await queryInterface.addIndex('tblCourts', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tblCourts');
  }
};
