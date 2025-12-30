const { DataTypes } = require('sequelize');

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
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'maintenance']]
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

  return Court;
};
