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
    const totalPrice = findPriceForTime(priceSlots, start_datetime);

    const transaction = await db.sequelize.transaction();

    try {
      // Check conflict with FOR UPDATE lock to prevent race condition
      await this._checkBookingConflict(court.id, start_datetime, end_datetime, transaction);

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
      }, { transaction });

      await transaction.commit();

      return this._formatBookingResponse(booking, court.name);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async _createRecurringBooking(court, priceSlots, start_datetime, repeat_count, note, user_id) {
    const recurringDates = generateRecurringDates(start_datetime, repeat_count);
    const pricePerSlot = findPriceForTime(priceSlots, start_datetime);

    // Build time ranges for all recurring dates
    const timeRanges = recurringDates.map(date => ({
      start: date,
      end: calculateEndDatetime(date, court.slot_duration)
    }));

    const transaction = await db.sequelize.transaction();

    try {
      // Check ALL dates for conflicts with FOR UPDATE lock
      await this._checkMultipleBookingConflicts(court.id, timeRanges, transaction);

      // Create parent booking (recurring)
      const parentId = generateId('BK', 10);

      const parentBooking = await db.Booking.create({
        id: parentId,
        start_datetime: timeRanges[0].start,
        end_datetime: timeRanges[0].end,
        total_price: pricePerSlot * repeat_count,
        status: 'pending',
        booking_type: 'recurring',
        note,
        tblUserId: user_id,
        tblCourtId: court.id
      }, { transaction });

      // Prepare child bookings data for bulkCreate
      const childBookingsData = timeRanges.map(range => ({
        id: generateId('BK', 10),
        start_datetime: range.start,
        end_datetime: range.end,
        total_price: pricePerSlot,
        status: 'pending',
        booking_type: 'single',
        note,
        tblUserId: user_id,
        tblCourtId: court.id,
        parent_booking_id: parentId
      }));

      const childBookings = await db.Booking.bulkCreate(childBookingsData, { transaction });

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
        child_bookings: childBookings.map(b => this._formatBookingResponse(b, court.name))
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

  async _checkBookingConflict(courtId, startDatetime, endDatetime, transaction = null) {
    const conflictBooking = await db.Booking.findOne({
      include: [{
        model: db.Court,
        as: 'court',
        where: {
          id: courtId,
          is_deleted: false,
          status: 'active'
        },
        attributes: []
      }],
      where: {
        status: { [Op.in]: ['pending', 'confirmed'] },
        start_datetime: { [Op.lt]: endDatetime },
        end_datetime: { [Op.gt]: startDatetime }
      },
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
      transaction
    });

    if (conflictBooking) {
      throw AppError.conflict(ERROR_CODES.BOOKING_CONFLICT, MESSAGES.ERROR.BOOKING_CONFLICT);
    }
  }

  async _checkMultipleBookingConflicts(courtId, timeRanges, transaction = null) {
    // Build OR conditions for all time ranges
    const timeConditions = timeRanges.map(range => ({
      start_datetime: { [Op.lt]: range.end },
      end_datetime: { [Op.gt]: range.start }
    }));

    const conflictBooking = await db.Booking.findOne({
      include: [{
        model: db.Court,
        as: 'court',
        where: {
          id: courtId,
          is_deleted: false,
          status: 'active'
        },
        attributes: []
      }],
      where: {
        status: { [Op.in]: ['pending', 'confirmed'] },
        [Op.or]: timeConditions
      },
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
      transaction
    });

    if (conflictBooking) {
      throw AppError.conflict(ERROR_CODES.BOOKING_CONFLICT, MESSAGES.ERROR.BOOKING_CONFLICT);
    }
  }

  async getMyBookings(userId) {
    const bookings = await db.Booking.findAll({
      where: {
        tblUserId: userId,
        parent_booking_id: null
      },
      include: [{
        model: db.Court,
        as: 'court',
        attributes: ['id', 'name', 'location']
      }],
      order: [['created_at', 'DESC']]
    });

    return bookings.map(booking => ({
      id: booking.id,
      court: booking.court,
      start_datetime: booking.start_datetime,
      end_datetime: booking.end_datetime,
      total_price: booking.total_price,
      status: booking.status,
      booking_type: booking.booking_type,
      note: booking.note,
      created_at: booking.created_at
    }));
  }

  async getCourtBookings(ownerId) {
    const bookings = await db.Booking.findAll({
      where: {
        parent_booking_id: null
      },
      include: [{
        model: db.Court,
        as: 'court',
        where: { owner_id: ownerId },
        attributes: ['id', 'name', 'location']
      }, {
        model: db.User,
        as: 'user',
        attributes: ['id', 'full_name', 'phone']
      }],
      order: [['created_at', 'DESC']]
    });

    return bookings.map(booking => ({
      id: booking.id,
      court: booking.court,
      user: booking.user,
      start_datetime: booking.start_datetime,
      end_datetime: booking.end_datetime,
      total_price: booking.total_price,
      status: booking.status,
      booking_type: booking.booking_type,
      note: booking.note,
      created_at: booking.created_at
    }));
  }

  async getAllBookings() {
    const bookings = await db.Booking.findAll({
      where: {
        parent_booking_id: null
      },
      include: [{
        model: db.Court,
        as: 'court',
        attributes: ['id', 'name', 'location']
      }, {
        model: db.User,
        as: 'user',
        attributes: ['id', 'full_name', 'phone']
      }],
      order: [['created_at', 'DESC']]
    });

    return bookings.map(booking => ({
      id: booking.id,
      court: booking.court,
      user: booking.user,
      start_datetime: booking.start_datetime,
      end_datetime: booking.end_datetime,
      total_price: booking.total_price,
      status: booking.status,
      booking_type: booking.booking_type,
      note: booking.note,
      created_at: booking.created_at
    }));
  }

  async getBookingById(getBookingDTO) {
    const { booking_id, user_id, user_role } = getBookingDTO;

    const booking = await db.Booking.findOne({
      where: {
        id: booking_id,
        parent_booking_id: null
      },
      include: [{
        model: db.Court,
        as: 'court',
        attributes: ['id', 'name', 'location', 'owner_id']
      }, {
        model: db.User,
        as: 'user',
        attributes: ['id', 'full_name', 'phone', 'email']
      }, {
        model: db.Booking,
        as: 'childBookings',
        attributes: ['id', 'start_datetime', 'end_datetime', 'total_price', 'status']
      }]
    });

    if (!booking) {
      const error = new Error('Booking not found');
      error.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    // Check permission
    const isCustomer = booking.user_id === user_id;
    const isCourtOwner = booking.court.owner_id === user_id;
    const isAdmin = user_role === 'admin';

    if (!isCustomer && !isCourtOwner && !isAdmin) {
      const error = new Error('Permission denied');
      error.code = ERROR_CODES.PERMISSION_DENIED;
      throw error;
    }

    return {
      id: booking.id,
      court: {
        id: booking.court.id,
        name: booking.court.name,
        location: booking.court.location
      },
      user: booking.user,
      start_datetime: booking.start_datetime,
      end_datetime: booking.end_datetime,
      total_price: booking.total_price,
      status: booking.status,
      booking_type: booking.booking_type,
      note: booking.note,
      child_bookings: booking.childBookings,
      created_at: booking.created_at
    };
  }
}

module.exports = new BookingService();
