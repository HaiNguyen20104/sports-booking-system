const { DataTypes } = require('sequelize');
const { ROLES, COURT_STATUS, ALL_COURT_STATUS } = require('../constants');

module.exports = (sequelize) => {
  const Court = sequelize.define('Court', {
    id: {
      type: DataTypes.STRING(11),
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: COURT_STATUS.ACTIVE,
      validate: {
        isIn: [ALL_COURT_STATUS]
      }
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    slot_duration: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: 60,
      comment: 'Thời lượng mỗi slot (phút)'
    },
    owner_id: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'tblUser',
        key: 'id'
      }
    }
  }, {
    tableName: 'tblCourts',
    timestamps: false
  });

  // Check if user can modify this court
  Court.prototype.canModify = function(userId, userRole) {
    return this.owner_id === userId || userRole === ROLES.ADMIN;
  };

  return Court;
};
