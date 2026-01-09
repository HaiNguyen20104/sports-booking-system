const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create checkout session (requires auth)
router.post('/create-checkout', authMiddleware, paymentController.createCheckoutSession);

// Stripe webhook 
router.post('/webhook', paymentController.handleWebhook);

// Get payment status (requires auth)
router.get('/status/:bookingId', authMiddleware, paymentController.getPaymentStatus);

module.exports = router;
module.exports.webhookHandler = paymentController.handleWebhook;
