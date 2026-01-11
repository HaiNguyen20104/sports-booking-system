const db = require('../models');
const { Op } = require('sequelize');
const { ROLES, COURT_STATUS, BOOKING_STATUS, TRANSACTION_STATUS, ERROR_CODES, MESSAGES } = require('../constants');
const AppError = require('../utils/AppError');

class StatisticsService {
  /**
   * Thống kê tổng quan hệ thống (Admin)
   */
  async getOverview(params = {}) {
    try {
      const { from, to } = params;

      // Build date filter
      const dateFilter = this._buildDateFilter(from, to);

      // Tổng số sân đang hoạt động
      const totalCourts = await db.Court.count({
        where: {
          is_deleted: false,
          status: COURT_STATUS.ACTIVE,
        }
      });

      // Thống kê booking
      const bookingStats = await db.Booking.findAll({
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('Booking.id')), 'count'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_price')), 'total_price']
        ],
        where: {
          is_deleted: false,
          parent_booking_id: null,
          ...dateFilter
        },
        group: ['status'],
        raw: true
      });

      // Tổng doanh thu (chỉ tính booking đã confirmed và đã thanh toán)
      const revenueResult = await db.Transaction.findOne({
        attributes: [
          [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total_revenue']
        ],
        where: {
          status: TRANSACTION_STATUS.COMPLETED,
          ...(from || to ? {
            created_at: {
              ...(from && { [Op.gte]: new Date(from) }),
              ...(to && { [Op.lte]: new Date(to + 'T23:59:59') })
            }
          } : {})
        },
        raw: true
      });

      // Tổng số customers
      const totalCustomers = await db.User.count({
        where: { role: ROLES.CUSTOMER }
      });

      // Tổng số court owners
      const totalCourtOwners = await db.User.count({
        where: { role: ROLES.MANAGER }
      });

      // Parse booking stats
      const stats = {
        total_bookings: 0,
        confirmed_bookings: 0,
        pending_bookings: 0,
        cancelled_bookings: 0,
        completed_bookings: 0
      };

      bookingStats.forEach(item => {
        const count = parseInt(item.count) || 0;
        stats.total_bookings += count;

        switch (item.status) {
          case BOOKING_STATUS.CONFIRMED:
            stats.confirmed_bookings = count;
            break;
          case BOOKING_STATUS.PENDING:
            stats.pending_bookings = count;
            break;
          case BOOKING_STATUS.CANCELLED:
            stats.cancelled_bookings = count;
            break;
          case BOOKING_STATUS.COMPLETED:
            stats.completed_bookings = count;
            break;
        }
      });

      return {
        total_courts: totalCourts,
        total_customers: totalCustomers,
        total_court_owners: totalCourtOwners,
        total_revenue: parseFloat(revenueResult?.total_revenue) || 0,
        ...stats
      };
    } catch (error) {
      console.error('Statistics overview error:', error);
      throw new AppError(
        MESSAGES.ERROR.STATISTICS_OVERVIEW_FAILED,
        500,
        ERROR_CODES.STATISTICS_FETCH_FAILED
      );
    }
  }

  /**
   * Thống kê tất cả sân của chủ sân (Court Owner)
   */
  async getMyCourtsStatistics(ownerId, params = {}) {
    try {
      const { from, to } = params;
      const dateFilter = this._buildDateFilter(from, to);

      // Lấy tất cả sân của chủ sân
      const courts = await db.Court.findAll({
        where: {
          owner_id: ownerId,
          is_deleted: false
        },
        attributes: ['id', 'name', 'status', 'location'],
        raw: true
      });

      const courtIds = courts.map(c => c.id);

      if (courtIds.length === 0) {
        return {
          total_courts: 0,
          active_courts: 0,
          inactive_courts: 0,
          total_bookings: 0,
          total_revenue: 0,
          booking_stats: {
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0
          }
        };
      }

      // Thống kê booking cho tất cả sân
      const bookingStats = await db.Booking.findAll({
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('Booking.id')), 'count'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_price')), 'total_price']
        ],
        where: {
          tblCourtId: { [Op.in]: courtIds },
          is_deleted: false,
          parent_booking_id: null,
          ...dateFilter
        },
        group: ['status'],
        raw: true
      });

      // Tổng doanh thu từ transactions
      const revenueResult = await db.Transaction.findOne({
        attributes: [
          [db.sequelize.fn('SUM', db.sequelize.col('Transaction.amount')), 'total_revenue']
        ],
        include: [{
          model: db.Booking,
          as: 'booking',
          attributes: [],
          where: {
            tblCourtId: { [Op.in]: courtIds },
            is_deleted: false
          }
        }],
        where: {
          status: TRANSACTION_STATUS.COMPLETED,
          ...(from || to ? {
            created_at: {
              ...(from && { [Op.gte]: new Date(from) }),
              ...(to && { [Op.lte]: new Date(to + 'T23:59:59') })
            }
          } : {})
        },
        raw: true
      });

      // Parse overall booking stats
      const overallStats = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      };
      let totalBookings = 0;

      bookingStats.forEach(item => {
        const count = parseInt(item.count) || 0;
        totalBookings += count;
        if (overallStats.hasOwnProperty(item.status)) {
          overallStats[item.status] = count;
        }
      });

      return {
        total_courts: courts.length,
        active_courts: courts.filter(c => c.status === COURT_STATUS.ACTIVE).length,
        inactive_courts: courts.filter(c => c.status !== COURT_STATUS.ACTIVE).length,
        total_bookings: totalBookings,
        total_revenue: parseFloat(revenueResult?.total_revenue) || 0,
        booking_stats: overallStats
      };
    } catch (error) {
      console.error('My courts statistics error:', error);
      throw new AppError(
        MESSAGES.ERROR.STATISTICS_MY_COURTS_FAILED,
        500,
        ERROR_CODES.STATISTICS_FETCH_FAILED
      );
    }
  }

  /**
   * Thống kê chi tiết 1 sân cụ thể (Court Owner, Admin)
   */
  async getCourtStatistics(courtId, userId, userRole, params = {}) {
    try {
      const { from, to } = params;
      const dateFilter = this._buildDateFilter(from, to);

      // Lấy thông tin sân
      const court = await db.Court.findOne({
        where: {
          id: courtId,
          is_deleted: false
        },
        attributes: ['id', 'name', 'status', 'location', 'description', 'slot_duration', 'owner_id'],
        raw: true
      });

      if (!court) {
        throw new AppError(
          MESSAGES.ERROR.COURT_NOT_FOUND,
          404,
          ERROR_CODES.COURT_NOT_FOUND
        );
      }

      // Kiểm tra quyền: chỉ owner hoặc admin mới được xem
      if (userRole !== ROLES.ADMIN && court.owner_id !== userId) {
        throw new AppError(
          MESSAGES.ERROR.PERMISSION_DENIED,
          403,
          ERROR_CODES.PERMISSION_DENIED
        );
      }

      // Thống kê booking theo status
      const bookingStats = await db.Booking.findAll({
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('Booking.id')), 'count'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_price')), 'total_price']
        ],
        where: {
          tblCourtId: courtId,
          is_deleted: false,
          parent_booking_id: null,
          ...dateFilter
        },
        group: ['status'],
        raw: true
      });

      // Tổng doanh thu
      const revenueResult = await db.Transaction.findOne({
        attributes: [
          [db.sequelize.fn('SUM', db.sequelize.col('Transaction.amount')), 'total_revenue']
        ],
        include: [{
          model: db.Booking,
          as: 'booking',
          attributes: [],
          where: {
            tblCourtId: courtId,
            is_deleted: false
          }
        }],
        where: {
          status: TRANSACTION_STATUS.COMPLETED,
          ...(from || to ? {
            created_at: {
              ...(from && { [Op.gte]: new Date(from) }),
              ...(to && { [Op.lte]: new Date(to + 'T23:59:59') })
            }
          } : {})
        },
        raw: true
      });

      // Thống kê theo ngày trong tuần (0 = CN, 1 = T2, ...)
      const bookingByDayOfWeek = await db.Booking.findAll({
        attributes: [
          [db.sequelize.fn('DAYOFWEEK', db.sequelize.col('start_datetime')), 'day_of_week'],
          [db.sequelize.fn('COUNT', db.sequelize.col('Booking.id')), 'count']
        ],
        where: {
          tblCourtId: courtId,
          is_deleted: false,
          parent_booking_id: null,
          status: { [Op.in]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
          ...dateFilter
        },
        group: [db.sequelize.fn('DAYOFWEEK', db.sequelize.col('start_datetime'))],
        raw: true
      });

      // Thống kê theo giờ trong ngày
      const bookingByHour = await db.Booking.findAll({
        attributes: [
          [db.sequelize.fn('HOUR', db.sequelize.col('start_datetime')), 'hour'],
          [db.sequelize.fn('COUNT', db.sequelize.col('Booking.id')), 'count']
        ],
        where: {
          tblCourtId: courtId,
          is_deleted: false,
          parent_booking_id: null,
          status: { [Op.in]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
          ...dateFilter
        },
        group: [db.sequelize.fn('HOUR', db.sequelize.col('start_datetime'))],
        raw: true
      });

      // Top khách hàng (đặt nhiều nhất)
      const topCustomers = await db.Booking.findAll({
        attributes: [
          'tblUserId',
          [db.sequelize.fn('COUNT', db.sequelize.col('Booking.id')), 'booking_count'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_price')), 'total_spent']
        ],
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['full_name', 'email', 'phone']
        }],
        where: {
          tblCourtId: courtId,
          is_deleted: false,
          parent_booking_id: null,
          status: { [Op.in]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
          ...dateFilter
        },
        group: ['tblUserId', 'user.id'],
        order: [[db.sequelize.fn('COUNT', db.sequelize.col('Booking.id')), 'DESC']],
        limit: 5,
        raw: true,
        nest: true
      });

      // Parse booking stats
      const stats = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
      };
      let totalBookings = 0;

      bookingStats.forEach(item => {
        const count = parseInt(item.count) || 0;
        totalBookings += count;
        if (stats.hasOwnProperty(item.status)) {
          stats[item.status] = count;
        }
      });

      // Parse day of week stats
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayOfWeekStats = dayNames.map((name, index) => {
        const found = bookingByDayOfWeek.find(d => parseInt(d.day_of_week) === index + 1);
        return {
          day: index,
          day_name: name,
          count: found ? parseInt(found.count) : 0
        };
      });

      // Parse hour stats
      const hourStats = [];
      for (let h = 0; h < 24; h++) {
        const found = bookingByHour.find(item => parseInt(item.hour) === h);
        hourStats.push({
          hour: h,
          count: found ? parseInt(found.count) : 0
        });
      }

      return {
        court: {
          id: court.id,
          name: court.name,
          status: court.status,
          location: court.location,
          description: court.description,
          slot_duration: court.slot_duration
        },
        total_bookings: totalBookings,
        total_revenue: parseFloat(revenueResult?.total_revenue) || 0,
        booking_stats: stats,
        booking_by_day_of_week: dayOfWeekStats,
        booking_by_hour: hourStats,
        top_customers: topCustomers.map(c => ({
          user_id: c.tblUserId,
          full_name: c.user?.full_name,
          email: c.user?.email,
          phone: c.user?.phone,
          booking_count: parseInt(c.booking_count) || 0,
          total_spent: parseFloat(c.total_spent) || 0
        }))
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Court statistics error:', error);
      throw new AppError(
        MESSAGES.ERROR.STATISTICS_COURT_DETAIL_FAILED,
        500,
        ERROR_CODES.STATISTICS_FETCH_FAILED
      );
    }
  }

  _buildDateFilter(from, to) {
    if (!from && !to) return {};

    const filter = { created_at: {} };

    if (from) {
      filter.created_at[Op.gte] = new Date(from);
    }
    if (to) {
      filter.created_at[Op.lte] = new Date(to + 'T23:59:59');
    }

    return filter;
  }
}

module.exports = new StatisticsService();
