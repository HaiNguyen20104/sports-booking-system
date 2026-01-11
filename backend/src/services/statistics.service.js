const db = require('../models');
const { Op } = require('sequelize');
const { ROLES, COURT_STATUS, BOOKING_STATUS, TRANSACTION_STATUS, ERROR_CODES, MESSAGES } = require('../constants');
const AppError = require('../utils/AppError');

class StatisticsService {
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
