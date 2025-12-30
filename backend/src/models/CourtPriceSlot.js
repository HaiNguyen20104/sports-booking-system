const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CourtPriceSlot = sequelize.define('CourtPriceSlot', {
    id: {
      type: DataTypes.STRING(11),
      primaryKey: true,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(19, 0),
      allowNull: false
    },
    tblCourtId: {
      type: DataTypes.STRING(11),
      allowNull: false,
      references: {
        model: 'tblCourts',
        key: 'id'
      }
    }
  }, {
    tableName: 'tblCourtPriceSlots',
    timestamps: false
  });

  return CourtPriceSlot;
};
