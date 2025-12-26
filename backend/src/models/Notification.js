const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.STRING(11),
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isIn: [['booking', 'payment', 'reminder', 'system']]
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'tblNotification',
    timestamps: false
  });

  return Notification;
};
