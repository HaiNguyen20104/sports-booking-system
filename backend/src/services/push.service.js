const webpush = require('../config/webpush');
const db = require('../models');

class PushService {
  /**
   * Gửi push notification đến tất cả devices của user
   * @param {string} userId - ID của user
   * @param {object} payload - Nội dung notification { title, body, data }
   */
  async sendToUser(userId, payload) {
    // Lấy tất cả devices có push subscription của user
    const devices = await db.Device.findAll({
      where: {
        tblUserId: userId,
        push_endpoint: { [db.Sequelize.Op.ne]: null }
      }
    });

    const results = {
      success: 0,
      failed: 0
    };

    for (const device of devices) {
      try {
        const subscription = {
          endpoint: device.push_endpoint,
          keys: {
            p256dh: device.push_p256dh,
            auth: device.push_auth
          }
        };

        await webpush.sendNotification(
          subscription,
          JSON.stringify(payload)
        );

        results.success++;
      } catch (error) {
        console.error(`Push failed for device ${device.id}:`, error.message);
        results.failed++;

        // Nếu subscription không còn valid, xóa push info
        if (error.statusCode === 410 || error.statusCode === 404) {
          await device.update({
            push_endpoint: null,
            push_p256dh: null,
            push_auth: null
          });
        }
      }
    }

    return results;
  }

  /**
   * Gửi push notification đến nhiều users
   * @param {array} userIds - Mảng ID của users
   * @param {object} payload - Nội dung notification
   */
  async sendToUsers(userIds, payload) {
    const results = {
      success: 0,
      failed: 0
    };

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, payload);
      results.success += result.success;
      results.failed += result.failed;
    }

    return results;
  }
}

module.exports = new PushService();
