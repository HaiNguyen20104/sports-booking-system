const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get VAPID public key (không cần auth)
router.get('/vapid-key', notificationController.getVapidKey);

// Get user notifications
router.get('/', authMiddleware, notificationController.getNotifications);

// Mark notification as read
router.patch('/:id/read', authMiddleware, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', authMiddleware, notificationController.markAllAsRead);

// Subscribe to push notifications
router.post('/subscribe', authMiddleware, notificationController.subscribe);

// Unsubscribe from push notifications
router.delete('/subscribe', authMiddleware, notificationController.unsubscribe);

module.exports = router;
