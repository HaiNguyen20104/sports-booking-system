const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.STRING(11),
      primaryKey: true,
      allowNull: false
    },
    start_datetime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_datetime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(19, 0),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'confirmed', 'cancelled', 'completed']]
      }
    },
    booking_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'single',
      validate: {
        isIn: [['single', 'recurring']]
      }
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    tblUserId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'tblUser',
        key: 'id'
      }
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
    tableName: 'tblBooking',
    timestamps: false
  });

  return Booking;
};
