const bookingService = require('../services/booking.service');
const ApiResponse = require('../utils/apiResponse');
const { ERROR_CODES, MESSAGES } = require('../constants');
const { CreateBookingDTO } = require('../dtos/booking.dto');

class BookingController {
  async createBooking(req, res) {
    try {
      const createBookingDTO = new CreateBookingDTO(req.body, req.user.id);
      const booking = await bookingService.createBooking(createBookingDTO);

      return ApiResponse.success(
        res,
        { booking },
        MESSAGES.SUCCESS.BOOKING_CREATED,
        201
      );
    } catch (error) {
      console.error('Create booking error:', error);
      
      if (error.code === ERROR_CODES.COURT_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.COURT_NOT_FOUND);
      }
      if (error.code === ERROR_CODES.BOOKING_CONFLICT) {
        return ApiResponse.conflict(res, MESSAGES.ERROR.BOOKING_CONFLICT);
      }
      
      return ApiResponse.error(res, MESSAGES.ERROR.BOOKING_CREATE_FAILED);
    }
  }
}

module.exports = new BookingController();
