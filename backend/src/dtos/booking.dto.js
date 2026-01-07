class CreateBookingDTO {
  constructor({ court_id, start_datetime, booking_type, repeat_count, note }, userId) {
    this.court_id = court_id;
    this.start_datetime = new Date(start_datetime);
    this.booking_type = booking_type || 'single';
    this.repeat_count = booking_type === 'recurring' ? (repeat_count || 4) : 1;
    this.note = note || null;
    this.user_id = userId;
  }
}

module.exports = {
  CreateBookingDTO
};
