const db = require('../models');
const { generateId } = require('../utils/generateId');
const AppError = require('../utils/AppError');
const { ERROR_CODES, MESSAGES } = require('../constants');
const { Op } = require('sequelize');
const { calculateEndDatetime, findPriceForTime, generateRecurringDates } = require('../helpers/booking.helper');

class BookingService {
  async createBooking(createBookingDTO) {
    const { court_id, start_datetime, booking_type, repeat_count, note, user_id } = createBookingDTO;

    // Check court exists and is active
    const court = await this._findActiveCourt(court_id);

    // Get price slots
    const priceSlots = await db.CourtPriceSlot.findAll({
      where: { tblCourtId: court_id }
    });

    if (booking_type === 'recurring') {
      return await this._createRecurringBooking(court, priceSlots, start_datetime, repeat_count, note, user_id);
    }

    return await this._createSingleBooking(court, priceSlots, start_datetime, note, user_id);
  }

  async _createSingleBooking(court, priceSlots, start_datetime, note, user_id) {
    const end_datetime = calculateEndDatetime(start_datetime, court.slot_duration);

    // Check for booking conflicts
    await this._checkBookingConflict(court.id, start_datetime, end_datetime);

    const totalPrice = findPriceForTime(priceSlots, start_datetime);

    const bookingId = generateId('BK', 10);
    const booking = await db.Booking.create({
      id: bookingId,
      start_datetime,
      end_datetime,
      total_price: totalPrice,
      status: 'pending',
      booking_type: 'single',
      note,
      tblUserId: user_id,
      tblCourtId: court.id
    });

    return this._formatBookingResponse(booking, court.name);
  }

  async _createRecurringBooking(court, priceSlots, start_datetime, repeat_count, note, user_id) {
    const recurringDates = generateRecurringDates(start_datetime, repeat_count);

    // Check ALL dates for conflicts first
    for (const date of recurringDates) {
      const end_datetime = calculateEndDatetime(date, court.slot_duration);
      await this._checkBookingConflict(court.id, date, end_datetime);
    }

    const transaction = await db.sequelize.transaction();

    try {
      // Create parent booking (recurring)
      const parentId = generateId('BK', 10);
      const firstEndDatetime = calculateEndDatetime(recurringDates[0], court.slot_duration);
      const pricePerSlot = findPriceForTime(priceSlots, start_datetime);

      const parentBooking = await db.Booking.create({
        id: parentId,
        start_datetime: recurringDates[0],
        end_datetime: firstEndDatetime,
        total_price: pricePerSlot * repeat_count,
        status: 'pending',
        booking_type: 'recurring',
        note,
        tblUserId: user_id,
        tblCourtId: court.id
      }, { transaction });

      // Create child bookings
      const childBookings = [];
      for (const date of recurringDates) {
        const end_datetime = calculateEndDatetime(date, court.slot_duration);
        const childId = generateId('BK', 10);

        const childBooking = await db.Booking.create({
          id: childId,
          start_datetime: date,
          end_datetime,
          total_price: pricePerSlot,
          status: 'pending',
          booking_type: 'single',
          note,
          tblUserId: user_id,
          tblCourtId: court.id,
          parent_booking_id: parentId
        }, { transaction });

        childBookings.push(this._formatBookingResponse(childBooking, court.name));
      }

      await transaction.commit();

      return {
        id: parentBooking.id,
        user_id: parentBooking.tblUserId,
        court_id: parentBooking.tblCourtId,
        court_name: court.name,
        total_price: parentBooking.total_price,
        status: parentBooking.status,
        booking_type: parentBooking.booking_type,
        repeat_count,
        note: parentBooking.note,
        created_at: parentBooking.created_at,
        child_bookings: childBookings
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  _formatBookingResponse(booking, courtName) {
    return {
      id: booking.id,
      user_id: booking.tblUserId,
      court_id: booking.tblCourtId,
      court_name: courtName,
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
