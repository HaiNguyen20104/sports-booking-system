const db = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
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
        ERROR_CODES.STATISTICS_FETCH_FAILED,
        MESSAGES.ERROR.STATISTICS_OVERVIEW_FAILED,
        500
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
        ERROR_CODES.STATISTICS_FETCH_FAILED,
        MESSAGES.ERROR.STATISTICS_MY_COURTS_FAILED,
        500
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
          ERROR_CODES.COURT_NOT_FOUND,
          MESSAGES.ERROR.COURT_NOT_FOUND,
          404
        );
      }

      // Kiểm tra quyền: chỉ owner hoặc admin mới được xem
      if (userRole !== ROLES.ADMIN && court.owner_id !== userId) {
        throw new AppError(
          ERROR_CODES.PERMISSION_DENIED,
          MESSAGES.ERROR.PERMISSION_DENIED,
          403
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
        ERROR_CODES.STATISTICS_FETCH_FAILED,
        MESSAGES.ERROR.STATISTICS_COURT_DETAIL_FAILED,
        500
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

  /**
   * Xuất báo cáo Excel
   * Admin: Toàn bộ dữ liệu hệ thống
   * Court Owner: Chỉ dữ liệu các sân của mình
   */
  async exportExcel(user, params = {}) {
    try {
      const { from, to, type = 'full' } = params;
      const isAdmin = user.role === ROLES.ADMIN;
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sports Booking System';
      workbook.created = new Date();

      // Style definitions
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      const cellStyle = {
        alignment: { horizontal: 'left', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // 1. Sheet: Tổng quan
      await this._addOverviewSheet(workbook, user, from, to, headerStyle, cellStyle, isAdmin);

      // 2. Sheet: Danh sách sân
      await this._addCourtsSheet(workbook, user, from, to, headerStyle, cellStyle, isAdmin);

      // 3. Sheet: Danh sách booking
      await this._addBookingsSheet(workbook, user, from, to, headerStyle, cellStyle, isAdmin);

      // 4. Sheet: Doanh thu
      await this._addRevenueSheet(workbook, user, from, to, headerStyle, cellStyle, isAdmin);

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      return {
        buffer,
        filename: `statistics_report_${new Date().toISOString().split('T')[0]}.xlsx`
      };
    } catch (error) {
      console.error('Export Excel error:', error);
      throw new AppError(
        ERROR_CODES.STATISTICS_EXPORT_FAILED,
        MESSAGES.ERROR.STATISTICS_EXPORT_FAILED,
        500
      );
    }
  }

  /**
   * Sheet 1: Tổng quan
   */
  async _addOverviewSheet(workbook, user, from, to, headerStyle, cellStyle, isAdmin) {
    const sheet = workbook.addWorksheet('Tổng quan');
    
    // Title
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = isAdmin ? 'BÁO CÁO THỐNG KÊ HỆ THỐNG' : 'BÁO CÁO THỐNG KÊ SÂN CỦA TÔI';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Date range
    sheet.mergeCells('A2:D2');
    const dateCell = sheet.getCell('A2');
    const fromDate = from || 'Từ đầu';
    const toDate = to || 'Đến nay';
    dateCell.value = `Thời gian: ${fromDate} - ${toDate}`;
    dateCell.alignment = { horizontal: 'center' };

    // Export date
    sheet.mergeCells('A3:D3');
    const exportCell = sheet.getCell('A3');
    exportCell.value = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
    exportCell.alignment = { horizontal: 'center' };

    // Get overview data
    let overviewData;
    if (isAdmin) {
      overviewData = await this.getOverview({ from, to });
    } else {
      overviewData = await this.getMyCourtsStatistics(user.id, { from, to });
    }

    // Data rows starting from row 5
    let rowNum = 5;
    const dataRows = [];

    if (isAdmin) {
      dataRows.push(
        ['Tổng số sân hoạt động', overviewData.total_courts],
        ['Tổng số khách hàng', overviewData.total_customers],
        ['Tổng số chủ sân', overviewData.total_court_owners],
        ['Tổng doanh thu (VND)', overviewData.total_revenue?.toLocaleString('vi-VN')],
        [''],
        ['THỐNG KÊ BOOKING', ''],
        ['Tổng số booking', overviewData.total_bookings],
        ['Booking đang chờ', overviewData.pending_bookings],
        ['Booking đã xác nhận', overviewData.confirmed_bookings],
        ['Booking đã hoàn thành', overviewData.completed_bookings],
        ['Booking đã hủy', overviewData.cancelled_bookings]
      );
    } else {
      dataRows.push(
        ['Tổng số sân của tôi', overviewData.total_courts],
        ['Tổng doanh thu (VND)', overviewData.total_revenue?.toLocaleString('vi-VN')],
        [''],
        ['THỐNG KÊ BOOKING', ''],
        ['Tổng số booking', overviewData.total_bookings],
        ['Booking đang chờ', overviewData.pending_bookings],
        ['Booking đã xác nhận', overviewData.confirmed_bookings],
        ['Booking đã hoàn thành', overviewData.completed_bookings],
        ['Booking đã hủy', overviewData.cancelled_bookings]
      );
    }

    dataRows.forEach(row => {
      const excelRow = sheet.getRow(rowNum);
      if (row[0] === '') {
        rowNum++;
        return;
      }
      if (row[0].startsWith('THỐNG KÊ')) {
        sheet.getCell(`A${rowNum}`).value = row[0];
        sheet.getCell(`A${rowNum}`).font = { bold: true };
      } else {
        sheet.getCell(`A${rowNum}`).value = row[0];
        sheet.getCell(`B${rowNum}`).value = row[1];
        Object.assign(sheet.getCell(`A${rowNum}`), cellStyle);
        Object.assign(sheet.getCell(`B${rowNum}`), cellStyle);
      }
      rowNum++;
    });

    // Set column widths
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 20;
  }

  /**
   * Sheet 2: Danh sách sân
   */
  async _addCourtsSheet(workbook, user, from, to, headerStyle, cellStyle, isAdmin) {
    const sheet = workbook.addWorksheet('Danh sách sân');

    // Headers
    const headers = ['STT', 'Tên sân', 'Địa chỉ', 'Chủ sân', 'Trạng thái', 'Tổng booking', 'Doanh thu (VND)'];
    const headerRow = sheet.getRow(1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      Object.assign(cell, headerStyle);
    });

    // Get courts data
    const whereClause = { is_deleted: false };
    if (!isAdmin) {
      whereClause.tblUserId = user.id;
    }

    const courts = await db.Court.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'owner',
          attributes: ['id', 'full_name', 'email']
        }
      ],
      order: [['id', 'DESC']]
    });

    // Build date filter for bookings
    const dateFilter = this._buildDateFilter(from, to);

    // Add data rows
    for (let i = 0; i < courts.length; i++) {
      const court = courts[i];
      
      // Get booking stats for this court
      const bookingCount = await db.Booking.count({
        where: {
          tblCourtId: court.id,
          is_deleted: false,
          parent_booking_id: null,
          ...dateFilter
        }
      });

      // Get revenue for this court
      const revenueResult = await db.Transaction.findOne({
        attributes: [
          [db.sequelize.fn('SUM', db.sequelize.col('Transaction.amount')), 'total']
        ],
        include: [{
          model: db.Booking,
          as: 'booking',
          attributes: [],
          where: {
            tblCourtId: court.id,
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

      const row = sheet.getRow(i + 2);
      const rowData = [
        i + 1,
        court.name,
        court.location || '',
        court.owner?.full_name || 'N/A',
        court.status,
        bookingCount,
        (parseFloat(revenueResult?.total) || 0).toLocaleString('vi-VN')
      ];

      rowData.forEach((value, index) => {
        const cell = row.getCell(index + 1);
        cell.value = value;
        Object.assign(cell, cellStyle);
      });
    }

    // Set column widths
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 40;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 18;
  }

  /**
   * Sheet 3: Danh sách booking
   */
  async _addBookingsSheet(workbook, user, from, to, headerStyle, cellStyle, isAdmin) {
    const sheet = workbook.addWorksheet('Danh sách booking');

    // Headers
    const headers = ['STT', 'Mã booking', 'Tên sân', 'Khách hàng', 'Ngày đặt', 'Thời gian', 'Trạng thái', 'Tổng tiền (VND)'];
    const headerRow = sheet.getRow(1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      Object.assign(cell, headerStyle);
    });

    // Build where clause
    const dateFilter = this._buildDateFilter(from, to);
    const courtWhereClause = {};
    if (!isAdmin) {
      courtWhereClause.tblUserId = user.id;
    }

    // Get bookings
    const bookings = await db.Booking.findAll({
      where: {
        is_deleted: false,
        parent_booking_id: null,
        ...dateFilter
      },
      include: [
        {
          model: db.Court,
          as: 'court',
          where: { ...courtWhereClause, is_deleted: false },
          attributes: ['id', 'name']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'full_name', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 1000 // Limit to prevent huge files
    });

    // Add data rows
    bookings.forEach((booking, index) => {
      const row = sheet.getRow(index + 2);
      
      // Extract date and time from start_datetime and end_datetime
      const startDate = booking.start_datetime ? new Date(booking.start_datetime) : null;
      const endDate = booking.end_datetime ? new Date(booking.end_datetime) : null;
      
      const bookingDate = startDate ? startDate.toLocaleDateString('vi-VN') : '';
      const startTime = startDate ? startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
      const endTime = endDate ? endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
      const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';
      
      const rowData = [
        index + 1,
        booking.id,
        booking.court?.name || 'N/A',
        booking.user?.full_name || 'N/A',
        bookingDate,
        timeRange,
        this._translateStatus(booking.status),
        (parseFloat(booking.total_price) || 0).toLocaleString('vi-VN')
      ];

      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        Object.assign(cell, cellStyle);
      });
    });

    // Set column widths
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 40;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 18;
    sheet.getColumn(8).width = 18;
  }

  /**
   * Sheet 4: Doanh thu
   */
  async _addRevenueSheet(workbook, user, from, to, headerStyle, cellStyle, isAdmin) {
    const sheet = workbook.addWorksheet('Doanh thu');

    // Headers
    const headers = ['STT', 'Mã giao dịch', 'Mã booking', 'Tên sân', 'Số tiền (VND)', 'Phương thức', 'Trạng thái', 'Ngày thanh toán'];
    const headerRow = sheet.getRow(1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      Object.assign(cell, headerStyle);
    });

    // Build where clause
    const courtWhereClause = {};
    if (!isAdmin) {
      courtWhereClause.tblUserId = user.id;
    }

    // Get transactions
    const transactions = await db.Transaction.findAll({
      where: {
        ...(from || to ? {
          created_at: {
            ...(from && { [Op.gte]: new Date(from) }),
            ...(to && { [Op.lte]: new Date(to + 'T23:59:59') })
          }
        } : {})
      },
      include: [
        {
          model: db.Booking,
          as: 'booking',
          where: { is_deleted: false },
          required: true,
          include: [{
            model: db.Court,
            as: 'court',
            where: { ...courtWhereClause, is_deleted: false },
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 1000
    });

    // Add data rows
    let totalRevenue = 0;
    transactions.forEach((transaction, index) => {
      const row = sheet.getRow(index + 2);
      
      if (transaction.status === TRANSACTION_STATUS.COMPLETED) {
        totalRevenue += parseFloat(transaction.amount) || 0;
      }

      const rowData = [
        index + 1,
        transaction.id,
        transaction.tblBookingId,
        transaction.booking?.court?.name || 'N/A',
        (parseFloat(transaction.amount) || 0).toLocaleString('vi-VN'),
        transaction.payment_method || 'N/A',
        this._translateTransactionStatus(transaction.status),
        transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('vi-VN') : ''
      ];

      rowData.forEach((value, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        cell.value = value;
        Object.assign(cell, cellStyle);
      });
    });

    // Add total row
    const totalRowNum = transactions.length + 3;
    const totalRow = sheet.getRow(totalRowNum);
    sheet.getCell(`D${totalRowNum}`).value = 'TỔNG DOANH THU:';
    sheet.getCell(`D${totalRowNum}`).font = { bold: true };
    sheet.getCell(`E${totalRowNum}`).value = totalRevenue.toLocaleString('vi-VN');
    sheet.getCell(`E${totalRowNum}`).font = { bold: true };

    // Set column widths
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 40;
    sheet.getColumn(3).width = 40;
    sheet.getColumn(4).width = 25;
    sheet.getColumn(5).width = 18;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 15;
    sheet.getColumn(8).width = 18;
  }

  /**
   * Translate booking status to Vietnamese
   */
  _translateStatus(status) {
    const statusMap = {
      [BOOKING_STATUS.PENDING]: 'Đang chờ',
      [BOOKING_STATUS.CONFIRMED]: 'Đã xác nhận',
      [BOOKING_STATUS.CANCELLED]: 'Đã hủy',
      [BOOKING_STATUS.COMPLETED]: 'Hoàn thành'
    };
    return statusMap[status] || status;
  }

  /**
   * Translate transaction status to Vietnamese
   */
  _translateTransactionStatus(status) {
    const statusMap = {
      [TRANSACTION_STATUS.PENDING]: 'Đang chờ',
      [TRANSACTION_STATUS.COMPLETED]: 'Thành công',
      [TRANSACTION_STATUS.FAILED]: 'Thất bại',
      [TRANSACTION_STATUS.REFUNDED]: 'Hoàn tiền'
    };
    return statusMap[status] || status;
  }
}

module.exports = new StatisticsService();
