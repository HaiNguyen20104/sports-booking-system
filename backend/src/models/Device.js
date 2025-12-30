const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Device = sequelize.define('Device', {
    id: {
      type: DataTypes.STRING(11),
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    token_device: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    platform: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_active: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tblUserId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'tblUser',
        key: 'id'
      }
    }
  }, {
    tableName: 'tblDevice',
    timestamps: false
  });

  return Device;
};
