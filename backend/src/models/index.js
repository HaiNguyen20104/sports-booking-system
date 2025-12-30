const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define
  }
);

const db = {};

// Import models
db.User = require('./User')(sequelize);
db.Device = require('./Device')(sequelize);
db.Court = require('./Court')(sequelize);
db.CourtPriceSlot = require('./CourtPriceSlot')(sequelize);
db.Booking = require('./Booking')(sequelize);
db.Transaction = require('./Transaction')(sequelize);
db.Notification = require('./Notification')(sequelize);

// Define relationships
// User relationships
db.User.hasMany(db.Device, { foreignKey: 'tblUserId', as: 'devices' });
db.User.hasMany(db.Court, { foreignKey: 'owner_id', as: 'courts' });
db.User.hasMany(db.Booking, { foreignKey: 'tblUserId', as: 'bookings' });
db.User.hasMany(db.Notification, { foreignKey: 'tblUserId', as: 'notifications' });

// Device relationships
db.Device.belongsTo(db.User, { foreignKey: 'tblUserId', as: 'user' });

// Court relationships
db.Court.belongsTo(db.User, { foreignKey: 'owner_id', as: 'owner' });
db.Court.hasMany(db.CourtPriceSlot, { foreignKey: 'tblCourtId', as: 'priceSlots' });
db.Court.hasMany(db.Booking, { foreignKey: 'tblCourtId', as: 'bookings' });

// CourtPriceSlot relationships
db.CourtPriceSlot.belongsTo(db.Court, { foreignKey: 'tblCourtId', as: 'court' });

// Booking relationships
db.Booking.belongsTo(db.User, { foreignKey: 'tblUserId', as: 'user' });
db.Booking.belongsTo(db.Court, { foreignKey: 'tblCourtId', as: 'court' });
db.Booking.hasOne(db.Transaction, { foreignKey: 'tblBookingId', as: 'transaction' });

// Transaction relationships
db.Transaction.belongsTo(db.Booking, { foreignKey: 'tblBookingId', as: 'booking' });

// Notification relationships
db.Notification.belongsTo(db.User, { foreignKey: 'tblUserId', as: 'user' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = db;
