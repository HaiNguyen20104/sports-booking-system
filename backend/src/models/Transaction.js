const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.STRING(11),
      primaryKey: true,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(19, 0),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isIn: [['cash', 'card', 'bank_transfer', 'e_wallet']]
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'completed', 'failed', 'refunded']]
      }
    },
    payment_provider: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tblBookingId: {
      type: DataTypes.STRING(11),
      allowNull: false,
      field: 'tblBookingId',
      references: {
        model: 'tblBooking',
        key: 'id'
      }
    }
  }, {
    tableName: 'tblTransaction',
    timestamps: false,
    underscored: false
  });

  return Transaction;
};
