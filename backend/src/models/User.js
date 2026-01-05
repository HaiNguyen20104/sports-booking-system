const { DataTypes } = require('sequelize');
const { ROLES, ALL_ROLES } = require('../constants');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ROLES.CUSTOMER,
      validate: {
        isIn: [ALL_ROLES]
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    reset_password_token: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tblUser',
    timestamps: false
  });

  return User;
};
