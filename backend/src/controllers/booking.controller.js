const bookingService = require('../services/booking.service');
const ApiResponse = require('../utils/apiResponse');
const { ERROR_CODES, MESSAGES } = require('../constants');
const { CreateBookingDTO, GetBookingDTO } = require('../dtos/booking.dto');

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

  async getMyBookings(req, res) {
    try {
      const bookings = await bookingService.getMyBookings(req.user.id);

      return ApiResponse.success(res, bookings, MESSAGES.SUCCESS.BOOKING_LIST_FETCHED);
    } catch (error) {
      console.error('Get my bookings error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.BOOKING_LIST_FAILED);
    }
  }

  async getCourtBookings(req, res) {
    try {
      const bookings = await bookingService.getCourtBookings(req.user.id);

      return ApiResponse.success(res, bookings, MESSAGES.SUCCESS.BOOKING_LIST_FETCHED);
    } catch (error) {
      console.error('Get court bookings error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.BOOKING_LIST_FAILED);
    }
  }

  async getAllBookings(req, res) {
    try {
      const bookings = await bookingService.getAllBookings();

      return ApiResponse.success(res, bookings, MESSAGES.SUCCESS.BOOKING_LIST_FETCHED);
    } catch (error) {
      console.error('Get all bookings error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.BOOKING_LIST_FAILED);
    }
  }

  async getBookingById(req, res) {
    try {
      const getBookingDTO = new GetBookingDTO(
        req.params.id,
        req.user.id,
        req.user.role
      );
      const booking = await bookingService.getBookingById(getBookingDTO);

      return ApiResponse.success(res, booking, MESSAGES.SUCCESS.BOOKING_FETCHED);
    } catch (error) {
      console.error('Get booking detail error:', error);

      if (error.code === ERROR_CODES.BOOKING_NOT_FOUND) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.BOOKING_NOT_FOUND);
      }
      if (error.code === ERROR_CODES.PERMISSION_DENIED) {
        return ApiResponse.forbidden(res, MESSAGES.ERROR.PERMISSION_DENIED);
      }

      return ApiResponse.error(res, MESSAGES.ERROR.BOOKING_DETAIL_FAILED);
    }
  }
}

module.exports = new BookingController();
