const db = require('../models');
const pushService = require('./push.service');
const { generateId } = require('../utils/generateId');

class NotificationService {
  /**
   * Tạo notification và gửi push
   * @param {object} data - { userId, title, message, type, data }
   */
  async create(data) {
    const { userId, title, message, type, data: extraData } = data;

    // Lưu vào DB
    const notification = await db.Notification.create({
      id: generateId('NF', 10),
      title,
      message,
      type,
      tblUserId: userId
    });

    // Gửi push notification
    await pushService.sendToUser(userId, {
      title,
      body: message,
      data: {
        notificationId: notification.id,
        type,
        ...extraData
      }
    });

    return notification;
  }

  /**
   * Tạo notification cho nhiều users
   * @param {array} userIds - Mảng userId
   * @param {object} data - { title, message, type, data }
   */
  async createForUsers(userIds, data) {
    const notifications = [];

    for (const userId of userIds) {
      const notification = await this.create({
        userId,
        ...data
      });
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Lấy danh sách notifications của user
   */
  async getByUserId(userId) {
    return await db.Notification.findAll({
      where: { tblUserId: userId },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Đánh dấu đã đọc
   */
  async markAsRead(notificationId, userId) {
    const notification = await db.Notification.findOne({
      where: {
        id: notificationId,
        tblUserId: userId
      }
    });

    if (!notification) {
      return null;
    }

    await notification.update({ is_read: true });
    return notification;
  }

  /**
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(userId) {
    await db.Notification.update(
      { is_read: true },
      { where: { tblUserId: userId, is_read: false } }
    );
  }

  /**
   * Đếm số notification chưa đọc
   */
  async countUnread(userId) {
    return await db.Notification.count({
      where: { tblUserId: userId, is_read: false }
    });
  }

  /**
   * Lưu push subscription vào device
   */
  async saveSubscription(saveSubscriptionDTO) {
    const { user_id, device_id, endpoint, p256dh, auth } = saveSubscriptionDTO;

    const device = await db.Device.findOne({
      where: {
        id: device_id,
        tblUserId: user_id
      }
    });

    if (!device) {
      return null;
    }

    await device.update({
      push_endpoint: endpoint,
      push_p256dh: p256dh,
      push_auth: auth
    });

    return device;
  }

  /**
   * Xóa push subscription
   */
  async removeSubscription(removeSubscriptionDTO) {
    const { user_id, device_id } = removeSubscriptionDTO;

    const device = await db.Device.findOne({
      where: {
        id: device_id,
        tblUserId: user_id
      }
    });

    if (!device) {
      return null;
    }

    await device.update({
      push_endpoint: null,
      push_p256dh: null,
      push_auth: null
    });

    return device;
  }
}

module.exports = new NotificationService();
