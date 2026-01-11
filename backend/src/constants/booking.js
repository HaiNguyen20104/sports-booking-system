const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

const ALL_BOOKING_STATUS = Object.values(BOOKING_STATUS);

module.exports = {
  BOOKING_STATUS,
  ALL_BOOKING_STATUS
};
