class CreateBookingDTO {
  constructor({ court_id, start_datetime, booking_type, note }, userId) {
    this.court_id = court_id;
    this.start_datetime = new Date(start_datetime);
    this.booking_type = booking_type || 'single';
    this.note = note || null;
    this.user_id = userId;
  }
}

module.exports = {
  CreateBookingDTO
};
