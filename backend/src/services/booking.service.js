const db = require('../models');
const { generateId } = require('../utils/generateId');
const AppError = require('../utils/AppError');
const { ERROR_CODES, MESSAGES } = require('../constants');
const { Op } = require('sequelize');
const { calculateEndDatetime, findPriceForTime } = require('../helpers/booking.helper');

class BookingService {
  async createBooking(createBookingDTO) {
    const { court_id, start_datetime, booking_type, note, user_id } = createBookingDTO;

    // Check court exists and is active
    const court = await this._findActiveCourt(court_id);

    // Calculate end_datetime based on slot_duration
    const end_datetime = calculateEndDatetime(start_datetime, court.slot_duration);

    // Check for booking conflicts
    await this._checkBookingConflict(court_id, start_datetime, end_datetime);

    // Find price for this time slot
    const priceSlots = await db.CourtPriceSlot.findAll({
      where: { tblCourtId: court_id }
    });
    const totalPrice = findPriceForTime(priceSlots, start_datetime);

    // Create booking
    const bookingId = generateId('BK', 10);
    const booking = await db.Booking.create({
      id: bookingId,
      start_datetime,
      end_datetime,
      total_price: totalPrice,
      status: 'pending',
      booking_type,
      note,
      tblUserId: user_id,
      tblCourtId: court_id
    });

    return {
      id: booking.id,
      court_id: booking.tblCourtId,
      court_name: court.name,
      start_datetime: booking.start_datetime,
      end_datetime: booking.end_datetime,
      total_price: booking.total_price,
      status: booking.status,
      booking_type: booking.booking_type,
      note: booking.note,
      created_at: booking.created_at
    };
  }

  async _findActiveCourt(courtId) {
    const court = await db.Court.findOne({
      where: {
        id: courtId,
        is_deleted: false,
        status: 'active'
      }
    });

    if (!court) {
      throw AppError.notFound(ERROR_CODES.COURT_NOT_FOUND, MESSAGES.ERROR.COURT_NOT_FOUND);
    }

    return court;
  }

  async _checkBookingConflict(courtId, startDatetime, endDatetime) {
    const conflictBooking = await db.Booking.findOne({
      where: {
        tblCourtId: courtId,
        status: { [Op.in]: ['pending', 'confirmed'] },
        [Op.or]: [
          {
            start_datetime: { [Op.lt]: endDatetime },
            end_datetime: { [Op.gt]: startDatetime }
          }
        ]
      }
    });

    if (conflictBooking) {
      throw AppError.conflict(ERROR_CODES.BOOKING_CONFLICT, MESSAGES.ERROR.BOOKING_CONFLICT);
    }
  }
}

module.exports = new BookingService();
