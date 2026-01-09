const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');
const { MESSAGES } = require('../constants');
const { SaveSubscriptionDTO, RemoveSubscriptionDTO } = require('../dtos/notification.dto');

class NotificationController {
  /**
   * GET /api/notifications
   * Lấy danh sách notifications của user
   */
  async getNotifications(req, res) {
    try {
      const notifications = await notificationService.getByUserId(req.user.id);
      const unreadCount = await notificationService.countUnread(req.user.id);

      return ApiResponse.success(res, {
        notifications,
        unread_count: unreadCount
      }, MESSAGES.SUCCESS.NOTIFICATION_LIST_FETCHED);
    } catch (error) {
      console.error('Get notifications error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.NOTIFICATION_LIST_FAILED);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Đánh dấu notification đã đọc
   */
  async markAsRead(req, res) {
    try {
      const notification = await notificationService.markAsRead(
        req.params.id,
        req.user.id
      );

      if (!notification) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.NOTIFICATION_NOT_FOUND);
      }

      return ApiResponse.success(res, notification, MESSAGES.SUCCESS.NOTIFICATION_MARKED_READ);
    } catch (error) {
      console.error('Mark as read error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.NOTIFICATION_UPDATE_FAILED);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Đánh dấu tất cả đã đọc
   */
  async markAllAsRead(req, res) {
    try {
      await notificationService.markAllAsRead(req.user.id);

      return ApiResponse.success(res, null, MESSAGES.SUCCESS.NOTIFICATION_ALL_MARKED_READ);
    } catch (error) {
      console.error('Mark all as read error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.NOTIFICATION_UPDATE_FAILED);
    }
  }

  /**
   * POST /api/notifications/subscribe
   * Lưu push subscription
   */
  async subscribe(req, res) {
    try {
      const { device_id, subscription } = req.body;

      if (!device_id || !subscription) {
        return ApiResponse.badRequest(res, MESSAGES.ERROR.VALIDATION_FAILED);
      }

      const saveSubscriptionDTO = new SaveSubscriptionDTO(
        req.user.id,
        device_id,
        subscription
      );

      const device = await notificationService.saveSubscription(saveSubscriptionDTO);

      if (!device) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.DEVICE_NOT_FOUND);
      }

      return ApiResponse.success(res, null, MESSAGES.SUCCESS.PUSH_SUBSCRIBED);
    } catch (error) {
      console.error('Subscribe error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.PUSH_SUBSCRIBE_FAILED);
    }
  }

  /**
   * DELETE /api/notifications/subscribe
   * Hủy push subscription
   */
  async unsubscribe(req, res) {
    try {
      const { device_id } = req.body;

      if (!device_id) {
        return ApiResponse.badRequest(res, MESSAGES.ERROR.VALIDATION_FAILED);
      }

      const removeSubscriptionDTO = new RemoveSubscriptionDTO(
        req.user.id,
        device_id
      );

      const device = await notificationService.removeSubscription(removeSubscriptionDTO);

      if (!device) {
        return ApiResponse.notFound(res, MESSAGES.ERROR.DEVICE_NOT_FOUND);
      }

      return ApiResponse.success(res, null, MESSAGES.SUCCESS.PUSH_UNSUBSCRIBED);
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return ApiResponse.error(res, MESSAGES.ERROR.PUSH_UNSUBSCRIBE_FAILED);
    }
  }
}

module.exports = new NotificationController();
