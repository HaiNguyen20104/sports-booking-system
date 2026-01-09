class CreateCheckoutDTO {
  constructor(bookingId, userId) {
    this.booking_id = bookingId;
    this.user_id = userId;
  }
}

module.exports = {
  CreateCheckoutDTO
};
