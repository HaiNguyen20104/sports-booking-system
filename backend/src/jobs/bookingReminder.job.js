const cron = require('node-cron');
const db = require('../models');
const notificationService = require('../services/notification.service');
const { Op } = require('sequelize');

/**
 * Cronjob nhắc nhở user trước 30 phút khi có booking
 * Chạy mỗi 2 phút
 */
class BookingReminderJob {
  start() {
    // Chạy mỗi 2 phút: */2 * * * *
    cron.schedule('*/2 * * * *', async () => {
      console.log('[BookingReminder] Running at:', new Date().toISOString());
      await this.sendReminders();
    });

    console.log('[BookingReminder] Job scheduled - runs every 2 minutes');
  }

  async sendReminders() {
    try {
      const now = new Date();
      // Từ thời gian hiện tại đến 30 phút tới
      const maxTime = new Date(now.getTime() + 30 * 60 * 1000);

      console.log('[BookingReminder] Checking bookings between:', now, 'and', maxTime);

      // Lấy bookings sắp đến giờ, chưa được nhắc
      const bookings = await db.Booking.findAll({
        where: {
          status: 'confirmed',
          reminder_sent: false,
          is_deleted: false,
          start_datetime: {
            [Op.between]: [now, maxTime]
          }
        },
        include: [{
          model: db.Court,
          as: 'court',
          attributes: ['id', 'name', 'location']
        }]
      });

      console.log(`[BookingReminder] Found ${bookings.length} bookings to remind`);

      for (const booking of bookings) {
        await this.sendReminderForBooking(booking);
      }
    } catch (error) {
      console.error('[BookingReminder] Error:', error.message);
    }
  }

  async sendReminderForBooking(booking) {
    try {
      const startDate = new Date(booking.start_datetime);
      const timeStr = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = startDate.toLocaleDateString('vi-VN');

      const courtName = booking.court?.name || 'sân đã đặt';
      const location = booking.court?.location ? ` tại ${booking.court.location}` : '';

      const message = `Bạn có lịch đá ${courtName} tại ${location} lúc ${timeStr} ngày ${dateStr}. Hãy đến sớm 10-15 phút nhé!`;

      // Gửi notification cho user
      await notificationService.create({
        userId: booking.tblUserId,
        title: 'Nhắc nhở đặt sân',
        message,
        type: 'reminder',
        data: { bookingId: booking.id }
      });

      // Đánh dấu đã nhắc để không nhắc lại
      await booking.update({ reminder_sent: true });

      console.log(`[BookingReminder] Sent reminder for booking ${booking.id} to user ${booking.tblUserId}`);
    } catch (error) {
      console.error(`[BookingReminder] Failed to send reminder for booking ${booking.id}:`, error.message);
    }
  }
}

module.exports = new BookingReminderJob();
